# 💉 Drip-Rate Assistant
### Emergency Burn Care – Fluid Resuscitation App

A mobile-first clinical decision support application for nurses and intern doctors managing burn patients in emergency settings.

---

## Features

- **Multi-patient dashboard** — search, filter, add, delete
- **3-step Add Patient wizard** — patient info → interactive burn body map → fluid calculation review
- **Parkland formula** — auto-calculates total fluid, first 8h / next 16h split, IV drip rate in gtt/min
- **Pediatric mode** — Holiday-Segar maintenance + Parkland combined
- **Patient detail (4 tabs)**:
  - **Overview** — live burn timer, phase progress bar, key metrics, expected vs actual infusion
  - **Fluids** — full Parkland breakdown, drip rate, pediatric tiers
  - **Urine** — log hourly output, instant status (Normal / Low / Critical), history
  - **Timeline** — chronological event log
- **Tracker** — live phase progress for all patients
- **Alerts** — auto-triggered warnings for TBSA ≥ 40% and low urine output
- **Supabase real-time sync** — data shared across all devices; localStorage fallback for offline use

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) and create a free project
2. Open **SQL Editor** → New Query → paste and run the SQL below
3. Copy your **Project URL** and **anon/public key** from Project Settings → API

```sql
create table patients (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  age              integer,
  weight           numeric not null,
  burn_time        timestamptz not null,
  burn_type        text default 'thermal',
  patient_type     text default 'adult',
  tbsa             numeric default 0,
  selected_regions jsonb default '[]',
  total_fluid      numeric default 0,
  first_8h         numeric default 0,
  next_16h         numeric default 0,
  drip_rate        numeric default 0,
  hourly_rate      numeric default 0,
  drop_factor      integer default 15,
  status           text default 'active',
  ward             text,
  bed_number       text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table urine_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  volume_ml   numeric not null,
  logged_at   timestamptz default now(),
  logged_by   text,
  notes       text
);

create table fluid_logs (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid references patients(id) on delete cascade,
  volume_ml   numeric not null,
  rate_ml_hr  numeric,
  logged_at   timestamptz default now(),
  notes       text
);

alter table patients   enable row level security;
alter table urine_logs enable row level security;
alter table fluid_logs enable row level security;

create policy "Allow all" on patients   for all using (true);
create policy "Allow all" on urine_logs for all using (true);
create policy "Allow all" on fluid_logs for all using (true);

alter publication supabase_realtime add table patients;
alter publication supabase_realtime add table urine_logs;
```

### 3. Add your Supabase credentials
Open `src/lib/supabase.js` and replace:
```js
export const SUPABASE_URL      = "YOUR_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

### 4. Run the app
```bash
npm start
```

### 5. Build for production
```bash
npm run build
```
Then deploy the `build/` folder to Vercel, Netlify, or any static host.

---

## Project Structure

```
src/
├── styles/
│   ├── global.css          # CSS variables, reset, animations
│   └── components.css      # Reusable component styles
├── lib/
│   ├── supabase.js         # Supabase client + DB abstraction layer
│   └── medical.js          # All medical formulas (Parkland, Rule of Nines, etc.)
├── hooks/
│   └── usePatients.js      # Patient state management hook
├── components/
│   ├── UI.jsx              # Shared UI primitives (Pill, StatCard, etc.)
│   ├── BottomNav.jsx       # Bottom navigation bar
│   ├── PatientCard.jsx     # Patient list card
│   └── BodyMap.jsx         # Interactive SVG burn body diagram
├── screens/
│   ├── PatientList.jsx     # Home screen — patient list + search
│   ├── AddPatientWizard.jsx # 3-step new patient wizard
│   ├── PatientDetail.jsx   # Patient tabs (Overview/Fluids/Urine/Timeline)
│   └── TrackerAndAlerts.jsx # Tracker + Alerts screens
├── App.jsx                 # Root navigation controller
└── index.js                # Entry point
```

---

## Medical Formulas

| Formula | Description |
|---|---|
| **Parkland** | Total fluid = 4 × weight(kg) × TBSA(%) |
| **Phase 1** | 50% of total in first 8 hours from burn time |
| **Phase 2** | 50% of total in next 16 hours |
| **Drip rate** | (volume × drop factor) / time in minutes |
| **Holiday-Segar** | 100/50/20 mL/kg/day (paediatric maintenance) |
| **Min urine output** | ≥ 0.5 mL/kg/hr (adult), ≥ 1.0 mL/kg/hr (child) |

---

## Disclaimer

> **Clinical Support Tool Only.**  
> This application provides calculation assistance and monitoring support.  
> All final medical decisions must be made by qualified medical professionals.  
> Always consult a senior physician for critical or complex cases.
