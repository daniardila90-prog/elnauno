"use client";

import { useState, useTransition } from "react";
import { revealIdentity } from "@/app/seleccion/admin/(dashboard)/propuestas/[id]/actions";

export default function RevealIdentityButton({
  proposalId,
  isOpen,
  availableFromLabel,
}: {
  proposalId: string;
  isOpen: boolean;
  availableFromLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [asking, setAsking] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <p className="text-xs leading-relaxed text-forest/50">
        La identidad podrá revelarse a partir del{" "}
        <span className="font-medium text-forest/80">{availableFromLabel}</span>, con la clave que
        custodia el organizador.
      </p>
    );
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="eyebrow rounded-full border border-taupe-dark/40 bg-sand/30 px-5 py-2 text-xs text-forest transition hover:bg-sand/60"
      >
        Revelar identidad
      </button>
    );
  }

  function submit() {
    setError(null);
    if (!passphrase.trim()) {
      setError("Escriba la clave de revelación.");
      return;
    }
    startTransition(async () => {
      const result = await revealIdentity(proposalId, passphrase.trim());
      if (result.ok) {
        setPassphrase("");
        setAsking(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <p className="text-xs leading-relaxed text-forest/60">
        Escriba la clave de revelación que custodia el organizador. Esta acción queda registrada.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          autoComplete="off"
          placeholder="Clave de revelación"
          className="min-w-0 flex-1 rounded-lg border border-taupe/40 bg-white px-3 py-2 text-sm text-forest shadow-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/10"
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="eyebrow flex-none rounded-full bg-forest px-5 py-2 text-xs text-white transition hover:bg-forest/90 disabled:opacity-50"
        >
          {isPending ? "Verificando…" : "Revelar"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          setError(null);
          setPassphrase("");
        }}
        className="mt-2 text-xs text-forest/40 hover:text-forest"
      >
        Cancelar
      </button>
    </div>
  );
}
