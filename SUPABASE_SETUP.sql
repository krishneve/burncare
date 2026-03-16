-- ═══════════════════════════════════════════════════════════
-- BURN CARE APP — SUPABASE SETUP
-- ═══════════════════════════════════════════════════════════
-- 1. Go to Supabase → SQL Editor → New query
-- 2. Paste this entire file → click RUN
-- 3. Fill in SUPABASE_URL + SUPABASE_ANON_KEY in src/lib/supabase.js
-- ═══════════════════════════════════════════════════════════

-- 1. USERS TABLE (admin + doctors + nurses)
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  designation   text not null,  -- 'admin', 'doctor', 'nurse'
  user_id       text not null unique,
  password      text not null,
  created_at    timestamptz default now()
);

-- 2. PATIENTS TABLE
create table if not exists patients (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  age                  integer,
  weight               numeric not null,
  burn_time            timestamptz not null,
  burn_type            text default 'thermal',
  patient_type         text default 'adult',
  tbsa                 numeric default 0,
  selected_regions     jsonb default '[]',
  total_fluid          numeric default 0,
  first_8h             numeric default 0,
  next_16h             numeric default 0,
  drip_rate            numeric default 0,
  hourly_rate          numeric default 0,
  drop_factor          integer default 15,
  status               text default 'active',
  ward                 text,
  bed_number           text,
  added_by             text,
  added_by_designation text,
  _alert               boolean default false,
  _alert_time          timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- 3. URINE LOGS TABLE
create table if not exists urine_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  volume_ml   numeric not null,
  logged_at   timestamptz default now(),
  logged_by   text,
  notes       text
);

-- 4. FLUID LOGS TABLE
create table if not exists fluid_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  volume_ml   numeric not null,
  rate_ml_hr  numeric,
  logged_at   timestamptz default now(),
  notes       text
);

-- 5. ROW LEVEL SECURITY
alter table users      enable row level security;
alter table patients   enable row level security;
alter table urine_logs enable row level security;
alter table fluid_logs enable row level security;

create policy "Allow all" on users      for all using (true) with check (true);
create policy "Allow all" on patients   for all using (true) with check (true);
create policy "Allow all" on urine_logs for all using (true) with check (true);
create policy "Allow all" on fluid_logs for all using (true) with check (true);

-- 6. REALTIME
alter publication supabase_realtime add table patients;
alter publication supabase_realtime add table urine_logs;

-- 7. CREATE DEFAULT ADMIN ACCOUNT
-- ⚠️ Change the password after first login!
insert into users (id, name, designation, user_id, password)
values (gen_random_uuid(), 'Administrator', 'admin', 'admin', 'admin123')
on conflict (user_id) do nothing;
