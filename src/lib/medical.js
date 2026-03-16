// ─────────────────────────────────────────────────────────
// lib/medical.js  –  All burn-care medical calculations
// ─────────────────────────────────────────────────────────

// ── Parkland Formula ──────────────────────────────────────
// Total = 4 × weight(kg) × TBSA(%)
// Phase 1: 50% in first 8 h  → hourly = first8 / 8
// Phase 2: 50% in next  16 h → hourly = next16 / 16
export function calcParkland(weightKg, tbsaPct) {
  const total  = 4 * weightKg * tbsaPct;
  const first8 = total / 2;
  const next16 = total / 2;
  return { total, first8, next16 };
}

// ── IV Drip Rate ──────────────────────────────────────────
// drops/min = (volume_mL × drop_factor) / time_min
export function calcDripRate(volumeMl, durationMin, dropFactor) {
  if (!durationMin || !dropFactor) return 0;
  return Math.round((volumeMl * dropFactor) / durationMin);
}

// ── Phase-aware drip rates ────────────────────────────────
// Phase 1: first8h over 480 min
// Phase 2: next16h over 960 min  ← was wrong before (used same 480)
export function calcPhase1DripRate(first8, dropFactor) {
  return calcDripRate(first8, 480, dropFactor);   // 8h = 480 min
}
export function calcPhase2DripRate(next16, dropFactor) {
  return calcDripRate(next16, 960, dropFactor);   // 16h = 960 min
}

// ── Hourly IV Rate ────────────────────────────────────────
export function calcHourlyRate(volumeMl, hours) {
  if (!hours) return 0;
  return Math.round(volumeMl / hours);
}

// ── Holiday-Segar Maintenance (paediatric) ────────────────
export function holidaySegar(weightKg) {
  if (weightKg <= 10) return weightKg * 100;
  if (weightKg <= 20) return 1000 + (weightKg - 10) * 50;
  return 1500 + (weightKg - 20) * 20;
}

export function hsBreakdown(weightKg) {
  const tier1 = Math.min(weightKg, 10) * 100;
  const tier2 = Math.max(0, Math.min(weightKg, 20) - 10) * 50;
  const tier3 = Math.max(0, weightKg - 20) * 20;
  return [
    { label: "First 10 kg (100 mL/kg)", value: tier1, max: 1000 },
    { label: "Next 10 kg (50 mL/kg)",   value: tier2, max: 500  },
    { label: "Remaining (20 mL/kg)",     value: tier3, max: 400  },
  ];
}

// ── Minimum Urine Output ──────────────────────────────────
export function minUrineOutput(weightKg, patientType) {
  return patientType === "adult" ? 0.5 * weightKg : 1.0 * weightKg;
}

// ── Urine Output Status ───────────────────────────────────
export function urineStatus(lastHourMl, weightKg, patientType) {
  const min   = minUrineOutput(weightKg, patientType);
  const ratio = lastHourMl / min;
  if (ratio < 0.5) return "critical";
  if (ratio < 1.0) return "low";
  if (ratio < 2.5) return "normal";
  return "high";
}

// ── ADULT Rule of Nines body regions ─────────────────────
export const ADULT_BODY_REGIONS = [
  { id: "head",            label: "Head & Neck",       pct: 9,  view: "front" },
  { id: "chest",           label: "Chest",             pct: 9,  view: "front" },
  { id: "abdomen",         label: "Abdomen",           pct: 9,  view: "front" },
  { id: "upper_back",      label: "Upper Back",        pct: 9,  view: "back"  },
  { id: "lower_back",      label: "Lower Back",        pct: 9,  view: "back"  },
  { id: "left_arm",        label: "Left Arm",          pct: 9,  view: "both"  },
  { id: "right_arm",       label: "Right Arm",         pct: 9,  view: "both"  },
  { id: "left_leg_front",  label: "Left Leg (Front)",  pct: 9,  view: "front" },
  { id: "right_leg_front", label: "Right Leg (Front)", pct: 9,  view: "front" },
  { id: "left_leg_back",   label: "Left Leg (Back)",   pct: 9,  view: "back"  },
  { id: "right_leg_back",  label: "Right Leg (Back)",  pct: 9,  view: "back"  },
  { id: "perineum",        label: "Perineum",          pct: 1,  view: "front" },
];

// Keep backward compat
export const BODY_REGIONS = ADULT_BODY_REGIONS;

// ── PAEDIATRIC Lund & Browder regions ────────────────────
// Head: 18% at birth, −1% per year until age 10, then 9%
// Each lower limb: 13.5% at birth, +0.5% per year until 10, then 18%
// Trunk/arms same as adult
export function getPaedBodyRegions(ageYears) {
  const age    = Math.min(ageYears || 0, 10);
  const headPct = Math.max(9,  18 - age);           // 18% → 9%
  const legPct  = Math.min(18, 13.5 + age * 0.5);  // 13.5% → 18%

  return [
    { id: "head",            label: "Head & Neck",       pct: headPct,         view: "front" },
    { id: "chest",           label: "Chest",             pct: 9,               view: "front" },
    { id: "abdomen",         label: "Abdomen",           pct: 9,               view: "front" },
    { id: "upper_back",      label: "Upper Back",        pct: 9,               view: "back"  },
    { id: "lower_back",      label: "Lower Back",        pct: 9,               view: "back"  },
    { id: "left_arm",        label: "Left Arm",          pct: 9,               view: "both"  },
    { id: "right_arm",       label: "Right Arm",         pct: 9,               view: "both"  },
    { id: "left_leg_front",  label: "Left Leg (Front)",  pct: legPct / 2,      view: "front" },
    { id: "right_leg_front", label: "Right Leg (Front)", pct: legPct / 2,      view: "front" },
    { id: "left_leg_back",   label: "Left Leg (Back)",   pct: legPct / 2,      view: "back"  },
    { id: "right_leg_back",  label: "Right Leg (Back)",  pct: legPct / 2,      view: "back"  },
    { id: "perineum",        label: "Perineum",          pct: 1,               view: "front" },
  ];
}

// ── Urgency ───────────────────────────────────────────────
export function tbsaUrgency(tbsa) {
  if (tbsa >= 40) return "critical";
  if (tbsa >= 20) return "high";
  return "stable";
}

// ── Time helpers ──────────────────────────────────────────
export function formatDuration(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateTime(date) {
  return new Date(date).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
