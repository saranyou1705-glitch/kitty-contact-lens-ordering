
alter table public.orders
  add column if not exists fulfillment_status text not null default 'submitted',
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists final_subtotal numeric(10,2),
  add column if not exists final_total numeric(10,2),
  add column if not exists paid_amount numeric(10,2) not null default 0,
  add column if not exists outstanding_amount numeric(10,2),
  add column if not exists payment_due_at timestamptz;

update public.orders
set
  fulfillment_status = case
    when status in ('packing','packed','shipped','completed') then status
    else 'submitted'
  end,
  payment_status = case
    when status = 'payment_confirmed' then 'paid'
    when status = 'payment_uploaded' then 'payment_pending'
    else coalesce(payment_status, 'unpaid')
  end,
  final_subtotal = coalesce(final_subtotal, adjusted_subtotal, subtotal),
  final_total = coalesce(final_total, total_amount, subtotal + coalesce(shipping_fee, 0)),
  outstanding_amount = coalesce(
    outstanding_amount,
    coalesce(total_amount, subtotal + coalesce(shipping_fee, 0)) - coalesce(paid_amount, 0)
  );

create table if not exists public.payment_batches (
  id uuid primary key default gen_random_uuid(),
  batch_no text unique not null,
  customer_id uuid not null references public.profiles(id),
  status text not null default 'draft',
  total_amount numeric(10,2) not null default 0,
  slip_image_url text,
  verification_status text not null default 'not_submitted',
  verification_message text,
  review_reason text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  checked_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_batch_orders (
  id uuid primary key default gen_random_uuid(),
  payment_batch_id uuid not null references public.payment_batches(id) on delete cascade,
  order_id uuid not null references public.orders(id),
  amount_applied numeric(10,2) not null,
  created_at timestamptz not null default now(),
  unique(payment_batch_id, order_id)
);

create index if not exists payment_batches_customer_idx
  on public.payment_batches(customer_id);

create index if not exists payment_batch_orders_batch_idx
  on public.payment_batch_orders(payment_batch_id);

create index if not exists payment_batch_orders_order_idx
  on public.payment_batch_orders(order_id);

alter table public.payment_batches enable row level security;
alter table public.payment_batch_orders enable row level security;

create or replace function public.generate_payment_batch_no()
returns text
language plpgsql
as $$
declare
  today_text text;
  next_seq integer;
begin
  today_text := to_char(current_date, 'YYYYMMDD');

  select coalesce(max(cast(right(batch_no, 4) as integer)), 0) + 1
  into next_seq
  from public.payment_batches
  where batch_no like 'PB-' || today_text || '-%';

  return 'PB-' || today_text || '-' || lpad(next_seq::text, 4, '0');
end;
$$;
