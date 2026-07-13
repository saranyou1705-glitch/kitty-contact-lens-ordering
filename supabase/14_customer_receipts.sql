alter table public.orders
  add column if not exists customer_received_at timestamptz,
  add column if not exists customer_received_note text,
  add column if not exists customer_receipt_image_urls jsonb default '[]'::jsonb;

create table if not exists public.customer_receipts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.profiles(id),
  note text,
  image_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.customer_receipts(id) on delete cascade,
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  checked boolean not null default false,
  received_quantity integer not null default 0,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public)
values ('delivery-receipts', 'delivery-receipts', true)
on conflict (id) do nothing;
