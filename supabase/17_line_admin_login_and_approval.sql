alter table public.profiles
  add column if not exists nickname text,
  add column if not exists shop_name text,
  add column if not exists customer_code text unique,
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending','approved','rejected','suspended')),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id);

update public.profiles
set approval_status = 'approved'
where role in ('admin','super_admin') and approval_status = 'pending';

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs(created_at desc);
create index if not exists audit_logs_actor_id_idx
  on public.audit_logs(actor_id);
