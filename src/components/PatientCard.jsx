// ─────────────────────────────────────────────────────────
// components/PatientCard.jsx
// ─────────────────────────────────────────────────────────
import React from "react";
import { tbsaUrgency } from "../lib/medical";
import { Pill } from "./UI";

export default function PatientCard({ patient, onClick, onDelete }) {
  const urgency = tbsaUrgency(patient.tbsa);
  const burnTime = new Date(patient.burn_time);
  const hoursAgo = ((Date.now() - burnTime) / 3_600_000).toFixed(1);
  const phase = parseFloat(hoursAgo) >= 8 ? 2 : 1;

  const urgencyClass =
    urgency === "critical" ? "urgency-critical" :
    urgency === "high"     ? "urgency-high"     : "";

  return (
    <div
      className={`card ${urgencyClass}`}
      style={{ marginBottom: 10, cursor: "pointer", transition: "box-shadow 0.15s" }}
      onClick={onClick}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--shadow)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Left: avatar + basic info */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: 1 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: urgency === "critical" ? "var(--danger-light)" : "var(--primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
          }}>
            {patient.patient_type === "pediatric" ? "👶" : "🧑‍⚕️"}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px", marginBottom: 2 }}>
              {patient.name}
            </p>
            <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>
              {patient.age}y · {patient.weight} kg
              {patient.bed_number && ` · Bed ${patient.bed_number}`}
              {patient.ward && ` · ${patient.ward}`}
              {patient.added_by && <span style={{ display: "block", marginTop: 2, color: "var(--text4)" }}>{patient.added_by} · {patient.added_by_designation === "doctor" ? "Doctor" : "Nurse"}</span>}
            </p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <Pill variant="blue">TBSA {patient.tbsa}%</Pill>
              <Pill variant={urgency === "critical" ? "red" : urgency === "high" ? "amber" : "green"}>
                {urgency === "critical" ? "⚠ Critical" : urgency === "high" ? "⚡ High" : "✓ Stable"}
              </Pill>
              <Pill variant="slate">Ph.{phase} · {hoursAgo}h</Pill>
            </div>
          </div>
        </div>

        {/* Right: delete + rate */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginLeft: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onDelete(patient.id); }}
            style={{
              background: "var(--danger-light)", border: "1px solid var(--danger-mid)",
              color: "var(--danger)", borderRadius: 8,
              padding: "5px 8px", cursor: "pointer", fontSize: 13, lineHeight: 1,
            }}
          >
            🗑
          </button>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "var(--text4)", fontWeight: 600, textTransform: "uppercase" }}>Rate</p>
            <p className="stat-num" style={{ fontSize: 15, color: "var(--primary)" }}>
              {patient.hourly_rate} mL/hr
            </p>
          </div>
        </div>
      </div>

      {/* High TBSA warning strip */}
      {urgency === "critical" && (
        <div style={{
          marginTop: 12,
          background: "var(--danger-light)", border: "1px solid var(--danger-mid)",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--danger)" }}>
            ⚠ TBSA ≥ 40% — Specialist burn centre referral recommended
          </p>
        </div>
      )}
    </div>
  );
}
