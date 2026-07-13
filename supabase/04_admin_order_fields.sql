alter table public.orders
  add column if not exists carrier text,
  add column if not exists admin_note text,
  add column if not exists shipping_quoted_at timestamptz;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value_json jsonb,
  new_value_json jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx
  on public.audit_logs(entity_type, entity_id);

alter table public.audit_logs enable row level security;
