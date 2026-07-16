"use client";

import { useState } from "react";
import type { Proposal } from "@/lib/supabase/types";
import type { IdentityForPdf, PdfFile } from "@/lib/pdf/build-proposal-pdf";

/**
 * El PDF se arma en el navegador: los adjuntos se bajan directo de Storage con
 * URLs firmadas y nunca pasan por la función serverless, que limita el tamaño
 * de las respuestas. pdf-lib se carga solo al pulsar el botón.
 */
export default function DownloadProposalPdfButton({
  proposal,
  files,
  identity,
}: {
  proposal: Proposal;
  files: PdfFile[];
  identity: IdentityForPdf;
}) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function download() {
    setState("working");
    try {
      const { buildProposalPdf } = await import("@/lib/pdf/build-proposal-pdf");
      const bytes = await buildProposalPdf({ proposal, files, identity });
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${proposal.proposal_code}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={download}
        disabled={state === "working"}
        className="eyebrow inline-flex w-full items-center justify-center rounded-full bg-forest px-5 py-2.5 text-xs text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "working" ? "Generando PDF…" : "Descargar propuesta en PDF"}
      </button>
      <p className="mt-2 text-xs text-forest/40">
        {state === "error"
          ? "No se pudo generar el PDF. Recargue la página e intente de nuevo."
          : `Respuestas y archivos en un solo documento: ${proposal.proposal_code}.pdf`}
      </p>
    </div>
  );
}
