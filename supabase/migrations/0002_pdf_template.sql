-- Selección arquitectónica — actualización a la plantilla oficial 2026 (PDF)
-- Reestructura la propuesta a las secciones del PDF: concepto, análisis de sitio,
-- materialidad y volumetría, fachada, imagen del proyecto y fases de diseño.

-- ---------------------------------------------------------------------------
-- Nuevas columnas de contenido
-- ---------------------------------------------------------------------------
alter table public.proposals
  add column if not exists concepto_frase text,
  add column if not exists concepto_desarrollo text,
  add column if not exists sitio_oportunidades text,
  add column if not exists sitio_condicionantes text,
  add column if not exists volumetria_estrategia text,
  add column if not exists volumetria_organizacion text,
  add column if not exists fachada_material_principal text,
  add column if not exists fachada_material_secundario text,
  add column if not exists fachada_acabado text,
  add column if not exists fachada_carpinteria text,
  add column if not exists fachada_estrategia text,
  add column if not exists fachada_intencion text,
  add column if not exists fases_json jsonb not null default '{}'::jsonb,
  add column if not exists enfoque_trabajo text;

-- ---------------------------------------------------------------------------
-- Borrar propuestas de ejemplo viejas (estructura anterior)
-- Las columnas viejas (master_plan_notes, referentes_narrativa, memoria_conceptual)
-- se dejan sin eliminar por compatibilidad durante el despliegue; ya no se usan.
-- ---------------------------------------------------------------------------
delete from public.proposals where proposal_code like 'NAUNO-DEMO%';

-- ---------------------------------------------------------------------------
-- Nuevos tipos de archivo (concepto/masterplan/volumetria/proyecto)
-- ---------------------------------------------------------------------------
delete from public.proposal_files
  where kind not in ('concepto', 'masterplan', 'volumetria', 'proyecto');

alter table public.proposal_files drop constraint if exists proposal_files_kind_check;
alter table public.proposal_files
  add constraint proposal_files_kind_check
  check (kind in ('concepto', 'masterplan', 'volumetria', 'proyecto'));
