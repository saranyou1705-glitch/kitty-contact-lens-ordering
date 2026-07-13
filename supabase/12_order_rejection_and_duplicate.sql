
alter table public.orders
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz,
  add column if not exists duplicated_from_order_id uuid references public.orders(id);

create index if not exists orders_fulfillment_status_idx
  on public.orders(fulfillment_status);

create index if not exists orders_duplicated_from_idx
  on public.orders(duplicated_from_order_id);
