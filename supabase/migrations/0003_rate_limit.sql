-- Rate limiting por IP para los endpoints públicos (crear propuesta, subir
-- archivo, enviar). Contador atómico por ventana de tiempo, en Postgres.

create table if not exists public.rate_limits (
  bucket_key text primary key,
  count int not null default 0,
  expires_at timestamptz not null
);

-- Solo la service-role (Route Handlers) puede tocar esta tabla.
alter table public.rate_limits enable row level security;

-- Incrementa el contador de la ventana actual y devuelve true si aún está
-- dentro del límite. Atómico gracias al INSERT ... ON CONFLICT ... RETURNING.
create or replace function public.check_rate_limit(
  p_key text,
  p_max int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window bigint := floor(extract(epoch from now()) / p_window_seconds);
  v_bucket text := p_key || ':' || v_window;
  v_count int;
begin
  insert into public.rate_limits (bucket_key, count, expires_at)
  values (v_bucket, 1, now() + make_interval(secs => p_window_seconds * 2))
  on conflict (bucket_key)
  do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- limpieza oportunista de ventanas expiradas
  delete from public.rate_limits where expires_at < now();

  return v_count <= p_max;
end;
$$;
