import React, { useCallback, useEffect, useRef, useState } from "react";
import { SessionContext } from "./SessionContext";
import type { SessionUser } from "./SessionContext";

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const inFlight = useRef<AbortController | null>(null);
  const lastRefreshAt = useRef<number>(0);

  const fetchMe = useCallback(async (signal: AbortSignal) => {
    const res = await fetch(`${SERVER_URL}/api/me`, { credentials: "include", signal });
    if (!res.ok) throw new Error(`/api/me ${res.status}`);
    return (await res.json()) as { user?: SessionUser };
  }, []);

  const refresh = useCallback(
    async ({ blocking = false }: { blocking?: boolean } = {}) => {
      const now = Date.now();
      if (!blocking && now - lastRefreshAt.current < 10_000) return;

      lastRefreshAt.current = now;

      if (inFlight.current) inFlight.current.abort();
      const ac = new AbortController();
      inFlight.current = ac;

      try {
        if (blocking) setLoading(true);
        const data = await fetchMe(ac.signal);
        setUser(data?.user ?? null);
      } catch {
      } finally {
        if (blocking) setLoading(false);
        setHydrated(true);
        if (inFlight.current === ac) inFlight.current = null;
      }
    },
    [fetchMe]
  );

  useEffect(() => {
    void refresh({ blocking: true });
  }, [refresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh({ blocking: false });
      }
    };
    const onFocus = () => void refresh({ blocking: false });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      if (inFlight.current) inFlight.current.abort();
    };
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ user, loading, hydrated, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}
