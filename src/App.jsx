// App.jsx - Root component & navigation controller
import React, { useState } from "react";
import "./styles/global.css";
import "./styles/components.css";

import BottomNav        from "./components/BottomNav";
import PatientList      from "./screens/PatientList";
import AddPatientWizard from "./screens/AddPatientWizard";
import PatientDetail    from "./screens/PatientDetail";
import AuthScreen, { getSession, clearSession } from "./screens/AuthScreen";
import AdminScreen      from "./screens/AdminScreen";
import { TrackerScreen, AlertsScreen } from "./screens/TrackerAndAlerts";
import usePatients from "./hooks/usePatients";

const DESIG_LABEL = { doctor: "Doctor", nurse: "Nurse", admin: "Administrator" };
const DESIG_ICON  = { doctor: "👨‍⚕️",   nurse: "👩‍⚕️",  admin: "🔐" };

export default function App() {
  const [user, setUser] = useState(() => getSession());
  const { patients, loading, savePatient, deletePatient } = usePatients();

  const [tab,             setTab]             = useState("patients");
  const [view,            setView]            = useState("list");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  function handleLogout() { clearSession(); setUser(null); }

  // ── Not logged in ──────────────────────────────────────
  if (!user) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <AuthScreen onAuth={(u) => setUser(u)} />
      </div>
    );
  }

  // ── Admin → show admin dashboard ───────────────────────
  if (user.designation === "admin") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
        <AdminScreen admin={user} onLogout={handleLogout} />
      </div>
    );
  }

  // ── Build alerts ───────────────────────────────────────
  const allAlerts = [];
  patients.forEach((p) => {
    if (p.tbsa >= 40) allAlerts.push({
      id: `${p.id}-tbsa`, patientId: p.id, patientName: p.name, type: "tbsa",
      msg: "TBSA >= 40% — Specialist burn centre referral strongly recommended.",
      time: "Ongoing", currentRate: p.hourly_rate,
    });
    if (p._alert) allAlerts.push({
      id: `${p.id}-urine`, patientId: p.id, patientName: p.name, type: "urine",
      msg: "Low urine output detected. Consider increasing fluid rate by ~20% and consulting a senior physician.",
      time: p._alertTime ? new Date(p._alertTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now",
      currentRate: p.hourly_rate,
    });
  });
  const activeAlerts   = allAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  const realAlertCount = activeAlerts.length;

  async function handleSavePatient(patient) {
    // Tag with who added it
    const tagged = {
      ...patient,
      added_by:             user.name,
      added_by_designation: user.designation,
    };
    await savePatient(tagged);
    setSelectedPatient(tagged);
    setView("detail");
  }

  async function handleDeletePatient(id) {
    if (!window.confirm("Remove this patient?")) return;
    await deletePatient(id);
    if (selectedPatient?.id === id) { setSelectedPatient(null); setView("list"); }
  }

  function openDetail(patient) { setSelectedPatient(patient); setView("detail"); setTab("patients"); }

  function handlePatientUpdate(updated) {
    setSelectedPatient(updated);
    savePatient(updated);
    if (!updated._alert) setDismissedAlerts((d) => [...d, `${updated.id}-urine`]);
  }

  async function handleIncreaseRate(patientId, newRate) {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    const updated = { ...p, hourly_rate: newRate, drip_rate: Math.round(p.drip_rate * 1.2), _alert: false };
    await savePatient(updated);
    setDismissedAlerts((d) => [...d, `${patientId}-urine`]);
    if (selectedPatient?.id === patientId) setSelectedPatient(updated);
  }

  // Full-screen sub-views
  if (view === "add") return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
      <AddPatientWizard onSave={handleSavePatient} onCancel={() => setView("list")} />
    </div>
  );

  if (view === "detail" && selectedPatient) return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh" }}>
      <PatientDetail
        patient={selectedPatient}
        onBack={() => { setView("list"); setSelectedPatient(null); }}
        onPatientUpdate={handlePatientUpdate}
        currentUser={user}
      />
    </div>
  );

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100dvh", background: "var(--bg)", position: "relative" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "12px 16px", display: "flex", justifyContent: "space-between",
        alignItems: "center", position: "sticky", top: 0, zIndex: 50, boxShadow: "var(--shadow-sm)",
      }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px", color: "var(--text)" }}>🔥 Burn Care</p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.3px" }}>Emergency Burn Care Assistant</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {realAlertCount > 0 && (
            <button onClick={() => setTab("alerts")} style={{
              background: "var(--danger-light)", border: "1px solid var(--danger-mid)",
              borderRadius: "var(--radius-sm)", padding: "5px 10px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit",
            }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--danger)", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>
                {realAlertCount} ALERT{realAlertCount > 1 ? "S" : ""}
              </span>
            </button>
          )}

          {/* User pill */}
          <button onClick={handleLogout} title="Tap to sign out" style={{
            display: "flex", alignItems: "center", gap: 7,
            background: "var(--surface3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: "6px 10px",
            cursor: "pointer", fontFamily: "inherit",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--primary-light)", border: "2px solid var(--primary-mid)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0,
            }}>
              {DESIG_ICON[user.designation]}
            </div>
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{user.name.split(" ")[0]}</p>
              <p style={{ fontSize: 9, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
                {DESIG_LABEL[user.designation]}
              </p>
            </div>
            <span style={{ fontSize: 10, color: "var(--text4)", marginLeft: 2 }}>⏻</span>
          </button>
        </div>
      </header>

      <main style={{ overflowY: "auto" }}>
        {tab === "patients" && (
          <PatientList patients={patients} loading={loading}
            onSelectPatient={openDetail}
            onAddPatient={() => setView("add")}
            onDeletePatient={handleDeletePatient}
          />
        )}
        {tab === "tracker" && <TrackerScreen patients={patients} />}
        {tab === "alerts"  && (
          <AlertsScreen activeAlerts={activeAlerts}
            onDismiss={(id) => setDismissedAlerts((d) => [...d, id])}
            onIncreaseRate={handleIncreaseRate}
          />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} alertCount={realAlertCount} />
    </div>
  );
}
