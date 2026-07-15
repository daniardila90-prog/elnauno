import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { identificationSchema } from "@/lib/validation/wizard";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

const REQUIRED_PROPOSAL_FIELDS = [
  "concepto_frase",
  "concepto_desarrollo",
  "sitio_oportunidades",
  "sitio_condicionantes",
  "volumetria_estrategia",
  "volumetria_organizacion",
  "fachada_material_principal",
  "fachada_estrategia",
  "fachada_intencion",
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

  const { data: files } = await supabase
    .from("proposal_files")
    .select("kind")
    .eq("proposal_id", id);
  const hasMasterplan = (files ?? []).some((f) => f.kind === "masterplan");
  const hasProyecto = (files ?? []).some((f) => f.kind === "proyecto");

  if (missing.length > 0 || !hasMasterplan || !hasProyecto) {
    return NextResponse.json(
      {
        error: "La propuesta está incompleta.",
        missing_fields: missing,
        missing_masterplan: !hasMasterplan,
        missing_proyecto: !hasProyecto,
      },
      { status: 422 }
    );
  }

  const { error: identificationError } = await supabase.from("identification_forms").insert({
    proposal_id: id,
    firm_name: parsed.data.firm_name,
    contact_name: parsed.data.contact_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });
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
