import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../session/useSession";
import FullscreenLoader from "./FullscreenLoader";

export default function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return <FullscreenLoader />;
  if (user) {
    const from = (location.state as any)?.from?.pathname ?? "/workspace";
    return <Navigate to={from} replace />;
  }
  return <>{children}</>;
}
