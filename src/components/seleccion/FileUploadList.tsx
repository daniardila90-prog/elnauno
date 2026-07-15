"use client";

import { useEffect, useState } from "react";
import type { FileKind, ProposalFile } from "@/lib/supabase/types";

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

  useEffect(() => {
    fetch(`/api/seleccion/proposals/${proposalId}/files`)
      .then((r) => r.json())
      .then((all: ProposalFile[]) => {
        const own = all.filter((f) => f.kind === kind);
        setFiles(own);
        onCountChange?.(own.length);
      });
    // onCountChange intentionally excluded to avoid refetch loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, kind]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    onError?.(null);
    setUploading(true);
    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);
        const res = await fetch(`/api/seleccion/proposals/${proposalId}/files`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Error al subir el archivo.");
        }
        const fileRow = await res.json();
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
          className="hidden"
          onChange={handleUpload}
          disabled={uploading}
        />
      </label>

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
