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
  score_concepto: number;
  score_sitio: number;
  score_volumetria: number;
  score_fachada: number;
  score_imagen: number;
  score_viabilidad: number;
  total_score: number;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export type CriterionKey =
  | "score_concepto"
  | "score_sitio"
  | "score_volumetria"
  | "score_fachada"
  | "score_imagen"
  | "score_viabilidad";

// Los 6 criterios corresponden uno a uno con las secciones que las firmas
// entregan en el formulario 2026: así el socio califica exactamente lo que la
// propuesta contiene, sin evaluar cosas que no se pidieron.
export const EVALUATION_CRITERIA: { key: CriterionKey; label: string; short: string; hint: string }[] = [
  { key: "score_concepto", label: "Concepto de diseño", short: "Concepto", hint: "Idea rectora y claridad de la propuesta" },
  { key: "score_sitio", label: "Implantación y sitio", short: "Sitio", hint: "Respuesta al lote, masterplan y entorno" },
  { key: "score_volumetria", label: "Volumetría y organización", short: "Volumetría", hint: "Estrategia volumétrica, circulaciones y función" },
  { key: "score_fachada", label: "Materialidad y fachada", short: "Fachada", hint: "Lenguaje de fachada, materiales y clima" },
  { key: "score_imagen", label: "Imagen del proyecto", short: "Imagen", hint: "Calidad y coherencia de la propuesta visual" },
  { key: "score_viabilidad", label: "Viabilidad y fases", short: "Viabilidad", hint: "Cronograma, metodología y realismo" },
];

export const EVALUATION_SCALE_MAX = 10;

// Anclas de la escala 0–10. Dan un lenguaje común: sin ellas, el "7" de un
// socio no significa lo mismo que el de otro. Ordenadas de mayor a menor.
export type ScoreBand = { min: number; max: number; label: string; description: string };

export const SCORE_BANDS: ScoreBand[] = [
  { min: 9, max: 10, label: "Excepcional", description: "Referente: resuelve el criterio de forma sobresaliente, coherente y bien fundamentada." },
  { min: 7, max: 8, label: "Notable", description: "Resolución sólida que aporta valor claro; detalles menores por afinar." },
  { min: 5, max: 6, label: "Adecuado", description: "Cumple el criterio de forma correcta pero genérica, sin destacar." },
  { min: 3, max: 4, label: "Básico", description: "Resuelto de forma parcial o superficial, con vacíos relevantes." },
  { min: 0, max: 2, label: "Insuficiente", description: "No resuelve el criterio o presenta deficiencias graves." },
];

export function scoreBand(score: number): ScoreBand {
  return (
    SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ??
    SCORE_BANDS[SCORE_BANDS.length - 1]
  );
}

// Las notas extremas (muy bajas o muy altas) son las que más mueven el
// resultado y las más expuestas a sesgo: por eso exigen justificación escrita.
export const EXTREME_LOW = 3; // ≤ 3
export const EXTREME_HIGH = 9; // ≥ 9

export function isExtremeScore(score: number): boolean {
  return score <= EXTREME_LOW || score >= EXTREME_HIGH;
}
