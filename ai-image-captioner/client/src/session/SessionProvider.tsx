// session/SessionProvider.tsx
import React, { useEffect, useState } from "react";
import { SessionContext } from "./SessionContext";
import type { SessionUser } from "./SessionContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/me`, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        setUser(data?.user ?? null);
      } else {
        // Be conservative on failures: keep existing user if we have one.
        // Only drop to null if we were already unauthenticated.
        setUser((prev) => (prev ? prev : null));
      }
    } catch {
      // Network/CORS hiccup; keep the current user to avoid redirect flapping
      setUser((prev) => prev);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    load();

    // Refresh when the tab becomes visible (less aggressive than focus,
    // and won't run immediately after closing the native file dialog)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}
