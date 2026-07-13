alter table public.orders
  add column if not exists packing_started_at timestamptz,
  add column if not exists packed_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists tracking_no text,
  add column if not exists packed_by uuid references public.profiles(id),
  add column if not exists shipped_by uuid references public.profiles(id);

create index if not exists orders_tracking_no_idx
  on public.orders(tracking_no);
