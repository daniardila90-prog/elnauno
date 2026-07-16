import { z } from "zod";

export const conceptoSchema = z.object({
  concepto_frase: z.string().min(1, "Escribe el concepto en una frase."),
  concepto_desarrollo: z.string().min(1, "Describe el desarrollo del concepto."),
});
export type ConceptoValues = z.infer<typeof conceptoSchema>;

export const sitioSchema = z.object({
  sitio_oportunidades: z.string().min(1, "Describe las oportunidades del sitio."),
});
export type SitioValues = z.infer<typeof sitioSchema>;

export const volumetriaSchema = z.object({
  volumetria_estrategia: z.string().min(1, "Describe la estrategia volumétrica."),
  volumetria_organizacion: z.string().min(1, "Describe la organización general."),
});
export type VolumetriaValues = z.infer<typeof volumetriaSchema>;

export const fachadaSchema = z.object({
  fachada_material_principal: z.string().min(1, "Indica el material principal."),
  fachada_material_secundario: z.string().min(1, "Indica el material secundario."),
  fachada_acabado: z.string().min(1, "Indica el acabado o la textura."),
  fachada_carpinteria: z.string().min(1, "Indica la carpintería o el vidrio."),
  fachada_estrategia: z.string().min(1, "Describe la estrategia de materiales."),
  fachada_intencion: z.string().min(1, "Describe la intención de la fachada en una frase."),
});
export type FachadaValues = z.infer<typeof fachadaSchema>;

/**
 * Semanas de una fase. Un campo vacío se convierte en 0 al coercionar, así que
 * `positive` es lo que hace de "obligatorio": rechaza tanto el vacío como un 0.
 */
const semanas = z.coerce.number().positive("Indique las semanas.");

export const fasesSchema = z.object({
  fases_json: z.object({
    anteproyecto_semanas: semanas,
    proyecto_semanas: semanas,
    coordinacion_semanas: semanas,
    documentos_semanas: semanas,
  }),
  enfoque_trabajo: z.string().min(1, "Describe la metodología de trabajo."),
});
export type FasesValues = z.infer<typeof fasesSchema>;

export const identificationSchema = z.object({
  firm_name: z.string().min(1, "Nombre de la firma requerido."),
  contact_name: z.string().min(1, "Nombre de contacto requerido."),
  email: z.string().email("Correo inválido."),
  phone: z.string().min(1, "Teléfono requerido."),
});
export type IdentificationValues = z.infer<typeof identificationSchema>;
