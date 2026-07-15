"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { conceptoSchema, type ConceptoValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepConcepto({
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
  } = useForm<ConceptoValues>({ resolver: zodResolver(conceptoSchema) });

  async function onSubmit(values: ConceptoValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "concepto", data: values }),
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
        title="Concepto de diseño"
        description="El concepto del anteproyecto en una frase y su desarrollo."
      />

      <div className="space-y-5">
        <Field label="Concepto (una frase)" error={errors.concepto_frase?.message}>
          <TextArea
            rows={2}
            {...register("concepto_frase")}
            placeholder="Ej.: «Un volumen que traduce el paisaje local en una fachada viva…»"
          />
        </Field>

        <Field label="Desarrollo del concepto" error={errors.concepto_desarrollo?.message}>
          <TextArea
            {...register("concepto_desarrollo")}
            placeholder="La narrativa de diseño: inspiración, atmósfera y relación con el entorno…"
          />
        </Field>

        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Imagen conceptual o moodboard (opcional)</span>
          <p className="mt-0.5 text-xs text-forest/50">Imagen que comunica la atmósfera del concepto. Sin logos ni marcas.</p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="concepto" multiple onError={setServerError} />
          </div>
        </div>
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
