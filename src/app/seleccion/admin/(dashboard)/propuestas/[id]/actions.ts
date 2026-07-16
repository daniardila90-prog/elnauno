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

export type SaveEvaluationResult = { ok: true } | { ok: false; error: string };

export async function saveEvaluation(
  proposalId: string,
  formData: FormData
): Promise<SaveEvaluationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  // Los socios comparten cuenta, así que el nombre es lo único que distingue
  // una evaluación de otra: sin él se sobrescribirían entre sí.
  const evaluatorName = String(formData.get("evaluator_name") ?? "").trim();
  if (!evaluatorName) {
    return { ok: false, error: "Escriba su nombre para guardar la evaluación." };
  }

  const scores = {
    score_master_plan: Number(formData.get("score_master_plan")),
    score_referentes: Number(formData.get("score_referentes")),
    score_memoria: Number(formData.get("score_memoria")),
  };
  for (const value of Object.values(scores)) {
    if (!Number.isInteger(value) || value < 0 || value > 10) {
      return { ok: false, error: "Puntajes inválidos." };
    }
  }

  const { error } = await supabase.from("evaluations").upsert(
    {
      proposal_id: proposalId,
      evaluator_id: user.id,
      evaluator_name: evaluatorName,
      ...scores,
      comments: String(formData.get("comments") ?? ""),
    },
    { onConflict: "proposal_id,evaluator_key" }
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/seleccion/admin/propuestas/${proposalId}`);
  return { ok: true };
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
