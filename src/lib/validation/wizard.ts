import { z } from "zod";

export const conceptoSchema = z.object({
  concepto_frase: z.string().min(1, "Escribe el concepto en una frase."),
  concepto_desarrollo: z.string().min(1, "Describe el desarrollo del concepto."),
});
export type ConceptoValues = z.infer<typeof conceptoSchema>;

export const sitioSchema = z.object({
  sitio_oportunidades: z.string().min(1, "Describe las oportunidades del sitio."),
  sitio_condicionantes: z.string().min(1, "Describe los condicionantes y la normativa."),
});
export type SitioValues = z.infer<typeof sitioSchema>;

export const volumetriaSchema = z.object({
  volumetria_estrategia: z.string().min(1, "Describe la estrategia volumétrica."),
  volumetria_organizacion: z.string().min(1, "Describe la organización general."),
});
export type VolumetriaValues = z.infer<typeof volumetriaSchema>;

export const fachadaSchema = z.object({
  fachada_material_principal: z.string().min(1, "Indica el material principal."),
  fachada_material_secundario: z.string().optional(),
  fachada_acabado: z.string().optional(),
  fachada_carpinteria: z.string().optional(),
  fachada_estrategia: z.string().min(1, "Describe la estrategia de materiales."),
  fachada_intencion: z.string().min(1, "Describe la intención de la fachada en una frase."),
});
export type FachadaValues = z.infer<typeof fachadaSchema>;

export const fasesSchema = z.object({
  fases_json: z.object({
    anteproyecto_semanas: z.coerce.number().nonnegative().optional(),
    proyecto_semanas: z.coerce.number().nonnegative().optional(),
    coordinacion_semanas: z.coerce.number().nonnegative().optional(),
    documentos_semanas: z.coerce.number().nonnegative().optional(),
  }),
  enfoque_trabajo: z.string().optional(),
});
export type FasesValues = z.infer<typeof fasesSchema>;

export const identificationSchema = z.object({
  firm_name: z.string().min(1, "Nombre de la firma requerido."),
  contact_name: z.string().min(1, "Nombre de contacto requerido."),
  email: z.string().email("Correo inválido."),
  phone: z.string().min(1, "Teléfono requerido."),
});
export type IdentificationValues = z.infer<typeof identificationSchema>;
