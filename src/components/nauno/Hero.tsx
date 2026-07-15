"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function Hero() {
  return (
    <section id="inicio" className="relative flex h-screen min-h-[640px] items-center justify-center overflow-hidden">
      <Image
        src="/images/hero-embalse.jpg"
        alt="El Nauno Reserva — vista del embalse de Topocoro"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-forest/50 via-forest/25 to-forest/60" />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative h-28 w-72 sm:h-32 sm:w-80"
        >
          <Image src="/images/logo-arena.png" alt="El Nauno Reserva" fill className="object-contain" priority />
        </motion.div>
        <motion.a
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          href="#ubicacion"
          className="eyebrow mt-10 rounded-full border border-white/70 px-7 py-3 text-xs text-white transition hover:bg-white hover:text-forest"
        >
          Descubrir
        </motion.a>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-9 w-5 rounded-full border border-white/70 p-1"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </motion.div>
      </motion.div>
    </section>
  );
}
