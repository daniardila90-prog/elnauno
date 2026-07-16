"use client";

import { useState } from "react";

/**
 * Enlace privado para retomar la propuesta desde cualquier equipo.
 * Lleva el id (UUID) de la propuesta, que no es adivinable: quien tenga el
 * enlace puede continuar el borrador.
 */
export default function ResumeLink({
  proposalId,
  proposalCode,
}: {
  proposalId: string;
  proposalCode: string | null;
}) {
  const [copied, setCopied] = useState(false);

  // Este componente solo se renderiza en el navegador (cuando ya existe la
  // propuesta), así que window siempre está disponible aquí.
  const url =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/seleccion/participar?id=${proposalId}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* si el navegador lo bloquea, el enlace sigue visible para copiar a mano */
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-taupe/30 bg-sand/20 p-4">
      <p className="eyebrow text-xs text-taupe-dark">Su progreso se guarda automáticamente</p>
      <p className="mt-1 text-xs leading-relaxed text-forest/60">
        En este navegador puede cerrar y volver a{" "}
        <span className="whitespace-nowrap">/seleccion/participar</span>: retomará donde quedó, sin
        volver a escribir el código de invitación.
      </p>

      <div className="mt-3 border-t border-taupe/20 pt-3">
        <p className="text-xs leading-relaxed text-forest/60">
          <span className="font-medium text-forest">Para continuar en otro computador</span> guarde
          este enlace. Es la única forma de retomar la propuesta fuera de este navegador:
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate font-mono text-xs text-forest/80" title={url}>
            {url}
          </p>
          <button
            type="button"
            onClick={copy}
            className="eyebrow flex-none rounded-full border border-taupe/50 bg-white px-4 py-1.5 text-xs text-forest transition hover:bg-sand/40"
          >
            {copied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
      </div>

      {proposalCode && (
        <p className="mt-3 border-t border-taupe/20 pt-3 text-xs leading-relaxed text-forest/50">
          Referencia de su propuesta:{" "}
          <span className="font-medium text-forest/80">{proposalCode}</span>. Identifica su envío de
          forma anónima ante el organizador; no es una contraseña ni sirve para volver a entrar.
        </p>
      )}
    </div>
  );
}
