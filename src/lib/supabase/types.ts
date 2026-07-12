export type ProposalStatus = "draft" | "submitted";

export type FileKind = "master_plan" | "referente";

export interface Proposal {
  id: string;
  proposal_code: string;
  status: ProposalStatus;
  master_plan_notes: string | null;
  referentes_narrativa: string | null;
  memoria_conceptual: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface ProposalFile {
  id: string;
  proposal_id: string;
  kind: FileKind;
  storage_path: string;
  file_name: string;
  uploaded_at: string;
}

export interface IdentificationForm {
  id: string;
  proposal_id: string;
  firm_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  submitted_at: string;
  revealed_at: string | null;
  revealed_by: string | null;
}

export interface Evaluation {
  id: string;
  proposal_id: string;
  evaluator_id: string;
  score_master_plan: number;
  score_referentes: number;
  score_memoria: number;
  total_score: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export const EVALUATION_CRITERIA: {
  key: keyof Pick<Evaluation, "score_master_plan" | "score_referentes" | "score_memoria">;
  label: string;
  hint: string;
}[] = [
  { key: "score_master_plan", label: "Master Plan", hint: "Implantación y respuesta al lote" },
  { key: "score_referentes", label: "Referentes", hint: "Concepto e intención espacial" },
  { key: "score_memoria", label: "Memoria conceptual", hint: "Claridad del razonamiento" },
];
