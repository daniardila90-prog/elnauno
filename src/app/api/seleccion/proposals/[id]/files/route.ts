import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteParams = { params: Promise<{ id: string }> };

const ALLOWED_KINDS = ["master_plan", "referente"];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status")
    .eq("id", id)
    .single();
  if (!proposal) {
    return NextResponse.json({ error: "Propuesta no encontrada." }, { status: 404 });
  }
  if (proposal.status === "submitted") {
    return NextResponse.json({ error: "Esta propuesta ya fue enviada." }, { status: 409 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido." }, { status: 422 });
  }
  if (!ALLOWED_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Tipo de archivo inválido." }, { status: 422 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "El archivo supera 50MB." }, { status: 422 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `${id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("seleccion-nauno-files")
    .upload(storagePath, file, { contentType: file.type });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: fileRow, error: insertError } = await supabase
    .from("proposal_files")
    .insert({ proposal_id: id, kind, storage_path: storagePath, file_name: file.name })
    .select("*")
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(fileRow, { status: 201 });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("proposal_files")
    .select("*")
    .eq("proposal_id", id)
    .order("uploaded_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId) return NextResponse.json({ error: "fileId requerido." }, { status: 422 });

  const supabase = createAdminClient();
  const { data: fileRow } = await supabase
    .from("proposal_files")
    .select("*")
    .eq("id", fileId)
    .eq("proposal_id", id)
    .single();
  if (!fileRow) return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });

  await supabase.storage.from("seleccion-nauno-files").remove([fileRow.storage_path]);
  await supabase.from("proposal_files").delete().eq("id", fileId);

  return NextResponse.json({ ok: true });
}
