import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../session/useSession";
import FullscreenLoader from "./FullscreenLoader";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
