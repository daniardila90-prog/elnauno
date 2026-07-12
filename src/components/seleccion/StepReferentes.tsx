"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { referentesSchema, type ReferentesValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepReferentes({
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
  } = useForm<ReferentesValues>({ resolver: zodResolver(referentesSchema) });

  async function onSubmit(values: ReferentesValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "referentes", data: values }),
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
        title="Referentes"
        description="Imágenes de lo que se imaginan para el hotel, y cómo se siente la arquitectura por dentro."
      />

      <div className="space-y-5">
        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Imágenes de referencia</span>
          <p className="mt-0.5 text-xs text-forest/50">Las imágenes que mejor comunican lo que se sueñan para el hotel. Sin logos ni marcas de agua.</p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="referente" multiple onError={setServerError} />
          </div>
        </div>

        <Field
          label="¿Cómo se siente/vibra la arquitectura dentro del hotel?"
          error={errors.referentes_narrativa?.message}
        >
          <TextArea
            rows={6}
            {...register("referentes_narrativa")}
            placeholder="Describa la atmósfera, los materiales, la luz, el recorrido — qué se vive dentro de este hotel…"
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
