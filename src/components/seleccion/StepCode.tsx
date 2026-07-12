"use client";

import { PrimaryButton, StepHeading } from "./ui";

export default function StepCode({
  proposalCode,
  creating,
  onStart,
}: {
  proposalCode: string | null;
  creating: boolean;
  onStart: () => void;
}) {
  return (
    <div>
      <StepHeading
        title="Proceso anónimo"
        description="Su propuesta se evalúa sin conocer la firma. No incluya nombre, logo ni marca de agua en ningún archivo que suba."
      />

      <div className="rounded-xl border border-taupe/30 bg-sand/30 p-5">
        <p className="eyebrow text-xs text-taupe-dark">Su código de propuesta</p>
        <p className="mt-2 text-2xl font-light tracking-wide text-forest">
          {proposalCode ?? "Se generará al continuar"}
        </p>
        <p className="mt-3 text-xs text-forest/60">
          Guarde este código: lo necesitará para identificar su propuesta. Su identidad real solo
          se registra al final, en un formulario separado.
        </p>
      </div>

      <ul className="mt-6 space-y-2 text-sm text-forest/70">
        <li>· Después de la visita al lote, complete las 3 entregas: Master Plan, Referentes y Memoria conceptual.</li>
        <li>· No incluya nombre, logo ni referencias que identifiquen su firma.</li>
        <li>· Puede guardar su progreso y continuar más tarde con este código.</li>
      </ul>

      <div className="mt-8">
        <PrimaryButton onClick={onStart} loading={creating}>
          Comenzar
        </PrimaryButton>
      </div>
    </div>
  );
}
