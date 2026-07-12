"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { masterPlanSchema, type MasterPlanValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepMasterPlan({
  proposalId,
  onNext,
  onBack,
}: {
  proposalId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MasterPlanValues>({ resolver: zodResolver(masterPlanSchema) });

  async function onSubmit(values: MasterPlanValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "master_plan", data: values }),
    });
    if (!res.ok) {
      setServerError("No se pudo guardar. Intenta de nuevo.");
      return;
    }
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StepHeading
        title="Master Plan"
        description="La planta de implantación de todo el lote, resultado de su visita al terreno."
      />

      <div className="space-y-5">
        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Archivo(s) del Master Plan</span>
          <p className="mt-0.5 text-xs text-forest/50">PDF, imagen o archivo CAD de la planta de implantación. Sin logos ni marcas de agua.</p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="master_plan" multiple onError={setServerError} />
          </div>
        </div>

        <Field label="Notas sobre el master plan" error={errors.master_plan_notes?.message}>
          <TextArea
            {...register("master_plan_notes")}
            placeholder="Breve nota sobre cómo se implanta el proyecto en el lote…"
          />
        </Field>
      </div>

      {serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

      <div className="mt-8 flex justify-between">
        <SecondaryButton type="button" onClick={onBack}>
          Atrás
        </SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          Continuar
        </PrimaryButton>
      </div>
    </form>
  );
}
