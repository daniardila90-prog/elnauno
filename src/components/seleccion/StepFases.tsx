"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { Proposal } from "@/lib/supabase/types";
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
  initial,
  onSaved,
  onNext,
  onBack,
}: {
  proposalId: string;
  initial: Proposal | null;
  onSaved: (values: Partial<Proposal>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof fasesSchema>, unknown, FasesValues>({
    resolver: zodResolver(fasesSchema),
    defaultValues: {
      fases_json: initial?.fases_json ?? {},
      enfoque_trabajo: initial?.enfoque_trabajo ?? "",
    },
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
    onSaved(values as Partial<Proposal>);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StepHeading
        title="Fases de diseño"
        description="Es importante conocer su hoja de ruta desde el anteproyecto hasta la documentación técnica. Relacione en semanas los tiempos para cada entrega."
      />

      {/* La etiqueta lleva alto fijo y los errores van fuera de la rejilla: así los
          cuatro campos quedan al mismo nivel aunque el nombre de la fase ocupe dos
          líneas o alguna fase quede sin diligenciar. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {FASES.map((f) => (
          <label key={f.key} className="block">
            <span className="eyebrow flex min-h-[2.5rem] items-start text-xs leading-snug text-taupe-dark">
              {f.n}. {f.label}
            </span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <TextInput
                type="number"
                min={1}
                {...register(`fases_json.${f.key}`)}
                className="min-w-0 flex-1"
                aria-invalid={errors.fases_json?.[f.key] ? true : undefined}
              />
              <span className="flex-none text-xs text-forest/50">semanas</span>
            </div>
          </label>
        ))}
      </div>

      {errors.fases_json && (
        <p className="mt-2 text-xs text-red-600">
          Indique las semanas de cada fase (un número mayor que cero).
        </p>
      )}

      <div className="mt-6">
        <Field label="Metodología de trabajo" error={errors.enfoque_trabajo?.message}>
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
