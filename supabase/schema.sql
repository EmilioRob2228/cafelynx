
create table if not exists public.admins (
  email text primary key
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text,
  -- [{"label": "", "price": 45}]; varias entradas = varias opciones de precio
  options jsonb not null default '[{"label":"","price":0}]',
  -- dias de la semana en que se vende (0 = domingo ... 6 = sabado); null = todos
  days int[],
  available boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_counter (
  day date primary key,
  n int not null default 0
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  day date not null default ((now() at time zone 'America/Mexico_City')::date),
  seq int not null,
  code text not null,
  customer_name text not null,
  notes text,
  status text not null default 'pendiente'
    check (status in ('pendiente','preparando','listo','entregado','cancelado')),
  total numeric(10,2) not null,
  created_at timestamptz not null default now(),
  preparing_at timestamptz,
  ready_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  option_label text not null default '',
  unit_price numeric(10,2) not null,   -- precio al momento del pedido
  qty int not null check (qty between 1 and 20)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  ease int not null check (ease between 1 and 5),
  user_type text,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- Admin

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------- Seguridad (RLS)

alter table public.admins        enable row level security;
alter table public.menu_items    enable row level security;
alter table public.daily_counter enable row level security;
alter table public.orders        enable row level security;
alter table public.order_items   enable row level security;
alter table public.surveys       enable row level security;

drop policy if exists menu_read        on public.menu_items;
drop policy if exists menu_admin       on public.menu_items;
drop policy if exists orders_admin_sel on public.orders;
drop policy if exists orders_admin_upd on public.orders;
drop policy if exists items_admin_sel  on public.order_items;
drop policy if exists surveys_admin_sel on public.surveys;

-- Cualquiera puede ver el menu; solo el admin lo modifica.
create policy menu_read on public.menu_items
  for select to anon, authenticated using (true);
create policy menu_admin on public.menu_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Pedidos, partidas y encuestas: solo lectura para el admin.
-- Los clientes crean y consultan pedidos unicamente mediante las funciones de abajo.
create policy orders_admin_sel on public.orders
  for select to authenticated using (public.is_admin());
create policy orders_admin_upd on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy items_admin_sel on public.order_items
  for select to authenticated using (public.is_admin());
create policy surveys_admin_sel on public.surveys
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- Marcas de tiempo por estado

create or replace function public.orders_set_timestamps() returns trigger
language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'preparando' then new.preparing_at := now();
    elsif new.status = 'listo' then new.ready_at := now();
    elsif new.status = 'entregado' then new.delivered_at := now();
    elsif new.status = 'cancelado' then new.cancelled_at := now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists orders_timestamps on public.orders;
create trigger orders_timestamps before update on public.orders
  for each row execute function public.orders_set_timestamps();

-- ---------------------------------------------------------------- Funciones para clientes

-- Crea un pedido validando en el servidor producto, disponibilidad, dia y precio.
create or replace function public.create_order(p_name text, p_notes text, p_items jsonb)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_day   date := (now() at time zone 'America/Mexico_City')::date;
  v_dow   int  := extract(dow from (now() at time zone 'America/Mexico_City'))::int;
  v_seq   int;
  v_id    uuid;
  v_code  text;
  v_total numeric := 0;
  v_price numeric;
  v_qty   int;
  v_clean jsonb := '[]'::jsonb;
  it      jsonb;
  m       public.menu_items;
begin
  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) < 2 or char_length(p_name) > 60 then
    raise exception 'Escribe tu nombre (2 a 60 caracteres).';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 40 then
    raise exception 'El pedido esta vacio.';
  end if;

  for it in select value from jsonb_array_elements(p_items) loop
    v_qty := coalesce((it ->> 'qty')::int, 0);
    if v_qty < 1 or v_qty > 20 then
      raise exception 'Cantidad invalida.';
    end if;

    select * into m from public.menu_items where id = (it ->> 'item_id')::uuid;
    if not found or not m.available then
      raise exception 'Un producto ya no esta disponible.';
    end if;
    if m.days is not null and not (v_dow = any (m.days)) then
      raise exception '% no se vende hoy.', m.name;
    end if;

    select (o ->> 'price')::numeric into v_price
    from jsonb_array_elements(m.options) o
    where coalesce(o ->> 'label', '') = coalesce(it ->> 'label', '')
    limit 1;
    if v_price is null then
      raise exception 'Opcion de precio invalida.';
    end if;

    v_total := v_total + v_price * v_qty;
    v_clean := v_clean || jsonb_build_object(
      'menu_item_id', m.id, 'name', m.name,
      'label', coalesce(it ->> 'label', ''), 'price', v_price, 'qty', v_qty);
  end loop;

  insert into public.daily_counter (day, n) values (v_day, 1)
  on conflict (day) do update set n = public.daily_counter.n + 1
  returning n into v_seq;
  v_code := lpad(v_seq::text, 3, '0');

  insert into public.orders (day, seq, code, customer_name, notes, total)
  values (v_day, v_seq, v_code, p_name,
          nullif(left(btrim(coalesce(p_notes, '')), 200), ''), v_total)
  returning id into v_id;

  insert into public.order_items (order_id, menu_item_id, name, option_label, unit_price, qty)
  select v_id, (e ->> 'menu_item_id')::uuid, e ->> 'name', e ->> 'label',
         (e ->> 'price')::numeric, (e ->> 'qty')::int
  from jsonb_array_elements(v_clean) e;

  return json_build_object('id', v_id, 'code', v_code, 'total', v_total);
end $$;

-- Devuelve un pedido por su id (uuid, no adivinable) con cuantos pedidos van antes.
create or replace function public.get_order(p_id uuid)
returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', o.id, 'code', o.code, 'customer_name', o.customer_name, 'notes', o.notes,
    'status', o.status, 'total', o.total, 'created_at', o.created_at,
    'ready_at', o.ready_at, 'delivered_at', o.delivered_at,
    'ahead', (
      select count(*) from public.orders x
      where x.day = o.day and x.seq < o.seq and x.status in ('pendiente', 'preparando')
    ),
    'items', coalesce((
      select json_agg(json_build_object(
        'name', i.name, 'label', i.option_label, 'price', i.unit_price, 'qty', i.qty))
      from public.order_items i where i.order_id = o.id
    ), '[]'::json),
    'surveyed', exists (select 1 from public.surveys s where s.order_id = o.id)
  )
  from public.orders o where o.id = p_id;
$$;

create or replace function public.submit_survey(
  p_order_id uuid, p_rating int, p_ease int, p_user_type text, p_comment text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'Pedido no encontrado.';
  end if;
  insert into public.surveys (order_id, rating, ease, user_type, comment)
  values (p_order_id, p_rating, p_ease, nullif(left(coalesce(p_user_type, ''), 30), ''),
          nullif(left(btrim(coalesce(p_comment, '')), 500), ''))
  on conflict (order_id) do nothing;
end $$;

grant execute on function public.create_order(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_order(uuid) to anon, authenticated;
grant execute on function public.submit_survey(uuid, int, int, text, text) to anon, authenticated;

-- ---------------------------------------------------------------- Tiempo real (panel de la cafeteria)

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
