"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import FadeIn from "./FadeIn";

const IMAGES = [
  { src: "/images/terreno-aereo-1.jpg", alt: "Vista aérea del lote y el embalse" },
  { src: "/images/terreno-aereo-2.jpg", alt: "Vista aérea del lote, zona de bahías" },
  { src: "/images/terreno-aereo-3.jpg", alt: "Vista aérea del entorno natural" },
  { src: "/images/terreno-aereo-4.jpg", alt: "Vista aérea de la topografía del lote" },
  { src: "/images/terreno-aereo-5.jpg", alt: "Vista aérea del lote y las montañas" },
  { src: "/images/terreno-obra-1.jpg", alt: "Obras de acceso al lote" },
];

export default function Galeria() {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowLeft") setActive((a) => (a! > 0 ? a! - 1 : a));
      if (e.key === "ArrowRight") setActive((a) => (a! < IMAGES.length - 1 ? a! + 1 : a));
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <section id="galeria" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="text-center">
          <span className="eyebrow text-xs text-taupe-dark">Galería</span>
          <h2 className="mt-4 text-3xl font-light text-forest sm:text-4xl">El lote hoy</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-forest/70">
            Fotografías reales del terreno y su entorno natural, sin intervenir.
          </p>
        </FadeIn>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {IMAGES.map((img, i) => (
            <FadeIn key={img.src} delay={(i % 4) * 0.08}>
              <button
                onClick={() => setActive(i)}
                className="relative block aspect-square w-full overflow-hidden rounded-sm"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </button>
            </FadeIn>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-forest p-6"
            onClick={() => setActive(null)}
          >
            <button
              onClick={() => setActive(null)}
              className="absolute right-6 top-6 text-sm text-white/80 hover:text-white"
              aria-label="Cerrar"
            >
              Cerrar ✕
            </button>

            {active > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a! > 0 ? a! - 1 : a));
                }}
                className="absolute left-4 text-2xl text-white/70 hover:text-white sm:left-8"
                aria-label="Anterior"
              >
                ‹
              </button>
            )}
            {active < IMAGES.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((a) => (a! < IMAGES.length - 1 ? a! + 1 : a));
                }}
                className="absolute right-4 text-2xl text-white/70 hover:text-white sm:right-8"
                aria-label="Siguiente"
              >
                ›
              </button>
            )}

            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="relative h-[70vh] w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={IMAGES[active].src}
                alt={IMAGES[active].alt}
                fill
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
