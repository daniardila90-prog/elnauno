import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_KINDS,
  BUCKET,
  MAX_SIZE_BYTES,
  extensionOf,
  safeStoragePath,
} from "@/lib/uploads";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Devuelve una URL firmada para que el navegador suba el archivo DIRECTO a
 * Supabase Storage, sin pasar por la función serverless (Vercel limita el
 * cuerpo de las peticiones a ~4.5 MB, insuficiente para planos/DWG/renders).
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

  let body: { kind?: string; file_name?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const kind = String(body.kind ?? "");
  const fileName = String(body.file_name ?? "");
  const size = Number(body.size ?? 0);

  if (!ALLOWED_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Sección de archivo inválida." }, { status: 422 });
  }
  if (!fileName) {
    return NextResponse.json({ error: "Nombre de archivo requerido." }, { status: 422 });
  }
  const ext = extensionOf(fileName);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: `Formato no permitido (.${ext}). Use PDF, imágenes, DWG/DXF o ZIP.` },
      { status: 422 }
    );
  }
  if (size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 50 MB." },
      { status: 422 }
    );
  }

  const storagePath = safeStoragePath(id, fileName);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path: storagePath, token: data.token });
}
