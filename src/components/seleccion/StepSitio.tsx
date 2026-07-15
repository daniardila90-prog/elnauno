"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sitioSchema, type SitioValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepSitio({
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
  } = useForm<SitioValues>({ resolver: zodResolver(sitioSchema) });

  async function onSubmit(values: SitioValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "sitio", data: values }),
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
        title="Análisis de sitio y emplazamiento"
        description="Cómo el lote, el clima, las visuales y el contexto informan la implantación del volumen."
      />

      <div className="space-y-5">
        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Plano de implantación (Masterplan)</span>
          <p className="mt-0.5 text-xs text-forest/50">
            Anexe la planta de implantación que se imagina para el Masterplan del lote. PDF, imagen o CAD, sin logos ni marcas.
          </p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="masterplan" multiple onError={setServerError} />
          </div>
        </div>

        <Field label="Oportunidades del sitio" error={errors.sitio_oportunidades?.message}>
          <TextArea
            rows={3}
            {...register("sitio_oportunidades")}
            placeholder="Visuales, orientación solar, accesos, topografía…"
          />
        </Field>

        <Field label="Condicionantes y normativa" error={errors.sitio_condicionantes?.message}>
          <TextArea
            rows={3}
            {...register("sitio_condicionantes")}
            placeholder="Retiros, alturas, POT, restricciones a considerar…"
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
