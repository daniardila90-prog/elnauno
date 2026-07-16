import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONSENT_VERSION, identificationSchema } from "@/lib/validation/wizard";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

const REQUIRED_PROPOSAL_FIELDS = [
  "concepto_frase",
  "concepto_desarrollo",
  "sitio_oportunidades",
  "volumetria_estrategia",
  "volumetria_organizacion",
  "fachada_material_principal",
  "fachada_material_secundario",
  "fachada_acabado",
  "fachada_carpinteria",
  "fachada_estrategia",
  "fachada_intencion",
  "enfoque_trabajo",
] as const;

/** Secciones cuyo archivo es obligatorio para poder enviar la propuesta. */
const REQUIRED_FILE_KINDS = [
  "concepto",
  "masterplan",
  "volumetria",
  "organizacion",
  "proyecto",
] as const;

const FASES_KEYS = [
  "anteproyecto_semanas",
  "proyecto_semanas",
  "coordinacion_semanas",
  "documentos_semanas",
] as const;

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  // Límite: máx. 20 envíos por hora por IP.
  const allowed = await withinRateLimit(`submit:${getClientIp(req)}`, 20, 3600);
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = identificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // El código de invitación ya se validó al crear la propuesta (POST /proposals);
  // una propuesta no puede existir sin haber pasado ese control, así que aquí no
  // se vuelve a pedir.
  const supabase = createAdminClient();

  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada." }, { status: 404 });
  }
  if (proposal.status === "submitted") {
    return NextResponse.json({ error: "Esta propuesta ya fue enviada." }, { status: 409 });
  }

  const missing = REQUIRED_PROPOSAL_FIELDS.filter(
    (field) => !proposal[field] || String(proposal[field]).trim() === ""
  );

  const fases = (proposal.fases_json ?? {}) as Record<string, unknown>;
  const missingFases = FASES_KEYS.filter((key) => !(Number(fases[key]) > 0));

  const { data: files } = await supabase
    .from("proposal_files")
    .select("kind")
    .eq("proposal_id", id);
  const kinds = new Set((files ?? []).map((f) => f.kind));
  const missingFiles = REQUIRED_FILE_KINDS.filter((kind) => !kinds.has(kind));

  if (missing.length > 0 || missingFases.length > 0 || missingFiles.length > 0) {
    return NextResponse.json(
      {
        error: "La propuesta está incompleta.",
        missing_fields: missing,
        missing_fases: missingFases,
        missing_files: missingFiles,
      },
      { status: 422 }
    );
  }

  const identity = {
    proposal_id: id,
    firm_name: parsed.data.firm_name,
    contact_name: parsed.data.contact_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  };
  // Prueba de la autorización de tratamiento (Ley 1581): cuándo y qué versión.
  const consent = {
    data_consent_at: new Date().toISOString(),
    data_consent_version: CONSENT_VERSION,
  };

  let identificationError = (
    await supabase.from("identification_forms").insert({ ...identity, ...consent })
  ).error;
  // Si la migración 0007 aún no se aplicó (columna inexistente, código 42703),
  // no se bloquea el envío: se guarda la identidad sin las columnas de prueba.
  // El consentimiento sí quedó exigido en el formulario y validado en el servidor.
  if (identificationError?.code === "42703") {
    identificationError = (await supabase.from("identification_forms").insert(identity)).error;
  }
  if (identificationError) {
    return NextResponse.json({ error: identificationError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("proposals")
    .update({ status: "submitted", submitted_at: new Date().toISOString() })
    .eq("id", id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, proposal_code: proposal.proposal_code });
}
