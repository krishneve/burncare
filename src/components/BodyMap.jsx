// components/BodyMap.jsx
// Adult: Rule of Nines | Paediatric: Lund & Browder (age-adjusted)
import React, { useState } from "react";
import { ADULT_BODY_REGIONS, getPaedBodyRegions } from "../lib/medical";

// ── Shared region click wrapper ────────────────────────────
function Region({ id, selected, onToggle, children }) {
  return (
    <g onClick={() => onToggle(id)} style={{ cursor: "pointer" }}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          fill:        selected ? "#d92b2b" : "#f1f5f9",
          stroke:      selected ? "#b91c1c" : "#cbd5e1",
          strokeWidth: 1.5,
        })
      )}
    </g>
  );
}

function RLabel({ x, y, selected, children }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif"
      fontWeight={600} fill={selected ? "white" : "#64748b"} style={{ pointerEvents: "none", userSelect: "none" }}>
      {children}
    </text>
  );
}

// ── ADULT front ────────────────────────────────────────────
function AdultFront({ sel, toggle }) {
  const s = (id) => sel.includes(id);
  return (
    <svg width="150" height="360" viewBox="0 0 150 360">
      <Region id="head" selected={s("head")} onToggle={toggle}><ellipse cx="75" cy="26" rx="22" ry="26"/></Region>
      <RLabel x={75} y={30} selected={s("head")}>Head 9%</RLabel>
      <rect x="68" y="52" width="14" height="10" rx={4} fill="#e2e8f0" stroke="none"/>
      <Region id="chest" selected={s("chest")} onToggle={toggle}><rect x="45" y="64" width="60" height="48" rx={8}/></Region>
      <RLabel x={75} y={91} selected={s("chest")}>Chest 9%</RLabel>
      <Region id="abdomen" selected={s("abdomen")} onToggle={toggle}><rect x="45" y="114" width="60" height="48" rx={8}/></Region>
      <RLabel x={75} y={141} selected={s("abdomen")}>Abdomen 9%</RLabel>
      <g transform="rotate(10,30,110)" onClick={() => toggle("left_arm")} style={{cursor:"pointer"}}>
        <rect x="18" y="68" width="26" height="80" rx={13} fill={s("left_arm")?"#d92b2b":"#f1f5f9"} stroke={s("left_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={31} y={112} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("left_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <g transform="rotate(-10,120,110)" onClick={() => toggle("right_arm")} style={{cursor:"pointer"}}>
        <rect x="106" y="68" width="26" height="80" rx={13} fill={s("right_arm")?"#d92b2b":"#f1f5f9"} stroke={s("right_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={119} y={112} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("right_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <Region id="perineum" selected={s("perineum")} onToggle={toggle}><rect x="62" y="164" width="26" height="14" rx={5}/></Region>
      <RLabel x={75} y={174} selected={s("perineum")}>1%</RLabel>
      <Region id="left_leg_front" selected={s("left_leg_front")} onToggle={toggle}><rect x="44" y="181" width="32" height="148" rx={14}/></Region>
      <RLabel x={60} y={260} selected={s("left_leg_front")}>9%</RLabel>
      <Region id="right_leg_front" selected={s("right_leg_front")} onToggle={toggle}><rect x="80" y="181" width="32" height="148" rx={14}/></Region>
      <RLabel x={96} y={260} selected={s("right_leg_front")}>9%</RLabel>
    </svg>
  );
}

function AdultBack({ sel, toggle }) {
  const s = (id) => sel.includes(id);
  return (
    <svg width="150" height="360" viewBox="0 0 150 360">
      <Region id="head" selected={s("head")} onToggle={toggle}><ellipse cx="75" cy="26" rx="22" ry="26"/></Region>
      <RLabel x={75} y={30} selected={s("head")}>Head 9%</RLabel>
      <rect x="68" y="52" width="14" height="10" rx={4} fill="#e2e8f0" stroke="none"/>
      <Region id="upper_back" selected={s("upper_back")} onToggle={toggle}><rect x="45" y="64" width="60" height="48" rx={8}/></Region>
      <RLabel x={75} y={91} selected={s("upper_back")}>Upper Back 9%</RLabel>
      <Region id="lower_back" selected={s("lower_back")} onToggle={toggle}><rect x="45" y="114" width="60" height="48" rx={8}/></Region>
      <RLabel x={75} y={141} selected={s("lower_back")}>Lower Back 9%</RLabel>
      <g transform="rotate(10,30,110)" onClick={() => toggle("left_arm")} style={{cursor:"pointer"}}>
        <rect x="18" y="68" width="26" height="80" rx={13} fill={s("left_arm")?"#d92b2b":"#f1f5f9"} stroke={s("left_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={31} y={112} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("left_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <g transform="rotate(-10,120,110)" onClick={() => toggle("right_arm")} style={{cursor:"pointer"}}>
        <rect x="106" y="68" width="26" height="80" rx={13} fill={s("right_arm")?"#d92b2b":"#f1f5f9"} stroke={s("right_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={119} y={112} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("right_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <Region id="left_leg_back" selected={s("left_leg_back")} onToggle={toggle}><rect x="44" y="181" width="32" height="148" rx={14}/></Region>
      <RLabel x={60} y={260} selected={s("left_leg_back")}>9%</RLabel>
      <Region id="right_leg_back" selected={s("right_leg_back")} onToggle={toggle}><rect x="80" y="181" width="32" height="148" rx={14}/></Region>
      <RLabel x={96} y={260} selected={s("right_leg_back")}>9%</RLabel>
    </svg>
  );
}

// ── PAEDIATRIC front (Lund & Browder, age-adjusted) ────────
function PaedFront({ sel, toggle, regions }) {
  const s   = (id) => sel.includes(id);
  const pct = (id) => { const r = regions.find((x) => x.id === id); return r ? r.pct % 1 === 0 ? `${r.pct}%` : `${r.pct.toFixed(1)}%`  : ""; };

  return (
    <svg width="150" height="360" viewBox="0 0 150 360">
      {/* Larger head for child */}
      <Region id="head" selected={s("head")} onToggle={toggle}><ellipse cx="75" cy="30" rx="28" ry="30"/></Region>
      <RLabel x={75} y={34} selected={s("head")}>Head {pct("head")}</RLabel>
      <rect x="68" y="60" width="14" height="8" rx={3} fill="#e2e8f0" stroke="none"/>
      {/* Shorter trunk */}
      <Region id="chest" selected={s("chest")} onToggle={toggle}><rect x="46" y="70" width="58" height="42" rx={8}/></Region>
      <RLabel x={75} y={94} selected={s("chest")}>Chest 9%</RLabel>
      <Region id="abdomen" selected={s("abdomen")} onToggle={toggle}><rect x="46" y="114" width="58" height="42" rx={8}/></Region>
      <RLabel x={75} y={138} selected={s("abdomen")}>Abd 9%</RLabel>
      {/* Shorter arms */}
      <g transform="rotate(8,28,104)" onClick={() => toggle("left_arm")} style={{cursor:"pointer"}}>
        <rect x="18" y="72" width="22" height="68" rx={11} fill={s("left_arm")?"#d92b2b":"#f1f5f9"} stroke={s("left_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={29} y={108} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("left_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <g transform="rotate(-8,122,104)" onClick={() => toggle("right_arm")} style={{cursor:"pointer"}}>
        <rect x="110" y="72" width="22" height="68" rx={11} fill={s("right_arm")?"#d92b2b":"#f1f5f9"} stroke={s("right_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={121} y={108} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("right_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <Region id="perineum" selected={s("perineum")} onToggle={toggle}><rect x="63" y="158" width="24" height="12" rx={4}/></Region>
      <RLabel x={75} y={167} selected={s("perineum")}>1%</RLabel>
      {/* Shorter legs for young child */}
      <Region id="left_leg_front" selected={s("left_leg_front")} onToggle={toggle}><rect x="45" y="173" width="30" height="130" rx={13}/></Region>
      <RLabel x={60} y={240} selected={s("left_leg_front")}>{pct("left_leg_front")}</RLabel>
      <Region id="right_leg_front" selected={s("right_leg_front")} onToggle={toggle}><rect x="78" y="173" width="30" height="130" rx={13}/></Region>
      <RLabel x={93} y={240} selected={s("right_leg_front")}>{pct("right_leg_front")}</RLabel>
    </svg>
  );
}

function PaedBack({ sel, toggle, regions }) {
  const s   = (id) => sel.includes(id);
  const pct = (id) => { const r = regions.find((x) => x.id === id); return r ? r.pct % 1 === 0 ? `${r.pct}%` : `${r.pct.toFixed(1)}%` : ""; };

  return (
    <svg width="150" height="360" viewBox="0 0 150 360">
      <Region id="head" selected={s("head")} onToggle={toggle}><ellipse cx="75" cy="30" rx="28" ry="30"/></Region>
      <RLabel x={75} y={34} selected={s("head")}>Head {pct("head")}</RLabel>
      <rect x="68" y="60" width="14" height="8" rx={3} fill="#e2e8f0" stroke="none"/>
      <Region id="upper_back" selected={s("upper_back")} onToggle={toggle}><rect x="46" y="70" width="58" height="42" rx={8}/></Region>
      <RLabel x={75} y={94} selected={s("upper_back")}>Up.Back 9%</RLabel>
      <Region id="lower_back" selected={s("lower_back")} onToggle={toggle}><rect x="46" y="114" width="58" height="42" rx={8}/></Region>
      <RLabel x={75} y={138} selected={s("lower_back")}>Lo.Back 9%</RLabel>
      <g transform="rotate(8,28,104)" onClick={() => toggle("left_arm")} style={{cursor:"pointer"}}>
        <rect x="18" y="72" width="22" height="68" rx={11} fill={s("left_arm")?"#d92b2b":"#f1f5f9"} stroke={s("left_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={29} y={108} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("left_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <g transform="rotate(-8,122,104)" onClick={() => toggle("right_arm")} style={{cursor:"pointer"}}>
        <rect x="110" y="72" width="22" height="68" rx={11} fill={s("right_arm")?"#d92b2b":"#f1f5f9"} stroke={s("right_arm")?"#b91c1c":"#cbd5e1"} strokeWidth={1.5}/>
        <text x={121} y={108} textAnchor="middle" fontSize={7} fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight={600} fill={s("right_arm")?"white":"#64748b"} style={{pointerEvents:"none"}}>9%</text>
      </g>
      <Region id="left_leg_back" selected={s("left_leg_back")} onToggle={toggle}><rect x="45" y="173" width="30" height="130" rx={13}/></Region>
      <RLabel x={60} y={240} selected={s("left_leg_back")}>{pct("left_leg_back")}</RLabel>
      <Region id="right_leg_back" selected={s("right_leg_back")} onToggle={toggle}><rect x="78" y="173" width="30" height="130" rx={13}/></Region>
      <RLabel x={93} y={240} selected={s("right_leg_back")}>{pct("right_leg_back")}</RLabel>
    </svg>
  );
}

// ── Main BodyMap ───────────────────────────────────────────
export default function BodyMap({ selectedRegions, onToggle, patientType = "adult", ageYears = 0 }) {
  const [view, setView] = useState("front");

  const isPaed   = patientType === "pediatric";
  const regions  = isPaed ? getPaedBodyRegions(ageYears) : ADULT_BODY_REGIONS;

  const totalTBSA = selectedRegions.reduce((sum, id) => {
    const r = regions.find((b) => b.id === id);
    return sum + (r ? r.pct : 0);
  }, 0);

  return (
    <div>
      {/* TBSA counter */}
      <div className="card" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="section-label">Total TBSA {isPaed && <span style={{ color: "var(--primary)" }}>· Lund & Browder (Age {ageYears}y)</span>}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="stat-num" style={{
              fontSize: 52, lineHeight: 1,
              color: totalTBSA >= 40 ? "var(--danger)" : totalTBSA >= 20 ? "var(--warning)" : "var(--text)",
            }}>{totalTBSA % 1 === 0 ? totalTBSA : totalTBSA.toFixed(1)}</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)" }}>%</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          {totalTBSA >= 40 && <span className="pill pill-red pulse-dot">⚠ High Risk</span>}
          {totalTBSA > 0 && totalTBSA < 40 && <span className="pill pill-amber">{selectedRegions.length} region{selectedRegions.length !== 1 ? "s" : ""}</span>}
          {totalTBSA === 0 && <p style={{ fontSize: 12, color: "var(--text4)" }}>Tap to select</p>}
        </div>
      </div>

      {/* Method label */}
      {isPaed && (
        <div className="info-box" style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600 }}>
            👶 Using Lund & Browder chart — Head: {regions.find(r=>r.id==="head")?.pct}%, Each leg: {(regions.find(r=>r.id==="left_leg_front")?.pct * 2).toFixed(1)}%
          </p>
        </div>
      )}

      {/* Front/Back toggle */}
      <div className="seg" style={{ marginBottom: 12 }}>
        <button className={`seg-btn ${view === "front" ? "on" : ""}`} onClick={() => setView("front")}>Front View</button>
        <button className={`seg-btn ${view === "back"  ? "on" : ""}`} onClick={() => setView("back")}>Back View</button>
      </div>

      {/* SVG diagram */}
      <div className="card" style={{ display: "flex", justifyContent: "center", padding: "20px 8px", marginBottom: 12 }}>
        {isPaed
          ? (view === "front"
              ? <PaedFront  sel={selectedRegions} toggle={onToggle} regions={regions} />
              : <PaedBack   sel={selectedRegions} toggle={onToggle} regions={regions} />)
          : (view === "front"
              ? <AdultFront sel={selectedRegions} toggle={onToggle} />
              : <AdultBack  sel={selectedRegions} toggle={onToggle} />)
        }
      </div>

      {/* Selected chips */}
      {selectedRegions.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 10 }}>Selected Regions</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selectedRegions.map((id) => {
              const r = regions.find((b) => b.id === id);
              return (
                <span key={id} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "var(--danger-light)", border: "1px solid var(--danger-mid)",
                  borderRadius: 99, padding: "4px 10px",
                  fontSize: 12, fontWeight: 600, color: "var(--danger)",
                }}>
                  {r?.label} {r?.pct % 1 === 0 ? r?.pct : r?.pct.toFixed(1)}%
                  <button onClick={() => onToggle(id)} style={{
                    background: "none", border: "none", color: "var(--danger)",
                    cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0,
                  }}>×</button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
