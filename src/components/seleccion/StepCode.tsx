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
        <p className="eyebrow text-xs text-taupe-dark">Referencia de su envío</p>
        <p className="mt-2 text-2xl font-light tracking-wide text-forest">
          {proposalCode ?? "Se asignará al continuar"}
        </p>
        <p className="mt-3 text-xs text-forest/60">
          Usted no elige código. El organizador lo asigna al recibir su propuesta y lo usa para
          emparejarla con su identidad. Guarde esta referencia para retomar su envío.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-taupe/30 bg-sand/20 p-5">
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

      <div className="mt-8">
        <PrimaryButton onClick={onStart} loading={creating}>
          Comenzar
        </PrimaryButton>
      </div>
    </div>
  );
}
