-- Selección arquitectónica — Hotel El Nauno
-- Las firmas participantes nunca acceden directamente a estas tablas (RLS solo permite
-- lectura a admins/socios). Todas las escrituras públicas del wizard pasan por Route
-- Handlers de Next.js usando la service-role key, que ignora RLS por diseño.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  proposal_code text not null unique,
  status text not null default 'draft' check (status in ('draft', 'submitted')),

  master_plan_notes text,
  referentes_narrativa text,
  memoria_conceptual text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index proposals_status_idx on public.proposals (status);

-- ---------------------------------------------------------------------------
-- proposal_files — master plan y referentes subidos (Storage bucket "seleccion-nauno-files")
-- ---------------------------------------------------------------------------
create table public.proposal_files (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  kind text not null check (kind in ('master_plan', 'referente')),
  storage_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- identification_forms — identidad real de la firma, sellada aparte
-- ---------------------------------------------------------------------------
create table public.identification_forms (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null unique references public.proposals (id) on delete cascade,
  firm_name text not null,
  contact_name text,
  email text,
  phone text,
  submitted_at timestamptz not null default now(),
  revealed_at timestamptz,
  revealed_by uuid references auth.users (id)
);

-- ---------------------------------------------------------------------------
-- admins — socios de El Nauno con acceso al panel de evaluación
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- evaluations — rúbrica de evaluación por socio (3 criterios del brief)
-- ---------------------------------------------------------------------------
create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  evaluator_id uuid not null references auth.users (id) on delete cascade,
  score_master_plan smallint not null check (score_master_plan between 0 and 10),
  score_referentes smallint not null check (score_referentes between 0 and 10),
  score_memoria smallint not null check (score_memoria between 0 and 10),
  total_score numeric generated always as (
    (score_master_plan + score_referentes + score_memoria)::numeric / 3
  ) stored,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proposal_id, evaluator_id)
);

-- ---------------------------------------------------------------------------
-- helper: is_admin()
-- ---------------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS — solo admins autenticados pueden leer/escribir vía sesión.
-- Las escrituras públicas del wizard usan la service-role key y no pasan por RLS.
-- ---------------------------------------------------------------------------
alter table public.proposals enable row level security;
alter table public.proposal_files enable row level security;
alter table public.identification_forms enable row level security;
alter table public.admins enable row level security;
alter table public.evaluations enable row level security;

create policy "admins_select_proposals" on public.proposals
  for select using (public.is_admin());

create policy "admins_select_proposal_files" on public.proposal_files
  for select using (public.is_admin());

create policy "admins_select_identification_forms" on public.identification_forms
  for select using (public.is_admin());

create policy "admins_update_identification_forms" on public.identification_forms
  for update using (public.is_admin()) with check (public.is_admin());

create policy "admins_select_admins" on public.admins
  for select using (public.is_admin());

create policy "admins_select_evaluations" on public.evaluations
  for select using (public.is_admin());

create policy "admins_insert_own_evaluations" on public.evaluations
  for insert with check (public.is_admin() and evaluator_id = auth.uid());

create policy "admins_update_own_evaluations" on public.evaluations
  for update using (public.is_admin() and evaluator_id = auth.uid())
  with check (public.is_admin() and evaluator_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket (privado — descargas del admin vía signed URLs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('seleccion-nauno-files', 'seleccion-nauno-files', false)
on conflict (id) do nothing;

create policy "admins_read_seleccion_nauno_files" on storage.objects
  for select using (bucket_id = 'seleccion-nauno-files' and public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger proposals_set_updated_at
  before update on public.proposals
  for each row execute function public.set_updated_at();

create trigger evaluations_set_updated_at
  before update on public.evaluations
  for each row execute function public.set_updated_at();
