// ─────────────────────────────────────────────────────────
// screens/AddPatientWizard.jsx
// 3-step wizard: Patient Info → Burn Map → Review & Save
// ─────────────────────────────────────────────────────────
import React, { useState } from "react";
import BodyMap from "../components/BodyMap";
import { PageHeader, WizardStepDots, AlertBanner } from "../components/UI";
import {
  calcParkland, calcPhase1DripRate, calcPhase2DripRate, calcHourlyRate,
  holidaySegar, hsBreakdown, BODY_REGIONS,
} from "../lib/medical";

const STEPS = ["Patient Info", "Burn Map", "Review & Save"];

const INITIAL_FORM = {
  name:             "",
  age:              "",
  weight:           "",
  burn_time:        new Date().toISOString().slice(0, 16),
  burn_type:        "thermal",
  patient_type:     "adult",
  ward:             "",
  bed_number:       "",
  selected_regions: [],
  drop_factor:      15,
};

export default function AddPatientWizard({ onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const totalTBSA = form.selected_regions.reduce((sum, id) => {
    const r = BODY_REGIONS.find((b) => b.id === id);
    return sum + (r ? r.pct : 0);
  }, 0);

  function toggleRegion(id) {
    set(
      "selected_regions",
      form.selected_regions.includes(id)
        ? form.selected_regions.filter((r) => r !== id)
        : [...form.selected_regions, id]
    );
  }

  function handleSave() {
    const w = parseFloat(form.weight);
    const { total, first8, next16 } = calcParkland(w, totalTBSA);
    const hourlyRate = calcHourlyRate(first8, 8);
    const dripRate   = calcPhase1DripRate(first8, form.drop_factor);
    const patient = {
      id:          crypto.randomUUID(),
      ...form,
      age:         parseInt(form.age) || 0,
      weight:      w,
      tbsa:        totalTBSA,
      total_fluid: total,
      first_8h:    first8,
      next_16h:    next16,
      hourly_rate: hourlyRate,
      drip_rate:    dripRate,
      drip_rate_p2: Math.round(calcPhase2DripRate(next16, form.drop_factor)),
      hourly_rate_p2: calcHourlyRate(next16, 16),
      status:      "active",
      burn_time:   new Date(form.burn_time).toISOString(),
    };
    onSave(patient);
  }

  // ── Step validation ──────────────────────────────────
  function nextStep() {
    if (step === 0) {
      if (!form.name.trim()) { alert("Patient name is required"); return; }
      if (!form.weight || parseFloat(form.weight) <= 0) { alert("Valid weight is required"); return; }
    }
    if (step === 1) {
      if (totalTBSA === 0) { alert("Please select at least one burn region"); return; }
    }
    setStep((s) => s + 1);
  }

  // ── Derived values for review step ───────────────────
  const w            = parseFloat(form.weight) || 0;
  const { total, first8, next16 } = calcParkland(w, totalTBSA);
  const hourlyRate   = calcHourlyRate(first8, 8);
  const dripRate     = calcPhase1DripRate(first8, form.drop_factor);
  const dripRate2    = calcPhase2DripRate(next16, form.drop_factor);
  const hourlyRate2  = calcHourlyRate(next16, 16);
  const isPed        = form.patient_type === "pediatric";
  const maintenance  = isPed ? holidaySegar(w) : 0;
  const pedTotal     = isPed ? maintenance + total : 0;
  const hsTiers      = isPed ? hsBreakdown(w) : [];

  return (
    <div className="screen-anim" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <PageHeader
        title="New Patient"
        subtitle={`Step ${step + 1} of 3 — ${STEPS[step]}`}
        onBack={onCancel}
        rightSlot={<WizardStepDots total={3} current={step} />}
      />

      <div style={{ padding: "14px 16px", overflowY: "auto", paddingBottom: 100 }}>

        {/* ────────── STEP 0: Patient Info ────────── */}
        {step === 0 && (
          <div className="screen-anim">
            {/* Patient type */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="section-label">Patient Type</p>
              <div className="seg">
                {["adult", "pediatric"].map((t) => (
                  <button key={t} className={`seg-btn ${form.patient_type === t ? "on" : ""}`}
                    onClick={() => set("patient_type", t)}>
                    {t === "adult" ? "👤 Adult" : "👶 Pediatric"}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient details */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="section-label">Patient Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                    Full Name *
                  </label>
                  <input className="input" placeholder="e.g. Rahul Sharma" value={form.name}
                    onChange={(e) => set("name", e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Age (yrs) *</label>
                    <input className="input" type="number" placeholder="Age" value={form.age}
                      onChange={(e) => set("age", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Weight (kg) *</label>
                    <input className="input" type="number" placeholder="kg" value={form.weight}
                      onChange={(e) => set("weight", e.target.value)} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Ward</label>
                    <input className="input" placeholder="e.g. ICU-A" value={form.ward}
                      onChange={(e) => set("ward", e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>Bed No.</label>
                    <input className="input" placeholder="e.g. 4B" value={form.bed_number}
                      onChange={(e) => set("bed_number", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Burn details */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p className="section-label">Burn Details</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                    Time of Burn Injury *
                  </label>
                  <input className="input" type="datetime-local" value={form.burn_time}
                    onChange={(e) => set("burn_time", e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 10 }}>Burn Type</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                    {[
                      { id: "thermal",    label: "Thermal",    icon: "🔥" },
                      { id: "chemical",   label: "Chemical",   icon: "🧪" },
                      { id: "electrical", label: "Electrical", icon: "⚡" },
                    ].map((bt) => (
                      <button key={bt.id} className={`burn-type-btn ${form.burn_type === bt.id ? "active" : ""}`}
                        onClick={() => set("burn_type", bt.id)}>
                        <span className="bt-icon">{bt.icon}</span>
                        <span className="bt-label">{bt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>IV Drop Factor</label>
                  <div className="seg">
                    {[15, 20, 60].map((f) => (
                      <button key={f} className={`seg-btn ${form.drop_factor === f ? "on" : ""}`}
                        onClick={() => set("drop_factor", f)}>
                        {f} gtt/mL
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={nextStep} style={{ marginBottom: 12 }}>
              Next: Map Burn Area →
            </button>
          </div>
        )}

        {/* ────────── STEP 1: Burn Map ────────── */}
        {step === 1 && (
          <div className="screen-anim">
            <BodyMap selectedRegions={form.selected_regions} onToggle={toggleRegion} patientType={form.patient_type} ageYears={parseInt(form.age) || 0} />

            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(0)} style={{ flex: "0 0 auto", width: "auto", padding: "0 20px" }}>← Back</button>
              <button className="btn btn-primary" onClick={nextStep} style={{ flex: 1 }}>Next: Review →</button>
            </div>
          </div>
        )}

        {/* ────────── STEP 2: Review & Save ────────── */}
        {step === 2 && (
          <div className="screen-anim">
            {/* Summary chip row */}
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                  {isPed ? "👶" : "🧑‍⚕️"}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 18 }}>{form.name}</p>
                  <p style={{ fontSize: 13, color: "var(--text3)" }}>
                    {form.age}y · {form.weight} kg · {isPed ? "Pediatric" : "Adult"}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="pill pill-red">TBSA: {totalTBSA}%</span>
                <span className="pill pill-blue">{form.burn_type}</span>
                {form.bed_number && <span className="pill pill-slate">Bed {form.bed_number}</span>}
                {form.ward && <span className="pill pill-slate">{form.ward}</span>}
              </div>
            </div>

            {/* Fluid result hero */}
            <div style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))", borderRadius: "var(--radius)", padding: 22, marginBottom: 12, color: "white" }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", opacity: 0.8, marginBottom: 6 }}>
                {isPed ? "Total 24h Fluid (Parkland + Maintenance)" : "Parkland Formula — Total 24h"}
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
                <span className="stat-num" style={{ fontSize: 44, color: "white" }}>
                  {isPed ? pedTotal.toLocaleString() : total.toLocaleString()}
                </span>
                <span style={{ fontSize: 18, opacity: 0.8, fontWeight: 600 }}>mL</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "First 8 Hours", val: first8.toLocaleString() },
                  { label: "Next 16 Hours", val: next16.toLocaleString() },
                ].map((c) => (
                  <div key={c.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{c.label}</p>
                    <p className="stat-num" style={{ fontSize: 20, color: "white" }}>{c.val} <span style={{ fontSize: 11, fontWeight: 500 }}>mL</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Drip rate */}
            <div style={{ background: "var(--success-light)", border: "1.5px solid var(--success-mid)", borderRadius: "var(--radius)", padding: 20, marginBottom: 12, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>
                💧 IV Drip Rate — Phase 1
              </p>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6 }}>
                <span className="stat-num" style={{ fontSize: 56, color: "var(--success)", letterSpacing: "-3px" }}>{dripRate}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--success)" }}>gtt/min</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--success)", marginTop: 6, fontWeight: 500 }}>
                {hourlyRate} mL/hr · {form.drop_factor} drops/mL IV set
              </p>
            </div>

            {/* Pediatric breakdown */}
            {isPed && (
              <div className="info-box" style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
                  👶 Holiday-Segar Maintenance: {maintenance.toLocaleString()} mL/day
                </p>
                {hsTiers.map((t) => (
                  <div key={t.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "var(--text2)" }}>{t.label}</span>
                      <span style={{ fontWeight: 700 }}>{t.value.toLocaleString()} mL</span>
                    </div>
                    <div className="progress-track" style={{ height: 5 }}>
                      <div className="progress-fill" style={{ width: `${Math.min((t.value / t.max) * 100, 100)}%`, background: "var(--primary)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <AlertBanner type="warning" icon="⚠" title="Clinical Support Only">
              Final medical decisions must be made by qualified medical professionals. Always consult a senior physician for critical cases.
            </AlertBanner>

            <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 12 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ flex: "0 0 auto", width: "auto", padding: "0 20px" }}>← Back</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
                ✓ Save Patient & Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
