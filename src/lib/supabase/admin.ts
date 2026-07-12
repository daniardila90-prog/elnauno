import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Ignora RLS. Solo se usa en Route Handlers para las escrituras públicas del
// wizard de participación (las firmas no tienen sesión de Supabase).
// Nunca importar desde un componente cliente.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
