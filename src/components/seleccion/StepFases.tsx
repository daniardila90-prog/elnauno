"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { fasesSchema, type FasesValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea, TextInput } from "./ui";

const FASES = [
  { key: "anteproyecto_semanas", label: "Anteproyecto", n: "1" },
  { key: "proyecto_semanas", label: "Proyecto arquitectónico", n: "2" },
  { key: "coordinacion_semanas", label: "Coordinación técnica", n: "3" },
  { key: "documentos_semanas", label: "Documentos de construcción", n: "4" },
] as const;

export default function StepFases({
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
    formState: { isSubmitting },
  } = useForm<z.input<typeof fasesSchema>, unknown, FasesValues>({
    resolver: zodResolver(fasesSchema),
    defaultValues: { fases_json: {}, enfoque_trabajo: "" },
  });

  async function onSubmit(values: FasesValues) {
    setServerError(null);
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "fases", data: values }),
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
        title="Fases de diseño"
        description="Su hoja de ruta desde el anteproyecto hasta la documentación técnica."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FASES.map((f) => (
          <Field key={f.key} label={`${f.n}. ${f.label}`}>
            <div className="flex items-center gap-2">
              <TextInput type="number" min={0} {...register(`fases_json.${f.key}`)} className="w-20" />
              <span className="text-xs text-forest/50">semanas</span>
            </div>
          </Field>
        ))}
      </div>

      <div className="mt-6">
        <Field label="Enfoque de trabajo (opcional)">
          <TextArea
            {...register("enfoque_trabajo")}
            placeholder="Cómo aborda su equipo el anteproyecto: metodología, coordinación y entregables por fase…"
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
