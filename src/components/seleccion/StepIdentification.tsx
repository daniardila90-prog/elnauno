"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { identificationSchema, type IdentificationValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextInput } from "./ui";

export default function StepIdentification({
  proposalId,
  onBack,
  onSubmitted,
}: {
  proposalId: string;
  onBack: () => void;
  onSubmitted: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IdentificationValues>({
    resolver: zodResolver(identificationSchema),
    defaultValues: { data_consent: false },
  });

  async function onSubmit(values: IdentificationValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const body = await res.json();
      if (body.missing_fields?.length || body.missing_fases?.length || body.missing_files?.length) {
        setServerError(
          "La propuesta está incompleta. Vuelva atrás y revise que haya diligenciado todas las secciones, indicado las semanas de cada fase y subido los archivos de cada paso."
        );
      } else {
        setServerError(body.error ?? "No se pudo enviar la propuesta.");
      }
      return;
    }
    onSubmitted();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StepHeading
        title="Formulario de identificación"
        description="Estos datos se guardan por separado del contenido de su propuesta y solo son visibles para los socios una vez cerrada la evaluación anónima."
      />

      <div className="space-y-5">
        <Field label="Nombre de la firma" error={errors.firm_name?.message}>
          <TextInput {...register("firm_name")} />
        </Field>
        <Field label="Nombre de contacto" error={errors.contact_name?.message}>
          <TextInput {...register("contact_name")} />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Correo" error={errors.email?.message}>
            <TextInput type="email" {...register("email")} />
          </Field>
          <Field label="Teléfono" error={errors.phone?.message}>
            <TextInput {...register("phone")} />
          </Field>
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm text-forest/80">
            <input
              type="checkbox"
              {...register("data_consent")}
              className="mt-0.5 h-4 w-4 flex-none accent-forest"
            />
            <span>
              Autorizo el tratamiento de mis datos personales conforme al{" "}
              <a
                href="/seleccion/privacidad"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-taupe/60 underline-offset-2 hover:text-forest"
              >
                aviso de privacidad
              </a>
              , para gestionar mi participación en la selección arquitectónica de El Nauno.
            </span>
          </label>
          {errors.data_consent && (
            <p className="mt-1 text-sm text-red-600">{errors.data_consent.message}</p>
          )}
        </div>
      </div>

      {serverError && <p className="mt-4 text-sm text-red-600">{serverError}</p>}

      <div className="mt-8 flex justify-between">
        <SecondaryButton type="button" onClick={onBack}>
          Atrás
        </SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          Enviar propuesta
        </PrimaryButton>
      </div>
    </form>
  );
}
