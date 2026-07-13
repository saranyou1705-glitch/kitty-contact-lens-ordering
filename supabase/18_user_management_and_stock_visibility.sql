
alter table public.profiles
  add column if not exists customer_tier text not null default 'normal'
    check (customer_tier in ('normal','vip','vvip'));

create table if not exists public.customer_stock_visibility_settings (
  id integer primary key default 1 check (id = 1),
  normal_percent numeric(5,2) not null default 25,
  vip_percent numeric(5,2) not null default 40,
  vvip_percent numeric(5,2) not null default 60,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.customer_stock_visibility_settings
  (id, normal_percent, vip_percent, vvip_percent)
values (1,25,40,60)
on conflict (id) do nothing;

create sequence if not exists public.customer_code_seq start 1;

create or replace function public.generate_customer_code()
returns text
language sql
as $$
  select 'CUS-' || lpad(nextval('public.customer_code_seq')::text, 6, '0');
$$;

update public.profiles
set customer_tier = 'normal'
where customer_tier is null;

create index if not exists profiles_approval_status_idx
  on public.profiles(approval_status);
create index if not exists profiles_customer_tier_idx
  on public.profiles(customer_tier);
create index if not exists profiles_line_user_id_idx
  on public.profiles(line_user_id);
