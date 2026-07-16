"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Proposal } from "@/lib/supabase/types";
import { sitioSchema, type SitioValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepSitio({
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
  } = useForm<SitioValues>({
    resolver: zodResolver(sitioSchema),
    defaultValues: {
      sitio_oportunidades: initial?.sitio_oportunidades ?? "",
    },
  });

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
    onSaved(values);
    onNext();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <StepHeading
        title="Análisis de sitio y emplazamiento"
        description="De acuerdo a las condiciones del lote, clima, visuales y contexto normativo, realice una propuesta para el masterplan del lote. Tome como base las unidades licenciadas de acuerdo al archivo enviado por el organizador."
      />

      <div className="space-y-5">
        <div>
          <span className="eyebrow block text-xs text-taupe-dark">Plano de implantación (Masterplan)</span>
          <p className="mt-0.5 text-xs text-forest/50">
            Anexe la planta de implantación que se imagina para el Masterplan del lote. Solo en PDF,
            sin logos ni marcas.
          </p>
          <div className="mt-2">
            <FileUploadList proposalId={proposalId} kind="masterplan" onError={setServerError} />
          </div>
        </div>

        <Field label="Oportunidades del sitio" error={errors.sitio_oportunidades?.message}>
          <TextArea
            rows={3}
            {...register("sitio_oportunidades")}
            placeholder="Visuales, orientación solar, accesos, topografía…"
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
