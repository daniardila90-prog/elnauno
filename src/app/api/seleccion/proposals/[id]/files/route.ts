import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";
import { ALLOWED_EXTENSIONS, ALLOWED_KINDS, BUCKET, extensionOf } from "@/lib/uploads";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Registra un archivo YA subido directo a Supabase Storage (ver /files/sign).
 * Recibe solo metadatos en JSON, nunca los bytes: así se evita el límite de
 * ~4.5 MB que Vercel impone al cuerpo de las funciones serverless.
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { id } = await params;

  const ip = getClientIp(req);
  if (!(await withinRateLimit(`upload:${ip}`, 80, 600))) {
    return NextResponse.json(
      { error: "Demasiadas subidas. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

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

  let body: { kind?: string; storage_path?: string; file_name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const kind = String(body.kind ?? "");
  const storagePath = String(body.storage_path ?? "");
  const fileName = String(body.file_name ?? "");

  if (!ALLOWED_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Sección de archivo inválida." }, { status: 422 });
  }
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(fileName))) {
    return NextResponse.json({ error: "Formato no permitido." }, { status: 422 });
  }
  // La ruta debe pertenecer a esta propuesta: evita registrar objetos ajenos.
  if (!storagePath.startsWith(`${id}/`)) {
    return NextResponse.json({ error: "Ruta de archivo inválida." }, { status: 422 });
  }

  // El objeto debe existir realmente en Storage antes de registrarlo.
  const { data: found, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(id, { search: storagePath.slice(id.length + 1) });
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }
  if (!found || found.length === 0) {
    return NextResponse.json(
      { error: "El archivo no se encontró en el almacenamiento." },
      { status: 422 }
    );
  }

  const { data: fileRow, error: insertError } = await supabase
    .from("proposal_files")
    .insert({ proposal_id: id, kind, storage_path: storagePath, file_name: fileName })
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

  await supabase.storage.from(BUCKET).remove([fileRow.storage_path]);
  await supabase.from("proposal_files").delete().eq("id", fileId);

  return NextResponse.json({ ok: true });
}
