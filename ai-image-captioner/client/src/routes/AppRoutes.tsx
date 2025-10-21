import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./RequireAuth";
import GuestOnly from "./GuestOnly";

import HomePage from "../pages/HomePage";
import WorkspacePage from "../pages/WorkspacePage";
import EditorPage from "../pages/EditorPage";
import SharePage from "../pages/SharePage";
import UploadPage from "../pages/UploadPage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/product" />

      {/* Auth-only */}
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />

      {/* Private */}
      <Route
        path="/upload"
        element={
          <RequireAuth>
            <UploadPage />
          </RequireAuth>
        }
      />
      <Route
        path="/workspace"
        element={
          <RequireAuth>
            <WorkspacePage />
          </RequireAuth>
        }
      />
      <Route
        path="/editor"
        element={
          <RequireAuth>
            <EditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/share"
        element={
          <RequireAuth>
            <SharePage />
          </RequireAuth>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
