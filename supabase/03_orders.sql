create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,
  customer_id uuid not null references public.profiles(id),
  address_id uuid not null references public.customer_addresses(id),
  status text not null default 'submitted',
  subtotal numeric(10,2) not null default 0,
  shipping_fee numeric(10,2),
  total_amount numeric(10,2),
  customer_note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  color_id uuid references public.product_colors(id),
  variant_id uuid references public.product_variants(id),
  model_name_snapshot text not null,
  color_name_snapshot text not null,
  power_snapshot text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(10,2) not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.generate_order_no()
returns text
language plpgsql
as $$
declare
  today_text text;
  next_seq integer;
begin
  today_text := to_char(current_date, 'YYYYMMDD');

  select coalesce(max(cast(right(order_no, 4) as integer)), 0) + 1
  into next_seq
  from public.orders
  where order_no like 'KK-' || today_text || '-%';

  return 'KK-' || today_text || '-' || lpad(next_seq::text, 4, '0');
end;
$$;
