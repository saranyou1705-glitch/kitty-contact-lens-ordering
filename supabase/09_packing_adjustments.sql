alter table public.order_items
  add column if not exists original_quantity integer,
  add column if not exists fulfilled_quantity integer,
  add column if not exists original_line_total numeric(10,2),
  add column if not exists adjusted_line_total numeric(10,2),
  add column if not exists fulfillment_changed boolean not null default false;

update public.order_items
set
  original_quantity = coalesce(original_quantity, quantity),
  fulfilled_quantity = coalesce(fulfilled_quantity, quantity),
  original_line_total = coalesce(original_line_total, line_total),
  adjusted_line_total = coalesce(adjusted_line_total, line_total);

alter table public.orders
  add column if not exists original_subtotal numeric(10,2),
  add column if not exists adjusted_subtotal numeric(10,2),
  add column if not exists adjustment_amount numeric(10,2) not null default 0,
  add column if not exists refund_required boolean not null default false;

update public.orders
set
  original_subtotal = coalesce(original_subtotal, subtotal),
  adjusted_subtotal = coalesce(adjusted_subtotal, subtotal);

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  ordered_quantity integer not null,
  packed_quantity integer not null default 0 check (packed_quantity >= 0),
  will_ship boolean not null default true,
  is_checked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_item_id)
);

alter table public.packing_items
  add column if not exists will_ship boolean not null default true;

alter table public.packing_items enable row level security;
