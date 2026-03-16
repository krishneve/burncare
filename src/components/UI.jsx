// ─────────────────────────────────────────────────────────
// components/UI.jsx
// Shared, reusable presentational components
// ─────────────────────────────────────────────────────────
import React from "react";

// ── StatusDot ─────────────────────────────────────────────
export function StatusDot({ status, size = 9 }) {
  const COLOR = {
    critical: "#d92b2b",
    low:      "#c97a00",
    normal:   "#16803c",
    high:     "#0057b8",
    unknown:  "#94a3b8",
  };
  const glow = status === "critical" ? `0 0 6px ${COLOR.critical}` : "none";
  return (
    <span
      style={{
        display: "inline-block",
        width: size, height: size,
        borderRadius: "50%",
        background: COLOR[status] || COLOR.unknown,
        boxShadow: glow,
        flexShrink: 0,
      }}
    />
  );
}

// ── Pill ──────────────────────────────────────────────────
export function Pill({ children, variant = "slate" }) {
  return <span className={`pill pill-${variant}`}>{children}</span>;
}

// ── SectionLabel ─────────────────────────────────────────
export function SectionLabel({ children }) {
  return <p className="section-label">{children}</p>;
}

// ── PageHeader ────────────────────────────────────────────
export function PageHeader({ title, subtitle, onBack, rightSlot }) {
  return (
    <div className="app-header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "var(--surface3)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 18, flexShrink: 0,
            }}
          >
            ←
          </button>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px", color: "var(--text)" }}>{title}</p>
          {subtitle && <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 1 }}>{subtitle}</p>}
        </div>
        {rightSlot && <div>{rightSlot}</div>}
      </div>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────
export function ProgressBar({ value, color = "var(--primary)", height = 8 }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  const fillColor = value >= 1 ? "var(--success)" : color;
  return (
    <div className="progress-track" style={{ height }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: fillColor }} />
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────
export function StatCard({ icon, label, value, unit, statusColor }) {
  return (
    <div className="metric-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        {statusColor && (
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
        )}
      </div>
      <p className="stat-num" style={{ fontSize: 22, color: "var(--text)" }}>
        {value}
        {unit && <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 3, color: "var(--text3)" }}>{unit}</span>}
      </p>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text3)", marginTop: 2 }}>{label}</p>
    </div>
  );
}

// ── WizardStepDots ────────────────────────────────────────
export function WizardStepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 22 : 6,
            height: 6,
            borderRadius: 99,
            background: i === current ? "var(--primary)" : i < current ? "var(--success)" : "var(--border-strong)",
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ── AlertBanner ───────────────────────────────────────────
export function AlertBanner({ type = "danger", icon, title, children }) {
  const cls = type === "warning" ? "alert-box-amber" : "alert-box";
  const titleColor = type === "warning" ? "var(--warning)" : "var(--danger)";
  return (
    <div className={cls}>
      <p style={{ fontWeight: 700, color: titleColor, marginBottom: 4 }}>
        {icon} {title}
      </p>
      <div style={{ fontSize: 13, color: type === "warning" ? "var(--warning)" : "var(--danger)", lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle, action }) {
  return (
    <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--text3)" }}>
      <p style={{ fontSize: 52, marginBottom: 14 }}>{emoji}</p>
      <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text2)" }}>{title}</p>
      {subtitle && <p style={{ fontSize: 13, marginTop: 6, marginBottom: 20 }}>{subtitle}</p>}
      {action}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider({ margin = "14px 0" }) {
  return <div className="divider" style={{ margin }} />;
}

// ── LoadingShimmer ────────────────────────────────────────
export function LoadingShimmer({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer" style={{ height: 100, marginBottom: 10 }} />
      ))}
    </>
  );
}
