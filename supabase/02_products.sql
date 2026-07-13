create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, color_name)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.product_colors(id) on delete cascade,
  power text not null,
  retail_price numeric(10,2) not null,
  member_price numeric(10,2) not null,
  is_orderable boolean not null default true,
  disabled_reason text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(color_id, power)
);

create index if not exists product_colors_product_id_idx
  on public.product_colors(product_id);

create index if not exists product_variants_product_id_idx
  on public.product_variants(product_id);

create index if not exists product_variants_color_id_idx
  on public.product_variants(color_id);

alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_variants enable row level security;

do $$
declare
  baby_id uuid;
  brown_id uuid;
  gray_id uuid;
begin
  insert into public.products (model_name, description, sort_order)
  values ('Baby Doll', 'คอนแทคเลนส์โทนหวานสำหรับลุคธรรมชาติ', 1)
  returning id into baby_id;

  insert into public.product_colors (product_id, color_name, sort_order)
  values (baby_id, 'Brown', 1)
  returning id into brown_id;

  insert into public.product_colors (product_id, color_name, sort_order)
  values (baby_id, 'Gray', 2)
  returning id into gray_id;

  insert into public.product_variants
    (product_id, color_id, power, retail_price, member_price, sort_order)
  values
    (baby_id, brown_id, '0.00', 250, 220, 1),
    (baby_id, brown_id, '-0.50', 250, 220, 2),
    (baby_id, brown_id, '-0.75', 250, 220, 3),
    (baby_id, brown_id, '-1.00', 250, 220, 4),
    (baby_id, gray_id, '0.00', 250, 220, 1),
    (baby_id, gray_id, '-0.50', 250, 220, 2),
    (baby_id, gray_id, '-0.75', 250, 220, 3),
    (baby_id, gray_id, '-1.00', 250, 220, 4);
exception
  when unique_violation then
    null;
end $$;
