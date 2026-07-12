"use client";

import { useTransition } from "react";
import { revealIdentity } from "@/app/seleccion/admin/(dashboard)/propuestas/[id]/actions";

export default function RevealIdentityButton({ proposalId }: { proposalId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          if (confirm("¿Revelar la identidad de esta propuesta? Esta acción queda registrada.")) {
            await revealIdentity(proposalId);
          }
        })
      }
      disabled={isPending}
      className="eyebrow rounded-full border border-taupe-dark/40 bg-sand/30 px-5 py-2 text-xs text-forest transition hover:bg-sand/60 disabled:opacity-50"
    >
      {isPending ? "Revelando…" : "Revelar identidad"}
    </button>
  );
}
