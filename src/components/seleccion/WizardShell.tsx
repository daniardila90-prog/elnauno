"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import StepCode from "./StepCode";
import StepMasterPlan from "./StepMasterPlan";
import StepReferentes from "./StepReferentes";
import StepMemoria from "./StepMemoria";
import StepIdentification from "./StepIdentification";

const STEPS = ["Código", "Master Plan", "Referentes", "Memoria conceptual", "Identificación"];

const STORAGE_KEY = "nauno-seleccion-draft";

export default function WizardShell() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalCode, setProposalCode] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { id, code } = JSON.parse(saved);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProposalId(id);
      setProposalCode(code);
    }
  }, []);

  async function ensureProposal() {
    if (proposalId) return { id: proposalId, code: proposalCode! };
    setCreating(true);
    try {
      const res = await fetch("/api/seleccion/proposals", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo crear la propuesta.");
      const data = await res.json();
      setProposalId(data.id);
      setProposalCode(data.proposal_code);
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: data.id, code: data.proposal_code })
      );
      return { id: data.id as string, code: data.proposal_code as string };
    } finally {
      setCreating(false);
    }
  }

  function goNext() {
    setDirection(1);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function goBack() {
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleSubmitted() {
    sessionStorage.removeItem(STORAGE_KEY);
    router.push(`/seleccion/participar/confirmacion?code=${proposalCode}`);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <ProgressBar current={stepIndex} total={STEPS.length} labels={STEPS} />

      <div className="relative mt-8 overflow-hidden">
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
                onStart={async () => {
                  await ensureProposal();
                  goNext();
                }}
              />
            )}
            {stepIndex === 1 && proposalId && (
              <StepMasterPlan proposalId={proposalId} onNext={goNext} onBack={goBack} />
            )}
            {stepIndex === 2 && proposalId && (
              <StepReferentes proposalId={proposalId} onNext={goNext} onBack={goBack} />
            )}
            {stepIndex === 3 && proposalId && (
              <StepMemoria proposalId={proposalId} onNext={goNext} onBack={goBack} />
            )}
            {stepIndex === 4 && proposalId && proposalCode && (
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
