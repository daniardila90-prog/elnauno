"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fachadaSchema, type FachadaValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea, TextInput } from "./ui";

export default function StepFachada({
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
  } = useForm<FachadaValues>({ resolver: zodResolver(fachadaSchema) });

  async function onSubmit(values: FachadaValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "fachada", data: values }),
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
        title="Materialidad y fachada"
        description="La paleta de materiales que da carácter a la fachada y su lógica frente al clima y el mantenimiento."
      />

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Material principal" error={errors.fachada_material_principal?.message}>
            <TextInput {...register("fachada_material_principal")} placeholder="Ej.: concreto a la vista" />
          </Field>
          <Field label="Material secundario (opcional)" error={errors.fachada_material_secundario?.message}>
            <TextInput {...register("fachada_material_secundario")} placeholder="Ej.: madera local" />
          </Field>
          <Field label="Acabado / textura (opcional)" error={errors.fachada_acabado?.message}>
            <TextInput {...register("fachada_acabado")} placeholder="Ej.: microtexturado mate" />
          </Field>
          <Field label="Carpintería / vidrio (opcional)" error={errors.fachada_carpinteria?.message}>
            <TextInput {...register("fachada_carpinteria")} placeholder="Ej.: aluminio negro, vidrio control solar" />
          </Field>
        </div>

        <Field label="Estrategia de materiales" error={errors.fachada_estrategia?.message}>
          <TextArea
            {...register("fachada_estrategia")}
            placeholder="Por qué estos materiales: relación con el concepto y el entorno, comportamiento ante el clima y mantenimiento a largo plazo…"
          />
        </Field>

        <Field label="Intención de la fachada (una frase)" error={errors.fachada_intencion?.message}>
          <TextArea
            rows={2}
            {...register("fachada_intencion")}
            placeholder="En una frase: qué comunica la fachada y cómo dialoga con el entorno…"
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
