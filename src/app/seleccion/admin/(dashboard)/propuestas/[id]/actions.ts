"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withinRateLimit } from "@/lib/rate-limit";
import {
  EVALUATION_CRITERIA,
  EVALUATION_SCALE_MAX,
  isExtremeScore,
} from "@/lib/supabase/types";
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

  const scores = {} as Record<(typeof EVALUATION_CRITERIA)[number]["key"], number>;
  for (const c of EVALUATION_CRITERIA) {
    const value = Number(formData.get(c.key));
    if (!Number.isInteger(value) || value < 0 || value > EVALUATION_SCALE_MAX) {
      return { ok: false, error: `Puntaje inválido en "${c.label}".` };
    }
    scores[c.key] = value;
  }

  const comments = String(formData.get("comments") ?? "").trim();

  // Toda nota extrema (muy baja o muy alta) debe quedar justificada: es la
  // regla que sostiene la objetividad, así que se valida también en el servidor
  // y no solo en el formulario.
  const extremos = EVALUATION_CRITERIA.filter((c) => isExtremeScore(scores[c.key]));
  if (extremos.length > 0 && comments === "") {
    const nombres = extremos.map((c) => c.label).join(", ");
    return {
      ok: false,
      error: `Justifique en los comentarios las notas extremas de: ${nombres}.`,
    };
  }

  const { error } = await supabase.from("evaluations").upsert(
    {
      proposal_id: proposalId,
      evaluator_id: user.id,
      evaluator_name: evaluatorName,
      ...scores,
      comments,
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
