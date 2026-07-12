"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function revealIdentity(proposalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { error } = await supabase
    .from("identification_forms")
    .update({ revealed_at: new Date().toISOString(), revealed_by: user.id })
    .eq("proposal_id", proposalId);
  if (error) throw new Error(error.message);

  revalidatePath(`/seleccion/admin/propuestas/${proposalId}`);
}
