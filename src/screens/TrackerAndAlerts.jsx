// ─────────────────────────────────────────────────────────
// screens/TrackerScreen.jsx
// Shows live phase progress for all active patients
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { ProgressBar, EmptyState, Pill } from "../components/UI";

export function TrackerScreen({ patients }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  if (!patients.length) {
    return (
      <EmptyState
        emoji="📊"
        title="No patients to track"
        subtitle="Add patients from the Patients tab"
      />
    );
  }

  return (
    <div className="screen-anim" style={{ padding: "14px 16px 100px" }}>
      <p style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.4px", marginBottom: 14 }}>Active Tracker</p>

      {patients.map((p) => {
        const elapsedH   = (Date.now() - new Date(p.burn_time)) / 3_600_000;
        const phase       = elapsedH >= 8 ? 2 : 1;
        const prog        = phase === 1 ? Math.min(elapsedH / 8, 1) : Math.min((elapsedH - 8) / 16, 1);
        const targetLabel = phase === 1 ? "Phase 1 — 8 h" : "Phase 2 — 16 h";
        const elapsed     = phase === 1 ? elapsedH.toFixed(1) : (elapsedH - 8).toFixed(1);
        const total       = phase === 1 ? 8 : 16;

        return (
          <div key={p.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                  {p.tbsa}% TBSA · {p.weight} kg · {p.patient_type}
                </p>
              </div>
              <Pill variant={phase === 2 ? "green" : p.tbsa >= 40 ? "red" : "blue"}>
                Ph.{phase} · {elapsed}/{total}h
              </Pill>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>
              <span>{targetLabel}</span>
              <span style={{ fontWeight: 700, color: "var(--primary)" }}>{p.hourly_rate} mL/hr</span>
            </div>
            <ProgressBar value={prog} height={8} />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
              {[
                { label: "Total", val: `${p.total_fluid?.toLocaleString()} mL` },
                { label: "Phase 1", val: `${p.first_8h?.toLocaleString()} mL` },
                { label: "Drip",   val: `${p.drip_rate} gtt/min` },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", background: "var(--surface3)", borderRadius: 8, padding: "8px 4px" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase" }}>{s.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// screens/AlertsScreen.jsx
// Shows all active critical warnings
// activeAlerts: array of { id, patientId, patientName, type, msg, time, currentRate }
// onIncreaseRate: (patientId, newRate) => void
// ─────────────────────────────────────────────────────────
export function AlertsScreen({ activeAlerts = [], onDismiss, onIncreaseRate }) {
  return (
    <div className="screen-anim" style={{ padding: "14px 16px 100px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 24 }}>⚠️</span>
        <p style={{ fontSize: 20, fontWeight: 800, color: "var(--danger)", letterSpacing: "-0.4px" }}>Urgent Warnings</p>
      </div>
      <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>
        {activeAlerts.length
          ? `${activeAlerts.length} critical item${activeAlerts.length > 1 ? "s" : ""} require your attention`
          : "No urgent warnings at this time"}
      </p>

      {/* All-clear */}
      {activeAlerts.length === 0 && (
        <div style={{ textAlign: "center", padding: "36px 0" }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>✅</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>All clear</p>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>No urgent alerts at this time</p>
        </div>
      )}

      {/* Alert cards */}
      {activeAlerts.map((a) => {
        const isUrine = a.type === "urine";
        const newRate = isUrine ? Math.round((a.currentRate || 0) * 1.2) : null;

        return (
          <div key={a.id} className="card" style={{ marginBottom: 14, borderColor: "var(--danger-mid)", borderWidth: 2 }}>
            {/* Badge + time */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="pill pill-red">⚠ Critical Alert</span>
              <span style={{ fontSize: 11, color: "var(--text4)" }}>{a.time || "Just now"}</span>
            </div>

            {/* Patient name */}
            <p style={{ fontWeight: 800, fontSize: 17, marginBottom: 10 }}>{a.patientName}</p>

            {/* Message box */}
            <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-mid)", borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--danger)", lineHeight: 1.55 }}>{a.msg}</p>
            </div>

            {/* Increase Fluid Rate button — only for urine alerts */}
            {isUrine && (
              <div style={{
                background: "var(--warning-light)", border: "1px solid var(--warning-mid)",
                borderRadius: 10, padding: 14, marginBottom: 12,
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--warning)", marginBottom: 8 }}>
                  Recommended Action
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>Current rate</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
                      {a.currentRate} mL/hr
                    </p>
                  </div>
                  <span style={{ fontSize: 20, color: "var(--text3)" }}>→</span>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--text3)" }}>New rate (+20%)</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "var(--warning)" }}>
                      {newRate} mL/hr
                    </p>
                  </div>
                </div>
                <button
                  className="btn"
                  style={{ height: 46, background: "var(--warning)", color: "white", fontSize: 14, borderRadius: "var(--radius-sm)" }}
                  onClick={() => onIncreaseRate && onIncreaseRate(a.patientId, newRate)}
                >
                  💧 Increase Fluid Rate to {newRate} mL/hr
                </button>
              </div>
            )}

            {/* Acknowledge */}
            <button
              className="btn btn-danger"
              style={{ height: 44, fontSize: 14 }}
              onClick={() => onDismiss && onDismiss(a.id)}
            >
              ✓ Acknowledge Alert
            </button>
          </div>
        );
      })}
    </div>
  );
}
