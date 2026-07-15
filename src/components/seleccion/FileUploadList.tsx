"use client";

import { useEffect, useState } from "react";
import type { FileKind, ProposalFile } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { ACCEPT_ATTR, BUCKET, MAX_SIZE_BYTES, extensionOf, ALLOWED_EXTENSIONS } from "@/lib/uploads";

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
  multiple = false,
  onError,
  onCountChange,
}: {
  proposalId: string;
  kind: FileKind;
  multiple?: boolean;
  onError?: (message: string | null) => void;
  onCountChange?: (count: number) => void;
}) {
  const [files, setFiles] = useState<ProposalFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

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

  async function uploadOne(file: File) {
    // Validación en el navegador para dar feedback inmediato.
    const ext = extensionOf(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Formato no permitido (.${ext}). Use PDF, imágenes, DWG/DXF o ZIP.`);
    }
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
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-dashed border-taupe/50 bg-sand/20 px-4 py-2 text-sm text-forest/70 hover:bg-sand/40">
        {uploading ? "Subiendo…" : multiple ? "Elegir archivos" : "Elegir archivo"}
        <input
          type="file"
          multiple={multiple}
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

      {progress && <p className="mt-2 text-xs text-forest/60">{progress}</p>}

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
