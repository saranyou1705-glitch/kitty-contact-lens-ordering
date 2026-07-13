
alter table public.payment_batches
  add column if not exists checked_by uuid references public.profiles(id);

create index if not exists payment_batches_status_idx
  on public.payment_batches(status);

create index if not exists payment_batches_verification_idx
  on public.payment_batches(verification_status);
