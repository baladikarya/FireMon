-- FireMon — Skema Database Multi-Tenant
-- Jalankan file ini di Supabase Dashboard > SQL Editor (sekali saja, saat setup awal)

create extension if not exists "pgcrypto";

-- 1. PERUSAHAAN (tenant)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- 2. PROFIL USER — menghubungkan auth.users bawaan Supabase ke perusahaan
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- 3. AREAL KONSESI — hasil upload KML per perusahaan
create table if not exists concessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  kml_coords jsonb not null,       -- array [[lon,lat], ...] poligon
  bbox jsonb not null,             -- {minLon,maxLon,minLat,maxLat}
  area_ha numeric not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 4. HOTSPOT — hasil fetch FIRMS + hitungan rumus, per titik per tanggal
create table if not exists hotspots (
  id uuid primary key default gen_random_uuid(),
  concession_id uuid not null references concessions(id) on delete cascade,
  acq_date date not null,
  acq_time text not null,
  lat numeric not null,
  lon numeric not null,
  satellite text not null,
  instrument text not null,        -- MODIS | VIIRS
  frp numeric not null,
  confidence text not null,        -- angka (MODIS) atau h/n/l (VIIRS), disimpan sbg text
  brightness numeric not null,
  bright_t31 numeric not null,
  daynight text not null,          -- D | N
  selisih_brightness numeric not null,
  bobot_frp numeric not null,
  bobot_confidence numeric not null,
  bobot_kontras numeric not null,
  bobot_daynight numeric not null,
  status text not null,            -- 'Api Terindikasi' | 'Anomali/Bukan Api'
  estimasi_area numeric not null,
  fetched_at timestamptz not null default now(),
  unique (concession_id, lat, lon, acq_date, acq_time, instrument)
);

create index if not exists idx_hotspots_concession on hotspots(concession_id);
create index if not exists idx_concessions_company on concessions(company_id);

-- ROW LEVEL SECURITY
-- Catatan: API routes di aplikasi ini berjalan di server memakai service-role
-- key (bypass RLS) dan selalu memfilter berdasarkan company_id user yang
-- sedang login. RLS di bawah ini adalah lapisan proteksi tambahan seandainya
-- ada akses langsung ke database dari luar server aplikasi.

alter table companies enable row level security;
alter table profiles enable row level security;
alter table concessions enable row level security;
alter table hotspots enable row level security;

create policy "user can read own company" on companies
  for select using (id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "user can read own profile" on profiles
  for select using (id = auth.uid());

create policy "user can manage own company concessions" on concessions
  for all using (company_id in (select company_id from profiles where profiles.id = auth.uid()))
  with check (company_id in (select company_id from profiles where profiles.id = auth.uid()));

create policy "user can read own company hotspots" on hotspots
  for select using (
    concession_id in (
      select c.id from concessions c
      join profiles p on p.company_id = c.company_id
      where p.id = auth.uid()
    )
  );
