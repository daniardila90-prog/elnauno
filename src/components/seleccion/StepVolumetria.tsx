"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Proposal } from "@/lib/supabase/types";
import { volumetriaSchema, type VolumetriaValues } from "@/lib/validation/wizard";
import { Field, PrimaryButton, SecondaryButton, StepHeading, TextArea } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepVolumetria({
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
  const [volumenCount, setVolumenCount] = useState<number | null>(null);
  const [organizacionCount, setOrganizacionCount] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VolumetriaValues>({
    resolver: zodResolver(volumetriaSchema),
    defaultValues: {
      volumetria_estrategia: initial?.volumetria_estrategia ?? "",
      volumetria_organizacion: initial?.volumetria_organizacion ?? "",
    },
  });

  async function onSubmit(values: VolumetriaValues) {
    setServerError(null);
    if (volumenCount === 0 || organizacionCount === 0) {
      setServerError(
        "Suba la imagen de la estrategia volumétrica y la de organización funcional para continuar."
      );
      return;
    }
    const res = await fetch(`/api/seleccion/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "volumetria", data: values }),
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
        title="Volumetría"
        description="El programa (áreas y amenidades) lo define el operador. Describa cómo se imagina que sería la volumetría para la etapa I. Tenga en cuenta las unidades relacionadas para la etapa I en el archivo enviado por el organizador."
      />

      <div className="space-y-8">
        <div className="space-y-3">
          <Field label="Estrategia volumétrica" error={errors.volumetria_estrategia?.message}>
            <TextArea
              {...register("volumetria_estrategia")}
              placeholder="Implantación del volumen: orientación, escalonamientos y relación con el contexto…"
            />
          </Field>
          <div>
            <span className="eyebrow block text-xs text-taupe-dark">
              Imagen de la estrategia volumétrica
            </span>
            <p className="mt-0.5 text-xs text-forest/50">
              Un bosquejo o imagen que ilustre la estrategia de volumen. Sin logos ni marcas.
            </p>
            <div className="mt-2">
              <FileUploadList
                proposalId={proposalId}
                kind="volumetria"
                onError={setServerError}
                onCountChange={setVolumenCount}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Field
            label="Organización funcional y circulaciones"
            error={errors.volumetria_organizacion?.message}
          >
            <TextArea
              {...register("volumetria_organizacion")}
              placeholder="Accesos, núcleos de circulación y relación entre zonas públicas y privadas…"
            />
          </Field>
          <div>
            <span className="eyebrow block text-xs text-taupe-dark">
              Imagen de la organización funcional
            </span>
            <p className="mt-0.5 text-xs text-forest/50">
              Un bosquejo o esquema que muestre accesos, circulaciones y la relación entre zonas
              públicas y privadas. Sin logos ni marcas.
            </p>
            <div className="mt-2">
              <FileUploadList
                proposalId={proposalId}
                kind="organizacion"
                onError={setServerError}
                onCountChange={setOrganizacionCount}
              />
            </div>
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
