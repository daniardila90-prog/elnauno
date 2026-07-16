"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { EVALUATION_CRITERIA, type Evaluation } from "@/lib/supabase/types";
import { saveEvaluation } from "@/app/seleccion/admin/(dashboard)/propuestas/[id]/actions";

const NAME_KEY = "nauno-evaluador";

/** Debe coincidir con la columna generada evaluator_key de la base. */
function normalize(name: string) {
  return name.trim().toLowerCase();
}

export default function EvaluationForm({
  proposalId,
  evaluations,
}: {
  proposalId: string;
  evaluations: Evaluation[];
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  // El nombre se recuerda en este navegador para no reescribirlo en cada
  // propuesta. No identifica a nadie ante la base: solo separa las notas.
  // localStorage no existe al renderizar en el servidor, así que leerlo tras
  // montar es la única vía; hacerlo en el render rompería la hidratación.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setName(stored);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const mine = useMemo(
    () => evaluations.find((e) => e.evaluator_key === normalize(name)) ?? null,
    [evaluations, name]
  );
  const others = evaluations.filter((e) => e !== mine);

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await saveEvaluation(proposalId, formData);
      if (result.ok) {
        try {
          localStorage.setItem(NAME_KEY, name.trim());
        } catch {
          /* ignorar */
        }
        setSaved(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-forest">Su nombre</span>
        <span className="mt-0.5 block text-xs text-forest/50">
          Los socios comparten una cuenta: sin su nombre, su nota reemplazaría la de otro.
        </span>
        <input
          name="evaluator_name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          autoComplete="off"
          placeholder="Ej.: María Ardila"
          className="mt-1.5 w-full rounded-lg border border-taupe/40 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
        />
      </label>

      {mine && (
        <p className="rounded-lg bg-sand/30 px-3 py-2 text-xs text-forest/60">
          Ya calificó esta propuesta. Al guardar, actualizará su evaluación.
        </p>
      )}

      {/* Remontar al cambiar de socio: así los deslizadores toman la nota de
          quien está calificando y no arrastran la del anterior. */}
      <div key={mine?.id ?? "nueva"} className="space-y-5">
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
              defaultValue={mine?.[c.key] ?? 5}
              className="mt-2 w-full accent-forest"
              onInput={(e) => {
                const output = document.getElementById(`${c.key}-out`);
                if (output) output.textContent = (e.target as HTMLInputElement).value;
              }}
            />
            <div className="mt-0.5 text-right text-xs text-forest/50">
              <span id={`${c.key}-out`}>{mine?.[c.key] ?? 5}</span>/10
            </div>
          </div>
        ))}

        <label className="block">
          <span className="text-sm font-medium text-forest">Comentarios</span>
          <textarea
            name="comments"
            rows={3}
            defaultValue={mine?.comments ?? ""}
            className="mt-1.5 w-full rounded-lg border border-taupe/40 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-forest focus:ring-2 focus:ring-forest/10"
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="eyebrow inline-flex items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90 disabled:opacity-50"
        >
          {isPending ? "Guardando…" : mine ? "Actualizar mi evaluación" : "Guardar evaluación"}
        </button>
        {saved && !isPending && <span className="text-sm text-emerald-600">Guardado ✓</span>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {others.length > 0 && (
        <div className="border-t border-taupe/20 pt-4">
          <p className="text-xs font-medium text-forest/50">Otras evaluaciones</p>
          <ul className="mt-2 space-y-1">
            {others.map((e) => (
              <li key={e.id} className="flex justify-between text-xs text-forest/70">
                <span className="truncate">{e.evaluator_name}</span>
                <span className="flex-none font-medium">{Number(e.total_score).toFixed(1)}/10</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
