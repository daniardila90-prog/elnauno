-- Los socios comparten una sola cuenta, así que la unicidad por
-- (proposal_id, evaluator_id) hacía que cada uno sobrescribiera la nota del
-- anterior: para la base todos eran el mismo usuario y solo sobrevivía la
-- última evaluación. Ahora cada socio se identifica por su nombre al calificar.

alter table public.evaluations
  add column if not exists evaluator_name text;

-- Si existieran notas previas, se conservan bajo un nombre genérico en vez de
-- perderse al volver la columna obligatoria.
update public.evaluations
  set evaluator_name = 'Socio sin identificar'
  where evaluator_name is null or btrim(evaluator_name) = '';

alter table public.evaluations
  alter column evaluator_name set not null;

alter table public.evaluations
  drop constraint if exists evaluations_evaluator_name_not_blank;
alter table public.evaluations
  add constraint evaluations_evaluator_name_not_blank
  check (btrim(evaluator_name) <> '');

-- Clave normalizada para la unicidad: "Juan", "juan " y "JUAN" son el mismo
-- socio. Es columna generada para que la integridad no dependa de la app.
alter table public.evaluations
  add column if not exists evaluator_key text
  generated always as (lower(btrim(evaluator_name))) stored;

alter table public.evaluations
  drop constraint if exists evaluations_proposal_id_evaluator_id_key;

alter table public.evaluations
  drop constraint if exists evaluations_proposal_evaluator_key_key;
alter table public.evaluations
  add constraint evaluations_proposal_evaluator_key_key
  unique (proposal_id, evaluator_key);
