"use client";

import { useEffect, useState } from "react";
import type { ProposalFile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { stripImageMetadata } from "@/lib/strip-metadata";
import {
  BUCKET,
  KIND_RULES,
  MAX_SIZE_BYTES,
  acceptAttr,
  extensionOf,
  formatsLabel,
  type UploadKind,
} from "@/lib/uploads";

/** Lee la respuesta como JSON sin reventar si el servidor devolvió texto/HTML. */
async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body?.error ?? fallback;
  } catch {
    if (res.status === 413) return "El archivo es demasiado grande.";
    return `${fallback} (error ${res.status})`;
  }
}

export default function FileUploadList({
  proposalId,
  kind,
  onError,
  onCountChange,
}: {
  proposalId: string;
  kind: UploadKind;
  onError?: (message: string | null) => void;
  onCountChange?: (count: number) => void;
}) {
  const rule = KIND_RULES[kind];
  const [files, setFiles] = useState<ProposalFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const full = files.length >= rule.max;

  useEffect(() => {
    fetch(`/api/seleccion/proposals/${proposalId}/files`)
      .then((r) => r.json())
      .then((all: ProposalFile[]) => {
        const own = all.filter((f) => f.kind === kind);
        setFiles(own);
        onCountChange?.(own.length);
      })
      .catch(() => {});
    // onCountChange intentionally excluded to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, kind]);

  async function uploadOne(original: File) {
    // Validación en el navegador para dar feedback inmediato.
    const ext = extensionOf(original.name);
    if (!rule.extensions.includes(ext as never)) {
      throw new Error(`Formato no permitido (.${ext}). En esta sección se acepta ${formatsLabel(kind)}.`);
    }

    // Anonimato: se quitan los metadatos de las imágenes (EXIF/autor/GPS) antes de
    // subirlas, sin recomprimir. Si falla, devuelve el original intacto.
    const file = await stripImageMetadata(original);

    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(
        `"${file.name}" pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es 50 MB.`
      );
    }

    // 1) Pedimos una URL firmada (petición diminuta, sin límite de tamaño).
    const signRes = await fetch(`/api/seleccion/proposals/${proposalId}/files/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, file_name: file.name, size: file.size }),
    });
    if (!signRes.ok) {
      throw new Error(await readError(signRes, "No se pudo preparar la subida."));
    }
    const { path, token } = await signRes.json();

    // 2) Subimos el archivo DIRECTO a Supabase Storage (sin pasar por Vercel).
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .uploadToSignedUrl(path, token, file, { contentType: file.type || undefined });
    if (uploadError) {
      throw new Error(`No se pudo subir "${file.name}": ${uploadError.message}`);
    }

    // 3) Registramos el archivo en la propuesta.
    const regRes = await fetch(`/api/seleccion/proposals/${proposalId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, storage_path: path, file_name: file.name }),
    });
    if (!regRes.ok) {
      throw new Error(await readError(regRes, "No se pudo registrar el archivo."));
    }
    return (await regRes.json()) as ProposalFile;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    onError?.(null);

    if (files.length + selected.length > rule.max) {
      const restantes = rule.max - files.length;
      onError?.(
        restantes === 0
          ? `Ya subió el máximo de ${rule.max} ${rule.max === 1 ? "archivo" : "archivos"} en esta sección. Elimine uno para reemplazarlo.`
          : `Solo puede subir ${rule.max} ${rule.max === 1 ? "archivo" : "archivos"} en esta sección: le ${restantes === 1 ? "queda 1" : `quedan ${restantes}`}.`
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        setProgress(
          selected.length > 1
            ? `Subiendo ${i + 1} de ${selected.length}: ${file.name}…`
            : `Subiendo ${file.name}…`
        );
        const fileRow = await uploadOne(file);
        setFiles((prev) => {
          const next = [...prev, fileRow];
          onCountChange?.(next.length);
          return next;
        });
      }
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al subir el archivo.");
    } finally {
      setUploading(false);
      setProgress(null);
      e.target.value = "";
    }
  }

  async function handleDelete(fileId: string) {
    await fetch(`/api/seleccion/proposals/${proposalId}/files?fileId=${fileId}`, {
      method: "DELETE",
    });
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId);
      onCountChange?.(next.length);
      return next;
    });
  }

  return (
    <div>
      <label
        className={`inline-flex items-center rounded-lg border border-dashed border-taupe/50 bg-sand/20 px-4 py-2 text-sm text-forest/70 ${
          full || uploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-sand/40"
        }`}
      >
        {uploading ? "Subiendo…" : full ? "Máximo alcanzado" : rule.max > 1 ? "Elegir archivos" : "Elegir archivo"}
        <input
          type="file"
          multiple={rule.max > 1}
          accept={acceptAttr(kind)}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading || full}
        />
      </label>

      {progress && <p className="mt-2 text-xs text-forest/60">{progress}</p>}

      <p className="mt-2 text-xs text-forest/40">
        Para mantener el anonimato, al subir se eliminan los metadatos de las imágenes. En PDF,
        expórtelo sin datos de autor ni logotipos.
      </p>

      <ul className="mt-4 divide-y divide-taupe/20 rounded-lg border border-taupe/20">
        {files.length === 0 && (
          <li className="px-4 py-4 text-center text-sm text-forest/40">Aún no hay archivos subidos.</li>
        )}
        {files.map((f) => (
          <li key={f.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span className="text-forest/80">{f.file_name}</span>
            <button
              type="button"
              onClick={() => handleDelete(f.id)}
              className="text-xs text-forest/50 hover:text-red-600"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
