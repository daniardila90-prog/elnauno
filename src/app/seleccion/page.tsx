import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/nauno/Nav";
import Footer from "@/components/nauno/Footer";
import FadeIn from "@/components/nauno/FadeIn";

export const metadata: Metadata = {
  title: "Selección arquitectónica — Hotel El Nauno",
  description:
    "Invitación a presentar propuestas de diseño arquitectónico para el proyecto inmobiliario hotelero de El Nauno Reserva, en el embalse de Topocoro, Santander.",
};

const ENTREGABLES = [
  {
    step: "01",
    title: "Concepto de diseño",
    desc: "El concepto del anteproyecto en una frase y su desarrollo: inspiración, atmósfera y relación con el entorno.",
  },
  {
    step: "02",
    title: "Análisis de sitio y emplazamiento",
    desc: "Cómo el lote, el clima y las visuales informan la implantación. Incluye el plano de implantación (Masterplan).",
  },
  {
    step: "03",
    title: "Materialidad y volumetría",
    desc: "Estrategia de volumen y organización general. El programa (áreas y amenidades) lo define el operador.",
  },
  {
    step: "04",
    title: "Materialidad de fachada",
    desc: "La paleta de materiales que da carácter a la fachada y su lógica frente al clima y el mantenimiento.",
  },
  {
    step: "05",
    title: "Imagen del proyecto",
    desc: "La vista que mejor comunica el masterplan: imágenes de referencia o perspectiva exterior.",
  },
  {
    step: "06",
    title: "Fases de diseño",
    desc: "La hoja de ruta desde el anteproyecto hasta la documentación técnica.",
  },
];

const CONDICIONES = [
  {
    title: "Invitación, no concurso",
    desc: "Es una invitación a presentar propuestas de diseño; no constituye oferta mercantil, concurso público, licitación ni promesa de contrato.",
  },
  {
    title: "Sin obligación de contratar",
    desc: "Presentar una propuesta no obliga al organizador a contratar ni garantiza la selección.",
  },
  {
    title: "Sin premio ni contraprestación",
    desc: "La participación no genera derecho a premio, pago ni reembolso de gastos. Los costos de preparación corren por cuenta de cada firma.",
  },
  {
    title: "Derechos de autor",
    desc: "Cada firma conserva la autoría de su propuesta; el material no seleccionado no se usará sin autorización.",
  },
  {
    title: "Confidencialidad",
    desc: "Las propuestas se tratan de forma confidencial y anónima durante la evaluación.",
  },
  {
    title: "Evaluación con rúbrica",
    desc: "Las propuestas se evalúan con la rúbrica de criterios definida por el organizador. El jurado levanta un acta que soporta la decisión, que es discrecional.",
  },
];

const CHECKLIST = [
  "Concepto de diseño",
  "Análisis de sitio y emplazamiento",
  "Materialidad y volumetría",
  "Materialidad de fachada",
  "Imagen del proyecto (perspectiva exterior)",
  "Fases de diseño",
  "Sin nombre ni logo en ningún archivo",
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
              Propuesta de diseño arquitectónico
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-forest/75">
              Invitamos a firmas de arquitectura a presentar una propuesta de diseño para el
              proyecto inmobiliario hotelero de El Nauno. El proceso es anónimo: el organizador
              asigna un código a cada propuesta al recibirla, para que la evaluación sea lo más
              objetiva posible.
            </p>
            <p className="mx-auto mt-4 max-w-xl text-sm text-forest/60">
              Fecha de entrega máxima: <strong className="font-medium text-forest">24 / 07 / 2026</strong>
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/seleccion/participar"
                className="eyebrow inline-flex items-center justify-center rounded-full bg-forest px-8 py-3 text-xs text-white transition hover:bg-forest/90"
              >
                Participar
              </Link>
              <a
                href="/plano-base-el-tablazo.dwg"
                download
                className="eyebrow inline-flex items-center justify-center rounded-full border border-forest/30 px-8 py-3 text-xs text-forest transition hover:bg-sand/40"
              >
                Descargar plano base (DWG)
              </a>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-4">
          <FadeIn className="rounded-xl border border-taupe/30 bg-sand/20 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <span className="eyebrow text-xs text-taupe-dark">Punto de partida</span>
              <h2 className="mt-2 text-lg font-light text-forest">Plano base del lote — El Tablazo</h2>
              <p className="mt-1 text-sm leading-relaxed text-forest/70">
                Descargue el archivo CAD del lote y trabaje su propuesta sobre él. Es la base común
                para todas las firmas.
              </p>
            </div>
            <a
              href="/plano-base-el-tablazo.dwg"
              download
              className="eyebrow mt-4 inline-flex flex-none items-center justify-center rounded-full bg-forest px-6 py-2.5 text-xs text-white transition hover:bg-forest/90 sm:mt-0"
            >
              Descargar DWG
            </a>
          </FadeIn>
        </section>

        <section className="bg-sand/30 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="max-w-xl">
              <span className="eyebrow text-xs text-taupe-dark">Qué entregar</span>
              <h2 className="mt-4 text-3xl font-light text-forest">Secciones de la propuesta</h2>
              <p className="mt-3 text-sm leading-relaxed text-forest/70">
                El programa (habitaciones, áreas y amenidades) ya está fijado por el operador y es
                confidencial. Concéntrese en el concepto, la implantación y la materialidad.
              </p>
            </FadeIn>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {ENTREGABLES.map((p, i) => (
                <FadeIn key={p.step} delay={(i % 2) * 0.08} className="flex gap-5">
                  <span className="eyebrow w-8 flex-none text-sm text-taupe-dark">{p.step}</span>
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
              <span className="eyebrow text-xs text-taupe-dark">Proceso anónimo</span>
              <h2 className="mt-4 text-3xl font-light text-forest">El código lo asigna el organizador</h2>
              <ul className="mt-8 space-y-3 text-sm leading-relaxed text-forest/75">
                <li>· No incluya nombre, logo ni marca de agua en ningún archivo entregado.</li>
                <li>· Usted no elige código; el organizador lo asigna al recibir su propuesta.</li>
                <li>· Sus datos de identificación se envían aparte y sellados; no son visibles durante la evaluación.</li>
                <li>· Evite mencionar proyectos o clientes que puedan revelar quién es usted.</li>
              </ul>
            </FadeIn>
          </div>
        </section>

        <section className="bg-forest py-20 text-white">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn>
              <span className="eyebrow text-xs text-sand">Condiciones de la invitación</span>
              <h2 className="mt-4 text-3xl font-light">Marco de la invitación</h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
                El proceso se rige por el principio de buena fe propio de la etapa precontractual
                (art. 863 del Código de Comercio). El organizador y las firmas actúan con lealtad,
                transparencia e igualdad de trato. Se rige por la ley colombiana.
              </p>
            </FadeIn>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {CONDICIONES.map((c, i) => (
                <FadeIn key={c.title} delay={(i % 2) * 0.08}>
                  <h3 className="text-base font-light text-sand">{c.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{c.desc}</p>
                </FadeIn>
              ))}
            </div>
            <FadeIn delay={0.1}>
              <p className="mt-10 max-w-2xl text-xs leading-relaxed text-white/50">
                La presentación de una propuesta implica el conocimiento y la aceptación íntegra de
                estos términos. La selección es discrecional del organizador y no da lugar a
                reclamos, recursos ni indemnizaciones.
              </p>
            </FadeIn>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6">
            <FadeIn>
              <span className="eyebrow text-xs text-taupe-dark">Antes de enviar</span>
              <h2 className="mt-4 text-3xl font-light text-forest">Lista de verificación</h2>
              <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CHECKLIST.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-sm text-forest/75">
                    <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-sand/60 text-xs text-forest">
                      ✓
                    </span>
                    {c}
                  </li>
                ))}
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
