"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

const LINKS = [
  { href: "/#ubicacion", label: "Ubicación" },
  { href: "/#galeria", label: "El lote hoy" },
  { href: "/seleccion", label: "Selección arquitectónica" },
];

export default function Nav({ alwaysSolid = false }: { alwaysSolid?: boolean }) {
  const [scrolled, setScrolled] = useState(alwaysSolid);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (alwaysSolid) return;
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysSolid]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="relative block h-9 w-32">
          <Image
            src="/images/logo-arena.png"
            alt="El Nauno Reserva"
            fill
            className={`object-contain object-left transition-opacity duration-500 ${
              scrolled ? "opacity-0" : "opacity-100"
            }`}
            priority
          />
          <span
            className={`eyebrow absolute inset-y-0 left-0 flex items-center text-sm text-forest transition-opacity duration-500 ${
              scrolled ? "opacity-100" : "opacity-0"
            }`}
          >
            El Nauno
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`eyebrow text-xs transition-colors ${
                scrolled ? "text-forest/80 hover:text-forest" : "text-white/90 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setOpen((o) => !o)}
          className={`md:hidden ${scrolled ? "text-forest" : "text-white"}`}
          aria-label="Abrir menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {open && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-col gap-1 bg-white px-6 pb-4 md:hidden"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="eyebrow py-2 text-xs text-forest/80"
            >
              {link.label}
            </Link>
          ))}
        </motion.nav>
      )}
    </header>
  );
}
