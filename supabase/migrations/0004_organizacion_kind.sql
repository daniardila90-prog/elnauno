-- El paso de volumetría ahora pide dos imágenes separadas: la estrategia de
-- volumen ('volumetria') y la organización funcional y circulaciones
-- ('organizacion'), que antes no existía como sección de archivo.

alter table public.proposal_files drop constraint if exists proposal_files_kind_check;

alter table public.proposal_files
  add constraint proposal_files_kind_check
  check (kind in ('concepto', 'masterplan', 'volumetria', 'organizacion', 'proyecto'));
