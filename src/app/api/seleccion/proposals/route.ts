import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateProposalCode } from "@/lib/proposal-code";
import { getClientIp, withinRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit por IP: frena creación masiva y fuerza bruta del código.
  const ip = getClientIp(req);
  if (!(await withinRateLimit(`create:${ip}`, 15, 600))) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  // Solo las firmas invitadas pueden iniciar una propuesta: se exige el código
  // de invitación desde el primer paso (no solo al enviar). Esto evita que
  // terceros creen propuestas o suban archivos sin autorización.
  const expectedCode = (process.env.SELECCION_ACCESS_CODE ?? "").trim();
  let accessCode = "";
  try {
    const body = await req.json();
    accessCode = String(body?.access_code ?? "").trim();
  } catch {
    accessCode = "";
  }

  if (!expectedCode || accessCode !== expectedCode) {
    return NextResponse.json(
      { error: "Código de invitación inválido.", invalid_code: true },
      { status: 403 }
    );
  }

  const supabase = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const proposal_code = generateProposalCode();
    const { data, error } = await supabase
      .from("proposals")
      .insert({ proposal_code })
      .select("id, proposal_code")
      .single();

    if (!error) {
      return NextResponse.json(data, { status: 201 });
    }

    // 23505 = unique_violation en Postgres; reintenta con otro código.
    if (error.code !== "23505") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "No se pudo generar un código de propuesta único." },
    { status: 500 }
  );
}
