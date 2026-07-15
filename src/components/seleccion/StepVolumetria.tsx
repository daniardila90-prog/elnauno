"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { volumetriaSchema, type VolumetriaValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepVolumetria({
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
  } = useForm<VolumetriaValues>({ resolver: zodResolver(volumetriaSchema) });

  async function onSubmit(values: VolumetriaValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "volumetria", data: values }),
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
        title="Materialidad y volumetría"
        description="El programa (áreas y amenidades) lo define el operador. Muestre cómo lo organizaría en el lote y su estrategia de volumen."
      />

      <div className="space-y-5">
        <Field label="Estrategia volumétrica" error={errors.volumetria_estrategia?.message}>
          <TextArea
            {...register("volumetria_estrategia")}
            placeholder="Implantación del volumen: orientación, escalonamientos y relación con el contexto…"
          />
        </Field>

        <Field label="Organización general" error={errors.volumetria_organizacion?.message}>
          <TextArea
            {...register("volumetria_organizacion")}
            placeholder="Accesos, núcleos de circulación y relación entre zonas públicas y privadas…"
          />
        </Field>

        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Imagen de referencia (opcional)</span>
          <p className="mt-0.5 text-xs text-forest/50">Bosquejo o imagen que ilustra la estrategia de volumen. Sin logos ni marcas.</p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="volumetria" multiple onError={setServerError} />
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
