"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  EVALUATION_CRITERIA,
  SCORE_BANDS,
  isExtremeScore,
  scoreBand,
  type CriterionKey,
  type Evaluation,
} from "@/lib/supabase/types";
import { saveEvaluation } from "@/app/seleccion/admin/(dashboard)/propuestas/[id]/actions";

const NAME_KEY = "nauno-evaluador";

type Scores = Record<CriterionKey, number>;

/** Debe coincidir con la columna generada evaluator_key de la base. */
function normalize(name: string) {
  return name.trim().toLowerCase();
}

function initialScores(evaluation: Evaluation | null): Scores {
  const scores = {} as Scores;
  for (const c of EVALUATION_CRITERIA) {
    scores[c.key] = evaluation?.[c.key] ?? 5;
  }
  return scores;
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
  const [scores, setScores] = useState<Scores>(() => initialScores(null));
  const [comments, setComments] = useState("");

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

  // Cuando el nombre pasa a coincidir con una evaluación existente (o cambia de
  // socio), se cargan las notas previas de ESE socio. El ref evita reiniciar el
  // formulario en cada tecla: solo actúa cuando cambia la identidad calificada.
  const appliedId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (appliedId.current === (mine?.id ?? null)) return;
    appliedId.current = mine?.id ?? null;
    setScores(initialScores(mine));
    setComments(mine?.comments ?? "");
  }, [mine]);

  const extremeCriteria = useMemo(
    () => EVALUATION_CRITERIA.filter((c) => isExtremeScore(scores[c.key])),
    [scores]
  );
  const needsJustification = extremeCriteria.length > 0 && comments.trim() === "";

  function handleSubmit(formData: FormData) {
    setSaved(false);
    setError(null);
    if (!name.trim()) {
      setError("Escriba su nombre para guardar la evaluación.");
      return;
    }
    if (needsJustification) {
      setError(
        `Justifique las notas extremas de: ${extremeCriteria
          .map((c) => c.label)
          .join(", ")}.`
      );
      return;
    }
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

      <details className="rounded-lg border border-taupe/30 bg-sand/20 px-3 py-2 text-xs text-forest/70">
        <summary className="cursor-pointer font-medium text-forest/80">
          Cómo calificar (escala 0–10)
        </summary>
        <ul className="mt-2 space-y-1">
          {SCORE_BANDS.map((b) => (
            <li key={b.label} className="flex gap-2">
              <span className="w-12 flex-none font-medium text-forest/80">
                {b.min}–{b.max}
              </span>
              <span>
                <span className="font-medium text-forest/80">{b.label}.</span> {b.description}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-forest/50">
          Califique cada criterio por su cuenta antes de mirar lo de otros socios. Las notas ≤3 o
          ≥9 exigen una justificación en los comentarios.
        </p>
      </details>

      {EVALUATION_CRITERIA.map((c) => {
        const value = scores[c.key];
        const band = scoreBand(value);
        const extreme = isExtremeScore(value);
        return (
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
              value={value}
              onChange={(e) => {
                setScores((prev) => ({ ...prev, [c.key]: Number(e.target.value) }));
                setSaved(false);
              }}
              className="mt-2 w-full accent-forest"
            />
            <div className="mt-0.5 flex items-center justify-between text-xs">
              <span className={extreme ? "font-medium text-amber-700" : "text-forest/50"}>
                {band.label}
                {extreme && " · justifique"}
              </span>
              <span className="text-forest/50">{value}/10</span>
            </div>
          </div>
        );
      })}

      <label className="block">
        <span className="text-sm font-medium text-forest">
          Comentarios
          {needsJustification && (
            <span className="ml-1 font-normal text-amber-700">· obligatorio (notas extremas)</span>
          )}
        </span>
        <textarea
          name="comments"
          rows={3}
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            setSaved(false);
          }}
          className={`mt-1.5 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-forest/10 ${
            needsJustification ? "border-amber-400 focus:border-forest" : "border-taupe/40 focus:border-forest"
          }`}
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || needsJustification}
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
