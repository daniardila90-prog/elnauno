"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "not_admin" ? "Esa cuenta no tiene acceso al panel." : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError("Credenciales inválidas.");
      return;
    }
    router.push("/seleccion/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-xl border border-white/10 bg-forest/60 p-8"
    >
      <h1 className="text-lg font-light text-white">Panel de evaluación — El Nauno</h1>
      <p className="mt-1 text-sm text-white/60">Acceso restringido a los socios.</p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="eyebrow block text-xs text-white/70">Correo</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sand"
          />
        </label>
        <label className="block">
          <span className="eyebrow block text-xs text-white/70">Contraseña</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sand"
          />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="eyebrow mt-6 w-full rounded-full bg-sand px-4 py-2.5 text-xs text-forest transition hover:bg-white disabled:opacity-50"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
