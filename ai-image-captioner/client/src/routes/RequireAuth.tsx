import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../session/useSession";
import FullscreenLoader from "./FullscreenLoader";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, hydrated } = useSession();
  const location = useLocation();

  const mode =
    import.meta.env.MODE ||
    import.meta.env.VITE_MODE ||
    import.meta.env.VITE_E2E ||
    "production";

  if (mode === "e2e" || import.meta.env.VITE_E2E === "true") {
    return <>{children}</>;
  }

  if (!hydrated || loading) return <FullscreenLoader />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
