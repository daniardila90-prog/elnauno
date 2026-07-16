-- La rúbrica pasa de 3 criterios genéricos a 6 alineados con el formulario
-- 2026 de El Nauno (concepto, sitio, volumetría, fachada, imagen, viabilidad).
-- Las notas anteriores (3 criterios) no tienen equivalencia directa con las
-- nuevas, así que no se migran: la evaluación aún no ha comenzado (la identidad
-- se revela desde el 28 de julio). Si existieran filas, quedan y deben
-- recalificarse con los criterios nuevos.

-- 1. La columna generada total_score depende de los puntajes: se quita primero.
alter table public.evaluations drop column if exists total_score;

-- 2. Quitar los 3 criterios anteriores.
alter table public.evaluations drop column if exists score_master_plan;
alter table public.evaluations drop column if exists score_referentes;
alter table public.evaluations drop column if exists score_memoria;

-- 3. Los 6 criterios nuevos (0–10). El default temporal permite marcarlos
--    NOT NULL aunque existan filas; se retira enseguida porque la aplicación
--    siempre envía los 6 valores.
alter table public.evaluations
  add column if not exists score_concepto   smallint not null default 5 check (score_concepto   between 0 and 10),
  add column if not exists score_sitio      smallint not null default 5 check (score_sitio       between 0 and 10),
  add column if not exists score_volumetria smallint not null default 5 check (score_volumetria  between 0 and 10),
  add column if not exists score_fachada    smallint not null default 5 check (score_fachada     between 0 and 10),
  add column if not exists score_imagen     smallint not null default 5 check (score_imagen      between 0 and 10),
  add column if not exists score_viabilidad smallint not null default 5 check (score_viabilidad  between 0 and 10);

alter table public.evaluations
  alter column score_concepto   drop default,
  alter column score_sitio      drop default,
  alter column score_volumetria drop default,
  alter column score_fachada    drop default,
  alter column score_imagen     drop default,
  alter column score_viabilidad drop default;

-- 4. Nuevo total: promedio simple de los 6 criterios (mismo peso cada uno).
alter table public.evaluations
  add column total_score numeric generated always as (
    (score_concepto + score_sitio + score_volumetria + score_fachada +
     score_imagen + score_viabilidad)::numeric / 6
  ) stored;
