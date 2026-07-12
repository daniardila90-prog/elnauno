import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-forest py-12 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <div className="relative h-16 w-40">
          <Image src="/images/logo-arena.png" alt="El Nauno Reserva" fill className="object-contain" />
        </div>
        <p className="eyebrow text-xs text-white/60">
          © {new Date().getFullYear()} El Nauno Reserva · Santander, Colombia
        </p>
      </div>
    </footer>
  );
}
