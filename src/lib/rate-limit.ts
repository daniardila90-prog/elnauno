import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Extrae la IP del cliente de las cabeceras (Vercel pone x-forwarded-for). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Devuelve true si la solicitud está DENTRO del límite (se permite), false si lo
 * excede. Usa la función atómica check_rate_limit en Postgres.
 *
 * Fail-open: si la función aún no existe (antes de aplicar la migración 0003) o
 * hay un error de red, permite la solicitud y lo registra, para no romper el
 * flujo de envío. Se activa por completo una vez corrida la migración 0003.
 */
export async function withinRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("check_rate_limit no disponible (fail-open):", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.warn("rate limit error (fail-open):", e);
    return true;
  }
}
