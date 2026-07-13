create extension if not exists pgcrypto;

alter table public.products
  add column if not exists category text,
  add column if not exists product_code text,
  add column if not exists product_updated_at timestamptz default now();

alter table public.product_variants
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists product_type text,
  add column if not exists variant_updated_at timestamptz default now();

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants(sku)
  where sku is not null;

create table if not exists public.inventory_balances (
  variant_id uuid primary key references public.product_variants(id) on delete cascade,
  warehouse_qty integer not null default 0 check (warehouse_qty >= 0),
  packed_qty integer not null default 0 check (packed_qty >= 0),
  shipped_qty integer not null default 0 check (shipped_qty >= 0),
  delivered_qty integer not null default 0 check (delivered_qty >= 0),
  last_counted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type text not null check (movement_type in (
    'count_adjustment','manual_adjustment','pack','unpack','ship','receive','product_opening'
  )),
  from_bucket text check (from_bucket in ('warehouse','packed','shipped','delivered')),
  to_bucket text check (to_bucket in ('warehouse','packed','shipped','delivered')),
  quantity integer not null check (quantity > 0),
  order_id uuid references public.orders(id) on delete set null,
  reference_id uuid,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_variant_idx on public.inventory_movements(variant_id);
create index if not exists inventory_movements_order_idx on public.inventory_movements(order_id);
create index if not exists inventory_movements_occurred_idx on public.inventory_movements(occurred_at desc);

create table if not exists public.inventory_count_sessions (
  id uuid primary key default gen_random_uuid(),
  counted_at timestamptz not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_role text not null,
  filename text,
  total_rows integer not null default 0,
  matched_rows integer not null default 0,
  unmatched_rows integer not null default 0,
  total_difference integer not null default 0,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_count_items (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.inventory_count_sessions(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text not null,
  system_quantity integer,
  counted_quantity integer not null,
  difference integer,
  row_status text not null check (row_status in ('matched','sku_not_found','invalid')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.inventory_balances enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.inventory_count_sessions enable row level security;
alter table public.inventory_count_items enable row level security;

insert into public.inventory_balances (variant_id)
select id from public.product_variants
on conflict (variant_id) do nothing;
