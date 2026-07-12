import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateProposalCode } from "@/lib/proposal-code";

export async function POST() {
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
