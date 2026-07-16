"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton, StepHeading } from "./ui";
import FileUploadList from "./FileUploadList";

export default function StepImagen({
  proposalId,
  onNext,
  onBack,
}: {
  proposalId: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [hasFiles, setHasFiles] = useState(false);

  function handleContinue() {
    if (!hasFiles) {
      setError("Sube al menos una imagen o perspectiva exterior del proyecto.");
      return;
    }
    onNext();
  }

  return (
    <div>
      <StepHeading
        title="Imagen del proyecto"
        description="La vista que mejor comunica el masterplan: imágenes de referencia o perspectiva exterior del hotel."
      />

      <div>
        <span className="eyebrow block text-xs text-taupe-dark">
          Imágenes de referencia / perspectiva exterior
        </span>
        <p className="mt-0.5 text-xs text-forest/50">
          Máximo 2 imágenes. Sin logos ni marcas identificables.
        </p>
        <div className="mt-2">
          <FileUploadList
            proposalId={proposalId}
            kind="proyecto"
            onError={setError}
            onCountChange={(n) => setHasFiles(n > 0)}
          />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex justify-between">
        <SecondaryButton type="button" onClick={onBack}>
          Atrás
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleContinue}>
          Continuar
        </PrimaryButton>
      </div>
    </div>
  );
}
