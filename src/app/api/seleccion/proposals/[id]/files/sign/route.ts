import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";
import {
  BUCKET,
  KIND_RULES,
  MAX_SIZE_BYTES,
  extensionOf,
  formatsLabel,
  isUploadKind,
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

  if (!isUploadKind(kind)) {
    return NextResponse.json({ error: "Sección de archivo inválida." }, { status: 422 });
  }
  if (!fileName) {
    return NextResponse.json({ error: "Nombre de archivo requerido." }, { status: 422 });
  }
  const rule = KIND_RULES[kind];
  const ext = extensionOf(fileName);
  if (!rule.extensions.includes(ext as never)) {
    return NextResponse.json(
      { error: `Formato no permitido (.${ext}). En esta sección se acepta ${formatsLabel(kind)}.` },
      { status: 422 }
    );
  }
  if (size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "El archivo supera el límite de 50 MB." },
      { status: 422 }
    );
  }

  // El máximo por sección se valida aquí y no solo en el navegador: la subida
  // firmada se pide por HTTP y el conteo del cliente es fácil de saltar.
  const { count } = await supabase
    .from("proposal_files")
    .select("id", { count: "exact", head: true })
    .eq("proposal_id", id)
    .eq("kind", kind);
  if ((count ?? 0) >= rule.max) {
    return NextResponse.json(
      {
        error: `Ya subió el máximo de ${rule.max} ${
          rule.max === 1 ? "archivo" : "archivos"
        } en esta sección. Elimine uno para reemplazarlo.`,
      },
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
