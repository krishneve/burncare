// screens/AdminScreen.jsx — Admin dashboard to manage staff accounts
import React, { useState, useEffect } from "react";
import { DB } from "../lib/supabase";
import { PageHeader, EmptyState } from "../components/UI";

const DESIG_ICON  = { doctor: "👨‍⚕️", nurse: "👩‍⚕️" };
const DESIG_LABEL = { doctor: "Doctor", nurse: "Nurse" };

export default function AdminScreen({ admin, onLogout }) {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("list"); // "list" | "add"
  const [form,     setForm]     = useState({ name: "", designation: "doctor", userId: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);
  const [success,  setSuccess]  = useState("");

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const all = await DB.getAllUsers();
    setUsers(all.filter((u) => u.designation !== "admin"));
    setLoading(false);
  }

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  async function handleCreate() {
    const { name, designation, userId, password } = form;
    if (!name.trim())        { setError("Full name is required."); return; }
    if (!userId.trim())      { setError("User ID is required."); return; }
    if (userId.length < 4)   { setError("User ID must be at least 4 characters."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const existing = await DB.getUser(userId.trim().toLowerCase());
      if (existing) { setError("This User ID is already taken."); setBusy(false); return; }
      await DB.createUser({
        id:          crypto.randomUUID(),
        name:        name.trim(),
        designation,
        user_id:     userId.trim().toLowerCase(),
        password,
        created_at:  new Date().toISOString(),
      });
      setSuccess(`✓ ${DESIG_LABEL[designation]} "${name.trim()}" created successfully`);
      setForm({ name: "", designation: "doctor", userId: "", password: "" });
      setView("list");
      loadUsers();
      setTimeout(() => setSuccess(""), 4000);
    } catch (e) {
      setError("Failed to create user. Try again.");
    }
    setBusy(false);
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remove ${user.name} (${user.user_id})?`)) return;
    await DB.deleteUser(user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  // ── Add Staff form ──────────────────────────────────────
  if (view === "add") {
    return (
      <div className="screen-anim" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <PageHeader title="Add Staff Member" onBack={() => { setView("list"); setError(""); }} />
        <div style={{ padding: "16px 16px 40px" }}>

          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>Full Name *</label>
                <input className="input" placeholder="e.g. Dr. Priya Sharma" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>

              {/* Designation */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 8 }}>Designation *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[{ value: "doctor", icon: "👨‍⚕️", label: "Doctor" }, { value: "nurse", icon: "👩‍⚕️", label: "Nurse" }].map((d) => {
                    const active = form.designation === d.value;
                    return (
                      <button key={d.value} onClick={() => set("designation", d.value)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "16px 10px", borderRadius: "var(--radius-sm)",
                        border: `2px solid ${active ? "var(--primary)" : "var(--border)"}`,
                        background: active ? "var(--primary-light)" : "var(--surface2)",
                        cursor: "pointer", fontFamily: "inherit", gap: 6, transition: "all 0.15s",
                      }}>
                        <span style={{ fontSize: 28 }}>{d.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--primary)" : "var(--text2)" }}>{d.label}</span>
                        {active && <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 800 }}>✓ Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User ID */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>User ID *</label>
                <input
                  className="input" placeholder="e.g. drpriya01"
                  value={form.userId}
                  onChange={(e) => set("userId", e.target.value.toLowerCase().replace(/\s/g, ""))}
                  autoCapitalize="none" spellCheck={false}
                />
                <p style={{ fontSize: 11, color: "var(--text4)", marginTop: 4 }}>Min 4 characters, no spaces. Share this with the staff member.</p>
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input" type={showPass ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={form.password} onChange={(e) => set("password", e.target.value)}
                    style={{ paddingRight: 46 }}
                  />
                  <button onClick={() => setShowPass((s) => !s)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text3)", padding: 0,
                  }}>{showPass ? "🙈" : "👁️"}</button>
                </div>
                <p style={{ fontSize: 11, color: "var(--text4)", marginTop: 4 }}>Share this with the staff member to let them log in.</p>
              </div>

              {error && (
                <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-mid)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
                  <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>⚠ {error}</p>
                </div>
              )}

              <button className="btn btn-primary" onClick={handleCreate} disabled={busy} style={{ marginTop: 4 }}>
                {busy ? "Creating…" : "✓ Create Staff Account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Staff list ──────────────────────────────────────────
  const doctors = users.filter((u) => u.designation === "doctor");
  const nurses  = users.filter((u) => u.designation === "nurse");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div className="app-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.4px" }}>🔥 Burn Care</p>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>Admin Panel</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{admin.name}</p>
              <p style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, textTransform: "uppercase" }}>Administrator</p>
            </div>
            <button onClick={onLogout} style={{
              background: "var(--surface3)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)", padding: "7px 12px",
              cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: "var(--text2)",
            }}>⏻ Logout</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 40px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total Staff", val: users.length,   color: "var(--primary)" },
            { label: "Doctors",     val: doctors.length, color: "var(--primary-dark)" },
            { label: "Nurses",      val: nurses.length,  color: "var(--success)" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 24, color: s.color }}>{s.val}</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.4px", marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {success && (
          <div style={{ background: "var(--success-light)", border: "1px solid var(--success-mid)", borderRadius: "var(--radius-sm)", padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: "var(--success)", fontWeight: 600 }}>{success}</p>
          </div>
        )}

        {/* Add button */}
        <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={() => setView("add")}>
          + Add Staff Member
        </button>

        {/* Staff list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "var(--text4)" }}>Loading staff…</div>
        ) : users.length === 0 ? (
          <EmptyState emoji="👥" title="No staff yet" subtitle="Add doctors and nurses to give them access" />
        ) : (
          <>
            {[{ label: "Doctors", list: doctors }, { label: "Nurses", list: nurses }].map(({ label, list }) =>
              list.length === 0 ? null : (
                <div key={label} style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text3)", marginBottom: 10 }}>{label}</p>
                  {list.map((u) => (
                    <div key={u.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: "var(--primary-light)", border: "1px solid var(--primary-mid)",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                        }}>
                          {DESIG_ICON[u.designation]}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 15 }}>{u.name}</p>
                          <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                            {DESIG_LABEL[u.designation]} · ID: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{u.user_id}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(u)}
                        style={{
                          background: "var(--danger-light)", border: "1px solid var(--danger-mid)",
                          color: "var(--danger)", borderRadius: 8, padding: "6px 10px",
                          cursor: "pointer", fontSize: 14, flexShrink: 0,
                        }}
                      >🗑</button>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
