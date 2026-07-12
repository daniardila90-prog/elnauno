"use client";

import { useState, useTransition } from "react";
import { EVALUATION_CRITERIA, type Evaluation } from "@/lib/supabase/types";
import { saveEvaluation } from "@/app/seleccion/admin/(dashboard)/propuestas/[id]/actions";

export default function EvaluationForm({
  proposalId,
  myEvaluation,
}: {
  proposalId: string;
  myEvaluation: Evaluation | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await saveEvaluation(proposalId, formData);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {EVALUATION_CRITERIA.map((c) => (
        <div key={c.key}>
          <div className="flex items-center justify-between">
            <label htmlFor={c.key} className="text-sm font-medium text-forest">
              {c.label}
            </label>
            <span className="text-xs text-forest/40">{c.hint}</span>
          </div>
          <input
            id={c.key}
            name={c.key}
            type="range"
            min={0}
            max={10}
            step={1}
            defaultValue={myEvaluation?.[c.key] ?? 5}
            className="mt-2 w-full accent-forest"
            onInput={(e) => {
              const output = document.getElementById(`${c.key}-out`);
              if (output) output.textContent = (e.target as HTMLInputElement).value;
            }}
          />
          <div className="mt-0.5 text-right text-xs text-forest/50">
            <span id={`${c.key}-out`}>{myEvaluation?.[c.key] ?? 5}</span>/10
          </div>
        </div>
      ))}

      <label className="block">
        <span className="text-sm font-medium text-forest">Comentarios</span>
        <textarea
          name="comments"
          rows={3}
          defaultValue={myEvaluation?.comments ?? ""}
          className="mt-1.5 w-full rounded-lg border border-taupe/40 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="eyebrow inline-flex items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90 disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar evaluación"}
        </button>
        {saved && !isPending && <span className="text-sm text-emerald-600">Guardado ✓</span>}
      </div>
    </form>
  );
}
