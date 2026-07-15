"use client";

import { useState } from "react";
import { Field, PrimaryButton, StepHeading, TextInput } from "./ui";

export default function StepCode({
  proposalCode,
  creating,
  onStart,
}: {
  proposalCode: string | null;
  creating: boolean;
  onStart: (accessCode: string) => Promise<void>;
}) {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    if (!accessCode.trim()) {
      setError("Ingresa el código de invitación para comenzar.");
      return;
    }
    try {
      await onStart(accessCode.trim());
    } catch (e) {
      const err = e as Error & { invalidCode?: boolean };
      setError(
        err.invalidCode
          ? "Código de invitación inválido. Solo las firmas invitadas pueden participar."
          : "No se pudo iniciar. Intenta de nuevo."
      );
    }
  }

  return (
    <div>
      <StepHeading
        title="Proceso anónimo"
        description="Su propuesta se evalúa sin conocer la firma. No incluya nombre, logo ni marca de agua en ningún archivo que suba."
      />

      <div className="rounded-xl border border-taupe/30 bg-sand/20 p-5">
        <p className="eyebrow text-xs text-taupe-dark">Paso 1 · Plano base</p>
        <p className="mt-2 text-sm leading-relaxed text-forest/70">
          Descargue el plano del lote (El Tablazo) y trabaje su propuesta sobre él. Es la base
          común para todas las firmas.
        </p>
        <a
          href="/plano-base-el-tablazo.dwg"
          download
          className="eyebrow mt-4 inline-flex items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90"
        >
          Descargar plano base (DWG)
        </a>
      </div>

      <div className="mt-6 space-y-3 text-sm text-forest/70">
        <p className="text-forest/80">El programa lo define el operador.</p>
        <p className="text-xs">
          El número de habitaciones, áreas y amenidades ya está fijado y es confidencial.
          Concéntrese en el concepto, la planta de implantación (Masterplan), la materialidad y las
          fases de diseño.
        </p>
        <ul className="mt-4 space-y-2 text-xs">
          <li>· Complete todas las secciones: concepto, análisis de sitio, materialidad y volumetría, fachada, imagen del proyecto y fases.</li>
          <li>· Suba imágenes sin logos ni marcas identificables.</li>
          <li>· Sus datos reales van al final, en un formulario de identificación sellado aparte.</li>
        </ul>
      </div>

      <div className="mt-8 rounded-xl border border-taupe/30 bg-sand/30 p-5">
        <Field
          label="Código de invitación"
          hint="El código que recibió del organizador. Solo las firmas invitadas pueden iniciar una propuesta."
          error={error ?? undefined}
        >
          <TextInput
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Código entregado por el organizador"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleStart();
            }}
          />
        </Field>
        {proposalCode && (
          <p className="mt-3 text-xs text-forest/60">
            Referencia de su envío: <span className="font-medium text-forest">{proposalCode}</span>
          </p>
        )}
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={handleStart} loading={creating}>
          Comenzar
        </PrimaryButton>
      </div>
    </div>
  );
}
