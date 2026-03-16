// ─────────────────────────────────────────────────────────
// components/BottomNav.jsx
// ─────────────────────────────────────────────────────────
import React from "react";

const NAV_ITEMS = [
  { id: "patients", icon: "👥", label: "Patients" },
  { id: "tracker",  icon: "📊", label: "Tracker"  },
  { id: "alerts",   icon: "🔔", label: "Alerts"   },
];

export default function BottomNav({ tab, setTab, alertCount }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${tab === item.id ? "active" : ""}`}
          onClick={() => setTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
          {item.id === "alerts" && alertCount > 0 && (
            <span className="nav-badge">{alertCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
