"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/seleccion/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-taupe/20 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="eyebrow text-xs text-forest">Selección arquitectónica · El Nauno</span>
          <Link
            href="/seleccion/admin"
            className={`eyebrow text-xs ${
              pathname === "/seleccion/admin" ? "text-forest" : "text-forest/50 hover:text-forest"
            }`}
          >
            Propuestas
          </Link>
        </div>
        <button onClick={handleLogout} className="eyebrow text-xs text-forest/50 hover:text-forest">
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
