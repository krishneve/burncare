// ─────────────────────────────────────────────────────────
// hooks/useAuth.js
// Manages auth session — persists to localStorage so user
// stays logged in across page refreshes.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { signOut } from "../screens/AuthScreen";

const SESSION_KEY = "drip_session";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch (_) {}
    setAuthLoading(false);
  }, []);

  function handleAuth(userData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    setUser(userData);
  }

  async function handleSignOut() {
    try {
      if (user?.accessToken) await signOut(user.accessToken);
    } catch (_) {}
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return { user, authLoading, handleAuth, handleSignOut };
}
