import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../session/useSession";
import FullscreenLoader from "./FullscreenLoader";

interface LocationState {
  from?: { pathname: string };
}

export default function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();
  const state = location.state as LocationState | null; 

  if (loading) return <FullscreenLoader />;

  if (user) {
    const from = state?.from?.pathname ?? "/workspace";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
