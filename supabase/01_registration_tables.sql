create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  line_user_id text unique,
  line_display_name text,
  line_picture_url text,
  full_name text not null,
  phone text not null,
  role text not null default 'customer'
    check (role in ('customer', 'super_admin', 'admin', 'packer', 'viewer')),
  member_level text not null default 'retail'
    check (member_level in ('retail', 'member')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  receiver_name text not null,
  phone text not null,
  address_line text not null,
  subdistrict text not null,
  district text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customer_addresses_profile_id_idx
  on public.customer_addresses(profile_id);

alter table public.profiles enable row level security;
alter table public.customer_addresses enable row level security;

-- ไม่มี policy สำหรับ anon โดยตั้งใจ
-- การลงทะเบียนจะผ่าน API ฝั่ง server ที่ใช้ service role เท่านั้น
