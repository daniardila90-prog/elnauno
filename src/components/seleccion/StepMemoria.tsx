"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memoriaSchema, type MemoriaValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";

export default function StepMemoria({
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
  } = useForm<MemoriaValues>({ resolver: zodResolver(memoriaSchema) });

  async function onSubmit(values: MemoriaValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "memoria", data: values }),
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
        title="Memoria conceptual"
        description="El razonamiento detrás del master plan: por qué esta implantación, por qué esta idea."
      />

      <Field label="Memoria conceptual" error={errors.memoria_conceptual?.message}>
        <TextArea
          rows={10}
          {...register("memoria_conceptual")}
          placeholder="Explique el razonamiento de la planta de implantación: lectura del lote, criterios de zonificación, relación con el entorno y el embalse, decisiones clave…"
        />
      </Field>

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
