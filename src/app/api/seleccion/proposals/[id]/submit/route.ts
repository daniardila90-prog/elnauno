import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { identificationSchema } from "@/lib/validation/wizard";

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
  const body = await req.json();
  const parsed = identificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  // Solo las firmas invitadas pueden enviar: se valida el código de invitación
  // contra la variable de entorno del servidor (nunca expuesta al cliente).
  const expectedCode = (process.env.SELECCION_ACCESS_CODE ?? "").trim();
  if (!expectedCode || parsed.data.access_code.trim() !== expectedCode) {
    return NextResponse.json(
      { error: "Código de invitación inválido.", invalid_code: true },
      { status: 403 }
    );
  }

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
