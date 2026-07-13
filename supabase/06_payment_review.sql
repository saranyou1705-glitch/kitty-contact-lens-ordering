alter table public.payments
  add column if not exists review_reason text;

alter table public.orders
  add column if not exists payment_confirmed_at timestamptz;
