-- ============================================================
--  Seguridad de la Experiencia Privada (VIP)
--  Correr completo en Supabase > SQL Editor. Se puede correr más de una vez.
--
--  1. Límite de intentos: 10 claves equivocadas en 15 min desde la misma IP
--     bloquean esa IP 15 min. Aplica a todas las funciones vip_*.
--  2. Con clave inválida, las funciones ya no lanzan error (así el intento
--     queda registrado y no sirven para adivinar claves).
--  3. vip_actualizar_perfumes: el máximo nunca baja de lo ya elegido.
-- ============================================================

-- 1) Registro de intentos fallidos (solo accesible desde estas funciones).
create table if not exists public.vip_intentos (
  id bigserial primary key,
  ip text not null,
  creado_en timestamptz not null default now()
);
create index if not exists vip_intentos_ip_fecha on public.vip_intentos (ip, creado_en);
alter table public.vip_intentos enable row level security;
revoke all on public.vip_intentos from anon, authenticated;

-- 2) Valida la clave y aplica el límite. Devuelve el id del cliente o null.
create or replace function public.vip_cliente_id(p_username text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_headers json := nullif(current_setting('request.headers', true), '')::json;
  v_ip text := coalesce(
    v_headers->>'cf-connecting-ip',
    v_headers->>'x-real-ip',
    trim(split_part(v_headers->>'x-forwarded-for', ',', 1))
  );
  v_id uuid;
begin
  if v_ip is not null and (
    select count(*) from vip_intentos
    where ip = v_ip and creado_en > now() - interval '15 minutes'
  ) >= 10 then
    raise exception 'Demasiados intentos. Espera 15 minutos.';
  end if;

  select id into v_id
  from clientes_vip
  where lower(username) = lower(trim(p_username)) and activo = true
  limit 1;

  if v_id is null then
    insert into vip_intentos (ip) values (coalesce(v_ip, 'desconocida'));
    delete from vip_intentos where creado_en < now() - interval '1 day';
  end if;
  return v_id;
end;
$$;
revoke all on function public.vip_cliente_id(text) from public, anon, authenticated;

-- 3) Funciones públicas, ahora pasando por vip_cliente_id.
create or replace function public.validar_vip(p_username text)
returns table(nombre text, telefono text, saldo numeric)
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_cliente uuid := vip_cliente_id(p_username);
begin
  if v_cliente is null then return; end if;
  return query
    select c.nombre::text, c.telefono::text, c.saldo::numeric from clientes_vip c where c.id = v_cliente;
end;
$$;

create or replace function public.vip_sesiones(p_username text)
returns setof sesiones_vip
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_cliente uuid := vip_cliente_id(p_username);
begin
  if v_cliente is null then return; end if;
  return query
    select s.* from sesiones_vip s
    where s.cliente_id = v_cliente
    order by s.creado_en desc;
end;
$$;

create or replace function public.vip_guardar_anotaciones(p_username text, p_sesion_id uuid, p_anotaciones jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_cliente uuid := vip_cliente_id(p_username);
begin
  if v_cliente is null then return; end if;
  update sesiones_vip
  set anotaciones = coalesce(p_anotaciones, '{}'::jsonb)
  where id = p_sesion_id and cliente_id = v_cliente;
end;
$$;

create or replace function public.vip_enviar_pedido(p_username text, p_sesion_id uuid, p_pedido jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare v_cliente uuid := vip_cliente_id(p_username);
begin
  if v_cliente is null then return; end if;
  update sesiones_vip
  set pedido_final = coalesce(p_pedido, '[]'::jsonb),
      pedido_enviado = true
  where id = p_sesion_id and cliente_id = v_cliente;
end;
$$;

create or replace function public.vip_actualizar_perfumes(p_username text, p_sesion_id uuid, p_perfumes jsonb)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cliente uuid := vip_cliente_id(p_username);
  v_estado text;
  v_inversion numeric;
  v_actuales int;
  v_por_perfume numeric;
  v_max int;
  v_cant int;
begin
  if v_cliente is null then return; end if;

  select estado, inversion_declarada, jsonb_array_length(coalesce(perfumes, '[]'::jsonb))
  into v_estado, v_inversion, v_actuales
  from sesiones_vip
  where id = p_sesion_id and cliente_id = v_cliente;
  if v_estado is null then
    raise exception 'sesion no encontrada';
  end if;
  if v_estado <> 'pendiente' then
    raise exception 'la sesion ya no se puede editar';
  end if;

  select coalesce(inversion_por_perfume, 1000) into v_por_perfume
  from config_vip where id = 1;
  v_por_perfume := coalesce(nullif(v_por_perfume, 0), 1000);
  -- Nunca por debajo de lo que ya tenía (si sube el precio por perfume).
  v_max := greatest(floor(coalesce(v_inversion, 0) / v_por_perfume)::int, v_actuales);

  v_cant := jsonb_array_length(coalesce(p_perfumes, '[]'::jsonb));
  if v_cant < 1 then
    raise exception 'elige al menos un perfume';
  end if;
  if v_cant > v_max then
    raise exception 'excede el maximo de perfumes para tu inversion';
  end if;

  update sesiones_vip
  set perfumes = p_perfumes,
      perfumes_actualizado_en = now()
  where id = p_sesion_id and cliente_id = v_cliente;
end;
$$;

create or replace function public.vip_agendar(
  p_username text, p_num_personas integer, p_perfumes jsonb, p_inversion numeric,
  p_preferencia text, p_lugar text, p_dia text, p_asistentes jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cliente uuid := vip_cliente_id(p_username);
  v_id uuid;
begin
  -- Clave inválida: devuelve null (la página lo trata como error).
  if v_cliente is null then return null; end if;

  insert into sesiones_vip (
    cliente_id, num_personas, perfumes, inversion_declarada,
    preferencia, lugar, dia, asistentes, estado
  ) values (
    v_cliente, coalesce(p_num_personas, 1), coalesce(p_perfumes, '[]'::jsonb),
    coalesce(p_inversion, 0), p_preferencia, p_lugar, p_dia,
    coalesce(p_asistentes, '[]'::jsonb), 'pendiente'
  ) returning id into v_id;

  return v_id;
end;
$$;
