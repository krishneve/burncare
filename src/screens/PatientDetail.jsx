// ─────────────────────────────────────────────────────────
// screens/PatientDetail.jsx
// Full patient view: Overview · Fluids · Urine · Timeline
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from "react";
import { DB } from "../lib/supabase";
import {
  minUrineOutput, urineStatus, holidaySegar, hsBreakdown,
  formatDuration, fmtTime, fmtDateTime,
} from "../lib/medical";
import { PageHeader, Pill, ProgressBar, StatCard, AlertBanner, Divider } from "../components/UI";

const TABS = ["Overview", "Fluids", "Urine", "Timeline"];

export default function PatientDetail({ patient: initialPatient, onBack, onPatientUpdate }) {
  const [tab,       setTab]       = useState("Overview");
  const [patient,   setPatient]   = useState(initialPatient);
  const [urineLogs, setUrineLogs] = useState([]);
  const [urineVol,  setUrineVol]  = useState("");
  const [urineNote, setUrineNote] = useState("");
  const [logBusy,   setLogBusy]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [rateMsg,   setRateMsg]   = useState(null); // feedback for rate increase

  const burnTime  = new Date(patient.burn_time);
  const minUrine  = minUrineOutput(patient.weight, patient.patient_type);

  // Live timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - burnTime), 1000);
    return () => clearInterval(t);
  }, [burnTime]);

  // Load urine logs
  useEffect(() => {
    DB.getUrineLogs(patient.id).then(setUrineLogs);
  }, [patient.id]);

  const hoursElapsed  = elapsed / 3_600_000;
  const inPhase2      = hoursElapsed >= 8;

  // Phase 1: 0-8h
  const phase1Prog    = Math.min(hoursElapsed / 8, 1);
  const expectedSoFar = phase1Prog * patient.first_8h;

  // Phase 2: 8-24h
  const phase2Hours   = Math.max(0, hoursElapsed - 8);
  const phase2Prog    = Math.min(phase2Hours / 16, 1);
  const expectedP2    = phase2Prog * (patient.next_16h || 0);

  // Active phase display values - auto-switch when phase 2 starts
  const activeHourlyRate = inPhase2
    ? (patient.hourly_rate_p2 || Math.round((patient.next_16h || 0) / 16))
    : patient.hourly_rate;
  const activeDripRate = inPhase2
    ? (patient.drip_rate_p2 || Math.round(((patient.next_16h || 0) * (patient.drop_factor || 15)) / 960))
    : patient.drip_rate;

  const latestLog     = urineLogs[0];
  const uStatus       = latestLog
    ? urineStatus(latestLog.volume_ml, patient.weight, patient.patient_type)
    : "unknown";

  const uDotColor = {
    critical: "var(--danger)",
    low:      "var(--warning)",
    normal:   "var(--success)",
    high:     "var(--primary)",
    unknown:  "var(--text4)",
  }[uStatus];

  async function handleLogUrine() {
    const vol = parseFloat(urineVol);
    if (!vol || vol < 0) return;
    setLogBusy(true);
    const log = await DB.logUrine(patient.id, vol, urineNote);
    setUrineLogs((prev) => [log, ...prev]);

    // ── Trigger alert if urine is low ──────────────────
    const st = urineStatus(vol, patient.weight, patient.patient_type);
    if (st === "critical" || st === "low") {
      const updated = { ...patient, _alert: true, _alertTime: new Date().toISOString() };
      setPatient(updated);
      await DB.savePatient(updated);
      onPatientUpdate && onPatientUpdate(updated);
    } else {
      // Clear alert if urine recovered
      if (patient._alert) {
        const updated = { ...patient, _alert: false };
        setPatient(updated);
        await DB.savePatient(updated);
        onPatientUpdate && onPatientUpdate(updated);
      }
    }

    setUrineVol("");
    setUrineNote("");
    setLogBusy(false);
  }

  // ── Increase fluid rate by 20% ─────────────────────────
  async function handleIncreaseRate() {
    const newRate = Math.round(patient.hourly_rate * 1.2);
    const newDrip = Math.round(patient.drip_rate * 1.2);
    const updated = { ...patient, hourly_rate: newRate, drip_rate: newDrip, _alert: false, _alertTime: null };
    setPatient(updated);
    await DB.savePatient(updated);
    onPatientUpdate && onPatientUpdate(updated);
    setRateMsg(`✓ Rate increased to ${newRate} mL/hr`);
    setTimeout(() => setRateMsg(null), 5000);
  }

  // ── Shared subheading style ────────────────────────────
  // Show alert only if _alert is still true (cleared when rate is increased)
  const showUrineAlert = patient._alert && (uStatus === "critical" || uStatus === "low");

  const subLabel = { fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text3)", marginBottom: 6 };

  return (
    <div className="screen-anim" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <PageHeader
        title={patient.name}
        subtitle={`${patient.age}y · ${patient.weight} kg · ${patient.patient_type}${patient.bed_number ? ` · Bed ${patient.bed_number}` : ""}`}
        onBack={onBack}
        rightSlot={
          <Pill variant={patient.tbsa >= 40 ? "red" : patient.tbsa >= 20 ? "amber" : "green"}>
            {patient.tbsa}% TBSA
          </Pill>
        }
      />

      {/* Tab bar */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
        <div style={{ display: "flex" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "12px 4px", border: "none", background: "none", fontFamily: "inherit",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                color: tab === t ? "var(--primary)" : "var(--text3)",
                borderBottom: `2.5px solid ${tab === t ? "var(--primary)" : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 16px", overflowY: "auto", paddingBottom: 40 }}>

        {/* ── OVERVIEW ── */}
        {tab === "Overview" && (
          <div className="screen-anim">
            {/* Live timer card */}
            <div style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              borderRadius: "var(--radius)", padding: 20, marginBottom: 12, color: "white",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", opacity: 0.8, marginBottom: 6 }}>
                ⏱ Time Since Burn
              </p>
              <p className="stat-num" style={{ fontSize: 38, color: "white", marginBottom: 14 }}>
                {formatDuration(elapsed)}
              </p>
              {!inPhase2 ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, opacity: 0.85 }}>
                    <span>Phase 1 (8 hrs)</span>
                    <span style={{ fontWeight: 700 }}>{hoursElapsed.toFixed(1)} / 8.0 h</span>
                  </div>
                  <ProgressBar value={phase1Prog} color="rgba(255,255,255,0.6)" height={7} />
                </>
              ) : (
                <>
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                    <p style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>✓ Phase 1 Complete</p>
                    <p style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>
                      Now: Phase 2 — {phase2Hours.toFixed(1)} / 16.0 h
                    </p>
                  </div>
                  <ProgressBar value={phase2Prog} color="rgba(255,255,255,0.6)" height={7} />
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 6, fontWeight: 600 }}>
                    New drip rate: {activeDripRate} gtt/min · {activeHourlyRate} mL/hr
                  </p>
                </>
              )}
            </div>

            {/* Metric grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <StatCard icon="💧" label="Total Fluid" value={patient.total_fluid?.toLocaleString()} unit="mL" statusColor="var(--primary)" />
              <StatCard icon="🩸" label={inPhase2 ? "IV Rate Ph.2" : "IV Rate Ph.1"} value={activeHourlyRate} unit="mL/hr" statusColor="var(--success)" />
              <StatCard icon="💉" label="Drip Rate" value={activeDripRate} unit="gtt/min" statusColor="var(--primary)" />
              <StatCard
                icon={uStatus === "critical" ? "⚠️" : "✓"}
                label="Urine Output"
                value={latestLog ? (latestLog.volume_ml / patient.weight).toFixed(2) : "--"}
                unit="mL/kg/hr"
                statusColor={uDotColor}
              />
            </div>

            {/* Expected vs target */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p style={subLabel}>Expected Infusion — Phase 1</p>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 12, color: "var(--text3)" }}>By now</p>
                  <p className="stat-num" style={{ fontSize: 20, color: "var(--primary)" }}>
                    {Math.round(expectedSoFar).toLocaleString()} mL
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: "var(--text3)" }}>8-hr Target</p>
                  <p className="stat-num" style={{ fontSize: 20, color: "var(--text2)" }}>
                    {patient.first_8h?.toLocaleString()} mL
                  </p>
                </div>
              </div>
              <ProgressBar value={phase1Prog} height={6} />
            </div>

            {/* Alerts */}
            {showUrineAlert && (
              <div style={{ marginBottom: 12 }}>
                <div className="alert-box" style={{ marginBottom: 10 }}>
                  <p style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>
                    ⚠ {uStatus === "critical" ? "Critical" : "Low"} Urine Output
                  </p>
                  <p style={{ fontSize: 13, color: "var(--danger)", lineHeight: 1.5 }}>
                    Last reading: {latestLog?.volume_ml} mL/hr — target ≥ {Math.round(minUrine)} mL/hr.
                    Increase fluid rate by ~20% and consult a senior physician.
                  </p>
                </div>
                {/* Increase Rate box */}
                <div style={{ background: "var(--warning-light)", border: "1px solid var(--warning-mid)", borderRadius: 10, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <p style={{ fontSize: 11, color: "var(--text3)" }}>Current rate</p>
                      <p className="stat-num" style={{ fontSize: 20, color: "var(--text)" }}>{patient.hourly_rate} mL/hr</p>
                    </div>
                    <span style={{ fontSize: 22, color: "var(--text3)" }}>→</span>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "var(--text3)" }}>Recommended (+20%)</p>
                      <p className="stat-num" style={{ fontSize: 20, color: "var(--warning)" }}>{Math.round(patient.hourly_rate * 1.2)} mL/hr</p>
                    </div>
                  </div>
                  <button
                    className="btn"
                    style={{ height: 46, background: "var(--warning)", color: "white", fontSize: 14, borderRadius: "var(--radius-sm)" }}
                    onClick={handleIncreaseRate}
                  >
                    💧 Increase Fluid Rate to {Math.round(patient.hourly_rate * 1.2)} mL/hr
                  </button>
                  {rateMsg && (
                    <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginTop: 8, textAlign: "center" }}>{rateMsg}</p>
                  )}
                </div>
              </div>
            )}
            {patient.tbsa >= 40 && (
              <AlertBanner type="danger" icon="⚠" title="High TBSA Alert">
                TBSA ≥ 40% — Specialist burn centre referral strongly recommended.
              </AlertBanner>
            )}
          </div>
        )}

        {/* ── FLUIDS ── */}
        {tab === "Fluids" && (
          <div className="screen-anim">
            <div style={{
              background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              borderRadius: "var(--radius)", padding: 22, marginBottom: 12, color: "white",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px", opacity: 0.8 }}>
                Parkland Formula · 4 × {patient.weight} kg × {patient.tbsa}%
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6, marginBottom: 16 }}>
                <span className="stat-num" style={{ fontSize: 44, color: "white" }}>{patient.total_fluid?.toLocaleString()}</span>
                <span style={{ fontSize: 18, opacity: 0.8, fontWeight: 600 }}>mL total</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "First 8 Hours",  val: patient.first_8h?.toLocaleString() },
                  { label: "Next 16 Hours",  val: patient.next_16h?.toLocaleString() },
                ].map((c) => (
                  <div key={c.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 10, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{c.label}</p>
                    <p className="stat-num" style={{ fontSize: 20, color: "white" }}>{c.val} <span style={{ fontSize: 11, fontWeight: 500 }}>mL</span></p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase 1 drip rate */}
            <div style={{ background: phase1Prog < 1 ? "var(--success-light)" : "var(--surface3)", border: `1.5px solid ${phase1Prog < 1 ? "var(--success-mid)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: 20, marginBottom: 10, textAlign: "center", opacity: inPhase2 ? 0.6 : 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                💧 Phase 1 — First 8 Hours {inPhase2 ? "✓ Complete" : ""}
              </p>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6 }}>
                <span className="stat-num" style={{ fontSize: 52, color: "var(--success)", letterSpacing: "-3px" }}>{patient.drip_rate}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--success)" }}>gtt/min</span>
              </div>
              <p style={{ fontSize: 13, color: "var(--success)", marginTop: 6, fontWeight: 500 }}>
                {patient.hourly_rate} mL/hr · {patient.first_8h?.toLocaleString()} mL over 8h
              </p>
            </div>

            {/* Phase 2 drip rate */}
            <div style={{ background: inPhase2 ? "var(--primary-light)" : "var(--surface3)", border: `1.5px solid ${inPhase2 ? "var(--primary-mid)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: 20, marginBottom: 12, textAlign: "center" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                💉 Phase 2 — Next 16 Hours {inPhase2 ? "▶ Active" : "(Starts after 8h)"}
              </p>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 6 }}>
                <span className="stat-num" style={{ fontSize: 52, color: inPhase2 ? "var(--primary)" : "var(--text3)", letterSpacing: "-3px" }}>
                  {patient.drip_rate_p2 || Math.round(((patient.next_16h || 0) * (patient.drop_factor || 15)) / 960)}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: inPhase2 ? "var(--primary)" : "var(--text3)" }}>gtt/min</span>
              </div>
              <p style={{ fontSize: 13, color: inPhase2 ? "var(--primary)" : "var(--text3)", marginTop: 6, fontWeight: 500 }}>
                {patient.hourly_rate_p2 || Math.round((patient.next_16h || 0) / 16)} mL/hr · {patient.next_16h?.toLocaleString()} mL over 16h
              </p>
            </div>

            {/* Pediatric breakdown */}
            {patient.patient_type === "pediatric" && (() => {
              const maint = holidaySegar(patient.weight);
              const tiers = hsBreakdown(patient.weight);
              return (
                <div className="card">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 12 }}>
                    👶 Pediatric — Holiday-Segar + Parkland
                  </p>
                  {tiers.map((t) => (
                    <div key={t.label} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: "var(--text2)" }}>{t.label}</span>
                        <span style={{ fontWeight: 700 }}>{t.value.toLocaleString()} mL</span>
                      </div>
                      <ProgressBar value={t.max ? t.value / t.max : 0} height={5} />
                    </div>
                  ))}
                  <Divider />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>Maintenance total</span>
                    <span className="stat-num" style={{ fontSize: 16, color: "var(--primary)" }}>{maint.toLocaleString()} mL/day</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>Combined total</span>
                    <span className="stat-num" style={{ fontSize: 16, color: "var(--text)" }}>
                      {(maint + patient.total_fluid).toLocaleString()} mL/day
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── URINE ── */}
        {tab === "Urine" && (
          <div className="screen-anim">
            {/* Log form */}
            <div className="card" style={{ marginBottom: 12 }}>
              <p style={subLabel}>Log Urine Output</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                    Volume in last hour (mL) — Target: ≥{Math.round(minUrine)} mL
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder={`e.g. ${Math.round(minUrine * 1.2)}`}
                    value={urineVol}
                    onChange={(e) => setUrineVol(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 6 }}>
                    Notes (optional)
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. Light yellow, clear"
                    value={urineNote}
                    onChange={(e) => setUrineNote(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" style={{ height: 46 }} onClick={handleLogUrine} disabled={logBusy}>
                  {logBusy ? "Saving…" : "💾 Log Reading"}
                </button>
              </div>
            </div>

            {/* Target reminder + increase rate if needed */}
            {showUrineAlert ? (
              <div style={{ background: "var(--warning-light)", border: "1.5px solid var(--warning-mid)", borderRadius: "var(--radius)", padding: 14, marginBottom: 14 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "var(--warning)", marginBottom: 8 }}>
                  ⚠ Output below target — action required
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>Current rate</p>
                    <p className="stat-num" style={{ fontSize: 18, color: "var(--text)" }}>{patient.hourly_rate} mL/hr</p>
                  </div>
                  <span style={{ fontSize: 20, color: "var(--text3)" }}>→</span>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>New rate (+20%)</p>
                    <p className="stat-num" style={{ fontSize: 18, color: "var(--warning)" }}>{Math.round(patient.hourly_rate * 1.2)} mL/hr</p>
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ height: 46, background: "var(--warning)", color: "white", fontSize: 14, borderRadius: "var(--radius-sm)" }}
                  onClick={handleIncreaseRate}
                >
                  💧 Increase Fluid Rate to {Math.round(patient.hourly_rate * 1.2)} mL/hr
                </button>
                {rateMsg && (
                  <p style={{ fontSize: 12, color: "var(--success)", fontWeight: 600, marginTop: 8, textAlign: "center" }}>{rateMsg}</p>
                )}
              </div>
            ) : (
              <div className="info-box" style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 13, color: "var(--primary)", fontWeight: 600 }}>
                  Minimum urine output ({patient.patient_type}): ≥ {Math.round(minUrine)} mL/hr
                  &nbsp;(≥ {patient.patient_type === "adult" ? "0.5" : "1.0"} mL/kg/hr)
                </p>
              </div>
            )}

            {/* Logs */}
            {urineLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text4)" }}>
                <p style={{ fontSize: 36, marginBottom: 8 }}>💧</p>
                <p style={{ fontSize: 14 }}>No readings logged yet</p>
              </div>
            ) : (
              urineLogs.map((log) => {
                const rate = log.volume_ml / patient.weight;
                const st   = urineStatus(log.volume_ml, patient.weight, patient.patient_type);
                const pillVariant = st === "critical" ? "red" : st === "low" ? "amber" : "green";
                return (
                  <div key={log.id} className="card-sm" style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p className="stat-num" style={{ fontSize: 20, color: st === "critical" ? "var(--danger)" : st === "low" ? "var(--warning)" : "var(--success)" }}>
                          {log.volume_ml} mL/hr
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                          {rate.toFixed(2)} mL/kg/hr · {fmtDateTime(log.logged_at)}
                        </p>
                        {log.notes && (
                          <p style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>{log.notes}</p>
                        )}
                      </div>
                      <Pill variant={pillVariant}>
                        {st === "critical" ? "⚠ Critical" : st === "low" ? "Low" : "Normal"}
                      </Pill>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── TIMELINE ── */}
        {tab === "Timeline" && (
          <div className="screen-anim">
            <div className="timeline">
              {/* Admission */}
              <div className="timeline-item">
                <div className="timeline-dot" style={{ background: "var(--success)" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>Burn Injury / Admission</p>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                      {patient.burn_type} · TBSA {patient.tbsa}%
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text4)", whiteSpace: "nowrap", marginLeft: 8 }}>
                    {fmtTime(patient.burn_time)}
                  </p>
                </div>
              </div>

              {/* Protocol started */}
              <div className="timeline-item">
                <div className="timeline-dot" style={{ background: "var(--primary)" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>Parkland Protocol Started</p>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                      {patient.total_fluid?.toLocaleString()} mL · {patient.hourly_rate} mL/hr
                    </p>
                  </div>
                  <p style={{ fontSize: 11, color: "var(--text4)", whiteSpace: "nowrap", marginLeft: 8 }}>
                    {fmtTime(patient.burn_time)}
                  </p>
                </div>
              </div>

              {/* Urine log entries (oldest first) */}
              {[...urineLogs].reverse().map((log) => {
                const st = urineStatus(log.volume_ml, patient.weight, patient.patient_type);
                const dotColor = st === "critical" ? "var(--danger)" : st === "low" ? "var(--warning)" : "var(--success)";
                return (
                  <div key={log.id} className="timeline-item">
                    <div className="timeline-dot" style={{ background: dotColor }} />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>Urine Output: {log.volume_ml} mL/hr</p>
                        <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                          {(log.volume_ml / patient.weight).toFixed(2)} mL/kg/hr
                          {log.notes ? ` · ${log.notes}` : ""}
                        </p>
                      </div>
                      <p style={{ fontSize: 11, color: "var(--text4)", whiteSpace: "nowrap", marginLeft: 8 }}>
                        {fmtTime(log.logged_at)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Current moment */}
              <div className="timeline-item">
                <div
                  className="timeline-dot"
                  style={{ background: "var(--primary)", boxShadow: "0 0 0 5px rgba(0,87,184,0.12)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>
                      {inPhase2 ? "Phase 2 — Next 16 Hours" : "Monitoring — Phase 1"}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                      {inPhase2
                        ? `${patient.next_16h?.toLocaleString()} mL remaining`
                        : `${(8 - hoursElapsed).toFixed(1)} h until Phase 2`}
                    </p>
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>NOW</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
