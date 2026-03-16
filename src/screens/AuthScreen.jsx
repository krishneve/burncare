// screens/AuthScreen.jsx — Login only (no self sign-up)
import React, { useState } from "react";
import { DB } from "../lib/supabase";

export function getSession() {
  const raw = localStorage.getItem("drip_session");
  return raw ? JSON.parse(raw) : null;
}
export function clearSession() {
  localStorage.removeItem("drip_session");
}

export default function AuthScreen({ onAuth }) {
  const [form,     setForm]     = useState({ userId: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [busy,     setBusy]     = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  async function handleLogin() {
    const { userId, password } = form;
    if (!userId.trim() || !password) { setError("Please enter User ID and password."); return; }
    setBusy(true);
    try {
      const user = await DB.getUser(userId.trim().toLowerCase());
      if (!user)                      { setError("User ID not found."); setBusy(false); return; }
      if (user.password !== password) { setError("Incorrect password."); setBusy(false); return; }
      localStorage.setItem("drip_session", JSON.stringify(user));
      onAuth(user);
    } catch (e) {
      setError("Login failed. Check your internet connection.");
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "24px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, margin: "0 auto 16px", boxShadow: "var(--shadow-primary)",
          }}>🔥</div>
          <p style={{ fontWeight: 800, fontSize: 28, letterSpacing: "-0.5px", color: "var(--text)" }}>Burn Care</p>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>Emergency Burn Care · Fluid Resuscitation</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Sign In</p>
          <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 22 }}>
            Use credentials provided by your administrator
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>User ID</label>
              <input
                className="input" placeholder="Enter your user ID"
                value={form.userId}
                onChange={(e) => set("userId", e.target.value.toLowerCase().replace(/\s/g, ""))}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input" type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  style={{ paddingRight: 46 }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
                <button onClick={() => setShowPass((s) => !s)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text3)", padding: 0,
                }}>{showPass ? "🙈" : "👁️"}</button>
              </div>
            </div>

            {error && (
              <div style={{ background: "var(--danger-light)", border: "1px solid var(--danger-mid)", borderRadius: "var(--radius-sm)", padding: "10px 14px" }}>
                <p style={{ fontSize: 13, color: "var(--danger)", fontWeight: 600 }}>⚠ {error}</p>
              </div>
            )}

            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={handleLogin} disabled={busy}>
              {busy ? "Signing in…" : "Sign In →"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--text4)", marginTop: 20, lineHeight: 1.6 }}>
          Clinical support tool only. Contact your administrator if you need access.
        </p>
      </div>
    </div>
  );
}
