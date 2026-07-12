import { z } from "zod";

export const masterPlanSchema = z.object({
  master_plan_notes: z.string().min(1, "Cuéntanos brevemente sobre tu master plan."),
});
export type MasterPlanValues = z.infer<typeof masterPlanSchema>;

export const referentesSchema = z.object({
  referentes_narrativa: z
    .string()
    .min(1, "Describe cómo se siente/vibra la arquitectura dentro del hotel."),
});
export type ReferentesValues = z.infer<typeof referentesSchema>;

export const memoriaSchema = z.object({
  memoria_conceptual: z.string().min(1, "Escribe la memoria conceptual."),
});
export type MemoriaValues = z.infer<typeof memoriaSchema>;

export const identificationSchema = z.object({
  firm_name: z.string().min(1, "Nombre de la firma requerido."),
  contact_name: z.string().min(1, "Nombre de contacto requerido."),
  email: z.string().email("Correo inválido."),
  phone: z.string().min(1, "Teléfono requerido."),
});
export type IdentificationValues = z.infer<typeof identificationSchema>;
