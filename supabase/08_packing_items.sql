create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  ordered_quantity integer not null,
  packed_quantity integer not null default 0 check (packed_quantity >= 0),
  is_checked boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_item_id)
);

create index if not exists packing_items_order_id_idx
  on public.packing_items(order_id);

alter table public.packing_items enable row level security;
