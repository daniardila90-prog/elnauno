import Image from "next/image";
import FadeIn from "./FadeIn";

export default function Ubicacion() {
  return (
    <section id="ubicacion" className="bg-forest py-24 text-white sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="max-w-2xl">
          <span className="eyebrow text-xs text-sand">Ubicación</span>
          <h2 className="mt-4 text-3xl font-light sm:text-4xl">
            En el corazón del embalse de Topocoro
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/80">
            El Nauno está rodeado del entorno natural del embalse de Topocoro, en Santander —
            un paisaje de agua y montaña que enmarca cada experiencia del complejo, desde la
            llegada por agua hasta el descanso en cada terraza.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-14">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-sm bg-white/5">
            <Image
              src="/images/entorno-panoramica.jpg"
              alt="Entorno natural de El Nauno"
              fill
              className="object-cover"
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
