import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/nauno/Nav";
import Footer from "@/components/nauno/Footer";
import FadeIn from "@/components/nauno/FadeIn";

export const metadata: Metadata = {
  title: "Selección arquitectónica — Hotel El Nauno",
  description:
    "Proceso de selección arquitectónica anónimo para el hotel de El Nauno Reserva, en el embalse de Topocoro, Santander.",
};

const PROCESO = [
  {
    step: "01",
    title: "Visita al lote",
    desc: "Cada firma invitada visita el terreno para conocer el lugar antes de proponer.",
  },
  {
    step: "02",
    title: "Master Plan",
    desc: "Planta de implantación de todo el lote, resultado de la lectura del terreno.",
  },
  {
    step: "03",
    title: "Referentes",
    desc: "Imágenes de lo que se imaginan para el hotel y cómo se siente su arquitectura por dentro.",
  },
  {
    step: "04",
    title: "Memoria conceptual",
    desc: "El razonamiento detrás del master plan: por qué esta implantación, por qué esta idea.",
  },
  {
    step: "05",
    title: "Evaluación anónima",
    desc: "Los socios de El Nauno evalúan cada propuesta sin conocer la firma que la presenta.",
  },
];

export default function SeleccionPage() {
  return (
    <>
      <Nav alwaysSolid />
      <main className="bg-white pt-28">
        <section className="mx-auto max-w-4xl px-6 py-16 text-center">
          <FadeIn>
            <span className="eyebrow text-xs text-taupe-dark">Selección arquitectónica</span>
            <h1 className="mt-4 text-4xl font-light leading-tight text-forest sm:text-5xl">
              El hotel de El Nauno
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-forest/75">
              Invitamos a cuatro firmas de arquitectura a proponer el diseño del hotel de El
              Nauno. El proceso es anónimo: cada propuesta se identifica solo con un código, sin
              nombre ni marca de la firma, para que la elección de los socios sea lo más objetiva
              posible.
            </p>
            <Link
              href="/seleccion/participar"
              className="eyebrow mt-10 inline-flex items-center justify-center rounded-full bg-forest px-8 py-3 text-xs text-white transition hover:bg-forest/90"
            >
              Participar
            </Link>
          </FadeIn>
        </section>

        <section className="bg-sand/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="max-w-xl">
              <span className="eyebrow text-xs text-taupe-dark">El proceso</span>
              <h2 className="mt-4 text-3xl font-light text-forest">Cómo funciona</h2>
            </FadeIn>

            <div className="mt-12 space-y-8">
              {PROCESO.map((p, i) => (
                <FadeIn key={p.step} delay={i * 0.08} className="flex gap-6">
                  <span className="eyebrow w-10 flex-none text-sm text-taupe-dark">{p.step}</span>
                  <div>
                    <h3 className="text-lg font-light text-forest">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-forest/70">{p.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn>
              <span className="eyebrow text-xs text-taupe-dark">Anonimato</span>
              <h2 className="mt-4 text-3xl font-light text-forest">Reglas de anonimato</h2>
              <ul className="mt-8 space-y-3 text-sm leading-relaxed text-forest/75">
                <li>· No incluya nombre, logo ni marca de agua en ningún archivo entregado.</li>
                <li>· Su propuesta se identifica solo con el código que reciba al comenzar.</li>
                <li>· Sus datos de identificación se guardan por separado y no son visibles durante la evaluación.</li>
                <li>· Al elegir la(s) mejor(es) propuesta(s), se revela la identidad de esa firma.</li>
              </ul>
            </FadeIn>

            <FadeIn delay={0.1} className="mt-14 rounded-xl border border-taupe/30 bg-sand/20 p-8 text-center">
              <p className="text-sm text-forest/70">
                Use las fotografías reales del lote en la galería del sitio como referencia de
                dónde está todo y cómo se relaciona con el entorno.
              </p>
              <Link
                href="/#galeria"
                className="eyebrow mt-4 inline-block text-xs text-forest underline underline-offset-4"
              >
                Ver galería del lote
              </Link>
            </FadeIn>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
