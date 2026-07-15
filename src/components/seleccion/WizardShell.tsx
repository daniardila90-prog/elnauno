"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { Proposal } from "@/lib/supabase/types";
import StepCode from "./StepCode";
import StepConcepto from "./StepConcepto";
import StepSitio from "./StepSitio";
import StepVolumetria from "./StepVolumetria";
import StepFachada from "./StepFachada";
import StepImagen from "./StepImagen";
import StepFases from "./StepFases";
import StepIdentification from "./StepIdentification";
import ResumeLink from "./ResumeLink";

const STEPS = [
  "Inicio",
  "Concepto",
  "Análisis de sitio",
  "Materialidad y volumetría",
  "Fachada",
  "Imagen del proyecto",
  "Fases de diseño",
  "Identificación",
];

const STORAGE_KEY = "nauno-seleccion-draft";

type Draft = { id: string; code: string; step?: number };

export default function WizardShell() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalCode, setProposalCode] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [direction, setDirection] = useState(1);

  /** Guarda la referencia del borrador para poder retomarlo más tarde. */
  const persist = useCallback((draft: Draft) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* almacenamiento no disponible: el enlace privado sigue funcionando */
    }
  }, []);

  /** Carga la propuesta guardada (por ?id= en la URL o por el navegador). */
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let id: string | null = null;
      let savedStep = 0;

      // 1) Enlace privado: ?id=<uuid> tiene prioridad (permite retomar en otro equipo)
      const fromUrl = new URLSearchParams(window.location.search).get("id");
      if (fromUrl) {
        id = fromUrl;
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const d: Draft = JSON.parse(raw);
            id = d.id;
            savedStep = d.step ?? 0;
          }
        } catch {
          /* ignorar */
        }
      }

      if (!id) {
        if (!cancelled) setRestoring(false);
        return;
      }

      try {
        const res = await fetch(`/api/seleccion/proposals/${id}`);
        if (!res.ok) throw new Error("no encontrada");
        const { proposal: p } = (await res.json()) as { proposal: Proposal };
        if (cancelled) return;

        // Si ya fue enviada no se puede seguir editando: empezamos de cero.
        if (p.status === "submitted") {
          localStorage.removeItem(STORAGE_KEY);
          setRestoring(false);
          return;
        }

        setProposal(p);
        setProposalId(p.id);
        setProposalCode(p.proposal_code);
        setStepIndex(Math.min(Math.max(savedStep, 1), STEPS.length - 1));
        persist({ id: p.id, code: p.proposal_code, step: Math.max(savedStep, 1) });
      } catch {
        // Borrador inexistente o borrado: arrancamos limpio.
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignorar */
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [persist]);

  async function ensureProposal(accessCode: string) {
    if (proposalId) return { id: proposalId, code: proposalCode! };
    setCreating(true);
    try {
      const res = await fetch("/api/seleccion/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_code: accessCode }),
      });
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(body.error ?? "Código de invitación inválido.");
        (err as Error & { invalidCode?: boolean }).invalidCode = true;
        throw err;
      }
      if (!res.ok) throw new Error("No se pudo crear la propuesta.");
      const data = await res.json();
      setProposalId(data.id);
      setProposalCode(data.proposal_code);
      persist({ id: data.id, code: data.proposal_code, step: 1 });
      return { id: data.id as string, code: data.proposal_code as string };
    } finally {
      setCreating(false);
    }
  }

  /** Mezcla lo recién guardado para que al volver atrás se vea el contenido. */
  function handleSaved(values: Partial<Proposal>) {
    setProposal((p) => ({ ...(p ?? ({} as Proposal)), ...values }));
  }

  function goTo(next: number, dir: number) {
    setDirection(dir);
    setStepIndex(next);
    if (proposalId && proposalCode) {
      persist({ id: proposalId, code: proposalCode, step: next });
    }
  }

  const goNext = () => goTo(Math.min(stepIndex + 1, STEPS.length - 1), 1);
  const goBack = () => goTo(Math.max(stepIndex - 1, 0), -1);

  function handleSubmitted() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorar */
    }
    router.push(`/seleccion/participar/confirmacion?code=${proposalCode}`);
  }

  if (restoring) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-20 text-center">
        <p className="text-sm text-forest/50">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <ProgressBar current={stepIndex} total={STEPS.length} labels={STEPS} />

      {proposalId && <ResumeLink proposalId={proposalId} proposalCode={proposalCode} />}

      <div className="relative mt-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={stepIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -24 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {stepIndex === 0 && (
              <StepCode
                proposalCode={proposalCode}
                creating={creating}
                onStart={async (accessCode) => {
                  await ensureProposal(accessCode);
                  goTo(1, 1);
                }}
              />
            )}
            {stepIndex === 1 && proposalId && (
              <StepConcepto
                proposalId={proposalId}
                initial={proposal}
                onSaved={handleSaved}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 2 && proposalId && (
              <StepSitio
                proposalId={proposalId}
                initial={proposal}
                onSaved={handleSaved}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 3 && proposalId && (
              <StepVolumetria
                proposalId={proposalId}
                initial={proposal}
                onSaved={handleSaved}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 4 && proposalId && (
              <StepFachada
                proposalId={proposalId}
                initial={proposal}
                onSaved={handleSaved}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 5 && proposalId && (
              <StepImagen proposalId={proposalId} onNext={goNext} onBack={goBack} />
            )}
            {stepIndex === 6 && proposalId && (
              <StepFases
                proposalId={proposalId}
                initial={proposal}
                onSaved={handleSaved}
                onNext={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 7 && proposalId && proposalCode && (
              <StepIdentification
                proposalId={proposalId}
                onBack={goBack}
                onSubmitted={handleSubmitted}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProgressBar({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-forest/60">
        <span>
          Paso {current + 1} de {total}
        </span>
        <span className="eyebrow font-medium text-forest">{labels[current]}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sand/60">
        <motion.div
          className="h-full rounded-full bg-forest"
          animate={{ width: `${((current + 1) / total) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
