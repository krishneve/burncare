// ─────────────────────────────────────────────────────────
// lib/supabase.js
// ─────────────────────────────────────────────────────────

// ── STEP 1: paste your Supabase credentials here ─────────
export const SUPABASE_URL     = "https://alwmrizpsrqbawzkhzls.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsd21yaXpwc3JxYmF3emtoemxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTUwMTMsImV4cCI6MjA4ODk3MTAxM30.RKtHrI82UjBUxc-tosBfJ8JeaFctdqZVTIZFlmwoPYg";

// ─────────────────────────────────────────────────────────
// EXACT columns that exist in the `patients` DB table.
// Any JS field NOT in this list is stripped before sending
// to Supabase — unknown columns cause silent insert failures.
// ─────────────────────────────────────────────────────────
const PATIENT_DB_COLUMNS = new Set([
  "id", "name", "age", "weight",
  "burn_time", "burn_type", "patient_type",
  "tbsa", "selected_regions",
  "total_fluid", "first_8h", "next_16h",
  "drip_rate", "hourly_rate", "drop_factor",
  "status", "ward", "bed_number",
  "_alert", "_alert_time", "added_by", "added_by_designation", "drip_rate_p2", "hourly_rate_p2",
  "created_at", "updated_at",
]);

// Strip every field NOT in the whitelist, and rename
// JS camelCase fields to snake_case DB column names.
function toDbRow(patient) {
  const row = {};
  for (const key of PATIENT_DB_COLUMNS) {
    // _alertTime (JS) → _alert_time (DB)
    if (key === "_alert_time") {
      row._alert_time = patient._alertTime ?? patient._alert_time ?? null;
    } else if (key in patient) {
      row[key] = patient[key];
    }
  }
  return row;
}

// Rename _alert_time (DB) → _alertTime (JS) on read
function fromDbRow(row) {
  const p = { ...row };
  if ("_alert_time" in p) {
    p._alertTime = p._alert_time;
    delete p._alert_time;
  }
  return p;
}

// ── Configured? ───────────────────────────────────────────
const isConfigured = () =>
  SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

// ── Low-level fetch ───────────────────────────────────────
async function sbFetch(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(options.headers || {}),
    },
  });

  let data = null;
  if (res.status !== 204) {
    try { data = await res.json(); } catch (_) {}
  }

  if (!res.ok) {
    // Log the full error so you can see it in browser console
    console.error(`[Supabase] ${res.status} on ${path}`, data);
    throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

// ── REST helpers ──────────────────────────────────────────
export const supabase = {
  from(table) {
    return {
      async selectAll(orderBy = "created_at.desc") {
        return sbFetch(`/${table}?select=*&order=${orderBy}`, {
          headers: { Prefer: "return=representation" },
        });
      },
      async selectWhere(column, value, orderBy = "created_at.desc") {
        return sbFetch(
          `/${table}?select=*&${column}=eq.${encodeURIComponent(value)}&order=${orderBy}`,
          { headers: { Prefer: "return=representation" } }
        );
      },
      async insert(row) {
        return sbFetch(`/${table}`, {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(row),
        });
      },
      async upsert(row) {
        return sbFetch(`/${table}`, {
          method: "POST",
          headers: {
            Prefer: "return=representation,resolution=merge-duplicates",
            "on-conflict": "id",
          },
          body: JSON.stringify(row),
        });
      },
      async update(patch, id) {
        return sbFetch(`/${table}?id=eq.${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(patch),
        });
      },
      async delete(id) {
        return sbFetch(`/${table}?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      },
    };
  },
};

// ── DB Layer ──────────────────────────────────────────────
export const DB = {

  // ── Patients ──────────────────────────────────────────
  async getPatients() {
    if (isConfigured()) {
      try {
        const rows = await supabase.from("patients").selectAll("created_at.desc");
        if (Array.isArray(rows)) {
          const patients = rows.map(fromDbRow);
          localStorage.setItem("drip_patients", JSON.stringify(patients));
          return patients;
        }
      } catch (e) {
        console.error("[DB.getPatients] Supabase failed:", e.message);
      }
    }
    const raw = localStorage.getItem("drip_patients");
    return raw ? JSON.parse(raw) : [];
  },

  async savePatient(patient) {
    const now = new Date().toISOString();
    const record = { ...patient, updated_at: now };

    // 1. Save to localStorage immediately (works offline too)
    const all = JSON.parse(localStorage.getItem("drip_patients") || "[]");
    const idx = all.findIndex((p) => p.id === record.id);
    if (idx >= 0) all[idx] = record;
    else all.unshift({ ...record, created_at: now });
    localStorage.setItem("drip_patients", JSON.stringify(all));

    // 2. Sync to Supabase — use UPSERT so insert & update are one call
    if (isConfigured()) {
      try {
        const dbRow = toDbRow({ ...record, created_at: record.created_at || now });
        console.log("[DB.savePatient] Upserting to Supabase:", dbRow); // visible in browser console
        await supabase.from("patients").upsert(dbRow);
        console.log("[DB.savePatient] ✓ Supabase upsert succeeded");
      } catch (e) {
        console.error("[DB.savePatient] Supabase failed — data is still in localStorage:", e.message);
      }
    } else {
      console.warn("[DB.savePatient] Supabase not configured — data saved to localStorage only");
    }

    return record;
  },

  async deletePatient(id) {
    const all = JSON.parse(localStorage.getItem("drip_patients") || "[]");
    localStorage.setItem("drip_patients", JSON.stringify(all.filter((p) => p.id !== id)));
    localStorage.removeItem(`drip_urine_${id}`);
    if (isConfigured()) {
      try {
        await supabase.from("patients").delete(id);
      } catch (e) {
        console.error("[DB.deletePatient] Supabase failed:", e.message);
      }
    }
  },

  // ── Urine Logs ────────────────────────────────────────
  async getUrineLogs(patientId) {
    if (isConfigured()) {
      try {
        const rows = await supabase.from("urine_logs").selectWhere("patient_id", patientId, "logged_at.desc");
        if (Array.isArray(rows)) {
          localStorage.setItem(`drip_urine_${patientId}`, JSON.stringify(rows));
          return rows;
        }
      } catch (e) {
        console.error("[DB.getUrineLogs] Supabase failed:", e.message);
      }
    }
    const raw = localStorage.getItem(`drip_urine_${patientId}`);
    return raw ? JSON.parse(raw) : [];
  },

  async logUrine(patientId, volumeMl, note = "") {
    const log = {
      id: crypto.randomUUID(),
      patient_id: patientId,
      volume_ml: volumeMl,
      logged_at: new Date().toISOString(),
      notes: note,
    };
    const logs = JSON.parse(localStorage.getItem(`drip_urine_${patientId}`) || "[]");
    logs.unshift(log);
    localStorage.setItem(`drip_urine_${patientId}`, JSON.stringify(logs));
    if (isConfigured()) {
      try {
        await supabase.from("urine_logs").insert(log);
        console.log("[DB.logUrine] ✓ Urine log saved to Supabase");
      } catch (e) {
        console.error("[DB.logUrine] Supabase failed:", e.message);
      }
    }
    return log;
  },

  // ── Users ─────────────────────────────────────────────
  async getUser(userId) {
    if (!isConfigured()) return null;
    try {
      const rows = await supabase.from("users").selectWhere("user_id", userId);
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    } catch (e) {
      console.error("[DB.getUser] failed:", e.message);
      return null;
    }
  },

  async createUser(user) {
    if (!isConfigured()) throw new Error("Supabase not configured");
    const row = await supabase.from("users").insert(user);
    return Array.isArray(row) ? row[0] : user;
  },

  async getAllUsers() {
    if (!isConfigured()) return [];
    try {
      const rows = await supabase.from("users").selectAll("created_at.asc");
      return Array.isArray(rows) ? rows : [];
    } catch (e) {
      console.error("[DB.getAllUsers] failed:", e.message);
      return [];
    }
  },

  async deleteUser(id) {
    if (!isConfigured()) return;
    try {
      await supabase.from("users").delete(id);
    } catch (e) {
      console.error("[DB.deleteUser] failed:", e.message);
    }
  },
};
