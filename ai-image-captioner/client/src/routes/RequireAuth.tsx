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

  // In e2e/dev bypass, don't gate at all
  if (mode === "e2e" || import.meta.env.VITE_E2E === "true") {
    // console.log(`[RequireAuth] Bypassing auth (mode=${mode})`);
    return <>{children}</>;
  }

  // Only block rendering before we've finished the first hydration
  if (!hydrated || loading) return <FullscreenLoader />;

  // After hydration, never redirect based on transient background failures
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
