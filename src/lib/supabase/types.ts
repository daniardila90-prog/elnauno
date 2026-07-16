export type ProposalStatus = "draft" | "submitted";

export type FileKind = "concepto" | "masterplan" | "volumetria" | "organizacion" | "proyecto";

export interface FasesJson {
  anteproyecto_semanas?: number;
  proyecto_semanas?: number;
  coordinacion_semanas?: number;
  documentos_semanas?: number;
}

export interface Proposal {
  id: string;
  proposal_code: string;
  status: ProposalStatus;

  // Concepto de diseño
  concepto_frase: string | null;
  concepto_desarrollo: string | null;

  // Análisis de sitio y emplazamiento
  sitio_oportunidades: string | null;
  sitio_condicionantes: string | null;

  // Materialidad y volumetría
  volumetria_estrategia: string | null;
  volumetria_organizacion: string | null;

  // Fachada
  fachada_material_principal: string | null;
  fachada_material_secundario: string | null;
  fachada_acabado: string | null;
  fachada_carpinteria: string | null;
  fachada_estrategia: string | null;
  fachada_intencion: string | null;

  // Fases de diseño
  fases_json: FasesJson;
  enfoque_trabajo: string | null;

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
  /** Nombre del socio que calificó: los socios comparten una sola cuenta. */
  evaluator_name: string;
  /** Versión normalizada de evaluator_name; la genera la base. */
  evaluator_key: string;
  score_master_plan: number;
  score_referentes: number;
  score_memoria: number;
  total_score: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

// Nota: las columnas de DB de la rúbrica conservan sus nombres originales
// (score_master_plan / score_referentes / score_memoria); solo cambian las
// etiquetas visibles para alinearlas con las secciones de la plantilla 2026.
export const EVALUATION_CRITERIA: {
  key: keyof Pick<Evaluation, "score_master_plan" | "score_referentes" | "score_memoria">;
  label: string;
  hint: string;
}[] = [
  { key: "score_master_plan", label: "Concepto y emplazamiento", hint: "Idea rectora e implantación en el lote" },
  { key: "score_referentes", label: "Materialidad y volumetría", hint: "Estrategia volumétrica y de materiales" },
  { key: "score_memoria", label: "Fachada y viabilidad", hint: "Lenguaje de fachada y fases de diseño" },
];
