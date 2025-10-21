import React, { createContext, useContext, useEffect, useState } from "react";

type SessionUser = { id?: string; name?: string | null; email?: string | null } | null;

type SessionCtx = {
  user: SessionUser;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
});

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5000";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/me`, { credentials: "include" });
      if (!res.ok) {
        setUser(null);
      } else {
        const data = await res.json();
        setUser(data?.user ?? null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading, refresh: load }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
