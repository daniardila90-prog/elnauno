import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propuesta enviada — El Nauno",
};

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand/20 px-4">
      <div className="w-full max-w-md rounded-xl border border-taupe/30 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sand/60 text-forest">
          ✓
        </div>
        <h1 className="mt-4 text-xl font-light text-forest">Propuesta enviada</h1>
        <p className="mt-2 text-sm text-forest/70">
          Su propuesta fue recibida correctamente. Conserve su código de propuesta: lo usaremos
          para todas las comunicaciones sobre esta entrega.
        </p>
        {code && <p className="mt-4 text-2xl font-light tracking-wide text-forest">{code}</p>}
        <Link
          href="/"
          className="eyebrow mt-8 inline-flex items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
