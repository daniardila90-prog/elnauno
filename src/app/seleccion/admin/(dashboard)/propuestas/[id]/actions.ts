"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withinRateLimit } from "@/lib/rate-limit";
import {
  passphraseIsConfigured,
  passphraseMatches,
  revealAvailableFromLabel,
  revealIsOpen,
} from "@/lib/identity-reveal";

export async function saveEvaluation(proposalId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const scores = {
    score_master_plan: Number(formData.get("score_master_plan")),
    score_referentes: Number(formData.get("score_referentes")),
    score_memoria: Number(formData.get("score_memoria")),
  };
  const comments = String(formData.get("comments") ?? "");

  const { error } = await supabase.from("evaluations").upsert(
    {
      proposal_id: proposalId,
      evaluator_id: user.id,
      ...scores,
      comments,
    },
    { onConflict: "proposal_id,evaluator_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/seleccion/admin/propuestas/${proposalId}`);
}

export type RevealResult = { ok: true } | { ok: false; error: string };

/**
 * Levantar el anonimato exige dos llaves: que la fecha ya esté abierta y la
 * passphrase que custodia el organizador. Ambas se validan aquí, en el
 * servidor: el botón del panel solo es una ayuda visual.
 */
export async function revealIdentity(
  proposalId: string,
  passphrase: string
): Promise<RevealResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  if (!revealIsOpen()) {
    return {
      ok: false,
      error: `La identidad no se puede revelar antes del ${revealAvailableFromLabel()}.`,
    };
  }

  if (!passphraseIsConfigured()) {
    return {
      ok: false,
      error: "Aún no se ha configurado la clave de revelación. Contacte al organizador.",
    };
  }

  // Frena el probar claves a fuerza bruta desde el panel.
  if (!(await withinRateLimit(`reveal:${user.id}`, 5, 900))) {
    return { ok: false, error: "Demasiados intentos. Espere unos minutos." };
  }

  if (!(await passphraseMatches(passphrase))) {
    return { ok: false, error: "Clave de revelación incorrecta." };
  }

  const { error } = await supabase
    .from("identification_forms")
    .update({ revealed_at: new Date().toISOString(), revealed_by: user.id })
    .eq("proposal_id", proposalId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/seleccion/admin/propuestas/${proposalId}`);
  return { ok: true };
}
