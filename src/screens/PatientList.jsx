// ─────────────────────────────────────────────────────────
// screens/PatientList.jsx
// Home screen: search, stats, list of patient cards
// ─────────────────────────────────────────────────────────
import React, { useState } from "react";
import PatientCard from "../components/PatientCard";
import { EmptyState, LoadingShimmer } from "../components/UI";

export default function PatientList({ patients, loading, onSelectPatient, onAddPatient, onDeletePatient }) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.bed_number?.toLowerCase().includes(q) ||
      p.ward?.toLowerCase().includes(q)
    );
  });

  const stats = [
    { label: "Active",     val: patients.filter((p) => p.status === "active").length,            color: "var(--primary)"  },
    { label: "Critical",   val: patients.filter((p) => p.tbsa >= 40).length,                     color: "var(--danger)"   },
    { label: "Pediatric",  val: patients.filter((p) => p.patient_type === "pediatric").length,   color: "#7c3aed"          },
  ];

  return (
    <div className="screen-anim" style={{ paddingBottom: 100 }}>
      <div style={{ padding: "14px 16px 0" }}>

        {/* Search + Add */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text4)", fontSize: 16 }}>
              🔍
            </span>
            <input
              className="input"
              style={{ paddingLeft: 38, height: 44, fontSize: 14 }}
              placeholder="Search name, ward, bed…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "auto", padding: "0 18px", height: 44, borderRadius: "var(--radius-sm)", fontSize: 14 }}
            onClick={onAddPatient}
          >
            + Add
          </button>
        </div>

        {/* Stats strip */}
        {patients.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {stats.map((s) => (
              <div
                key={s.label}
                style={{
                  flexShrink: 0, background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)", padding: "10px 16px", textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <p className="stat-num" style={{ fontSize: 22, color: s.color }}>{s.val}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* List */}
        {loading ? (
          <LoadingShimmer count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState
            emoji="🏥"
            title={search ? "No matching patients" : "No patients yet"}
            subtitle={search ? "Try a different search term" : "Add your first burn patient to begin"}
            action={
              !search && (
                <button className="btn btn-primary" style={{ width: "auto", margin: "0 auto", padding: "0 28px" }} onClick={onAddPatient}>
                  + Add First Patient
                </button>
              )
            }
          />
        ) : (
          filtered.map((p) => (
            <PatientCard
              key={p.id}
              patient={p}
              onClick={() => onSelectPatient(p)}
              onDelete={onDeletePatient}
            />
          ))
        )}
      </div>
    </div>
  );
}
