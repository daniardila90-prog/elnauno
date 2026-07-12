import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { masterPlanSchema, memoriaSchema, referentesSchema } from "@/lib/validation/wizard";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ proposal });
}

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json();
  const step = body?.step as string | undefined;
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Propuesta no encontrada." }, { status: 404 });
  }
  if (existing.status === "submitted") {
    return NextResponse.json(
      { error: "Esta propuesta ya fue enviada y no se puede editar." },
      { status: 409 }
    );
  }

  const schemas = {
    master_plan: masterPlanSchema,
    referentes: referentesSchema,
    memoria: memoriaSchema,
  } as const;

  const schema = schemas[step as keyof typeof schemas];
  if (!schema) {
    return NextResponse.json({ error: "Paso desconocido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { error } = await supabase.from("proposals").update(parsed.data).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
