create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  store_name text not null default 'Kitty Kawaii',
  bank_name text,
  bank_account_name text,
  bank_account_no text,
  promptpay_no text,
  payment_qr_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (
  store_name,
  bank_name,
  bank_account_name,
  bank_account_no
)
select
  'Kitty Kawaii',
  'กรุณาระบุธนาคาร',
  'กรุณาระบุชื่อบัญชี',
  'กรุณาระบุเลขบัญชี'
where not exists (select 1 from public.store_settings);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  slip_image_url text not null,
  amount numeric(10,2),
  transfer_datetime timestamptz,
  verification_provider text,
  verification_status text not null default 'pending',
  verification_message text,
  verification_result_json jsonb,
  checked_by uuid references public.profiles(id),
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx
  on public.payments(order_id);

alter table public.store_settings enable row level security;
alter table public.payments enable row level security;

insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', true)
on conflict (id) do nothing;
