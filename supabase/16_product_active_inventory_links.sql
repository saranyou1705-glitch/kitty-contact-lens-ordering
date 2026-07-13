alter table public.products
  add column if not exists is_active boolean not null default true;

alter table public.product_variants
  add column if not exists is_orderable boolean not null default true;

update public.products set is_active = true where is_active is null;
update public.product_variants set is_orderable = true where is_orderable is null;

insert into public.inventory_balances (variant_id)
select id from public.product_variants
on conflict (variant_id) do nothing;
