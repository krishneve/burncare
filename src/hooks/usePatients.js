// ─────────────────────────────────────────────────────────
// hooks/usePatients.js
// Central state management for all patient data
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { DB } from "../lib/supabase";

export default function usePatients() {
  const [patients, setPatients]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState(null);

  // ── Load all patients on mount ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    DB.getPatients()
      .then((data) => { if (!cancelled) { setPatients(data); setLoading(false); } })
      .catch((err)  => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  // ── Poll every 30 s for real-time feel ─────────────────
  useEffect(() => {
    const id = setInterval(() => {
      DB.getPatients().then(setPatients).catch(() => {});
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Save / update a patient ────────────────────────────
  const savePatient = useCallback(async (patient) => {
    const saved = await DB.savePatient(patient);
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    return saved;
  }, []);

  // ── Delete a patient ───────────────────────────────────
  const deletePatient = useCallback(async (id) => {
    await DB.deletePatient(id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Alert count (critical TBSA or flagged) ─────────────
  const alertCount = patients.filter((p) => p.tbsa >= 40 || p._alert).length;

  return { patients, loading, error, savePatient, deletePatient, alertCount };
}
