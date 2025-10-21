import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import EditorPage from "./pages/EditorPage";
import SharePage from "./pages/SharePage";
import UploadPage from "./pages/UploadPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Home page */}
        <Route path="/" element={<HomePage />} />

        {/* Workspace page */}
        <Route path="/workspace" element={<WorkspacePage />} />

        {/* Editor page */}
        <Route path="/editor" element={<EditorPage />} />

        {/* Share page */}
        <Route path="/share" element={<SharePage />} />

        {/* Upload page */}
        <Route path="/upload" element={<UploadPage />} />

        {/* Login page */}
        <Route path="/login" element={<LoginPage />} />

        {/* Sign-up page */}
        <Route path="/signup" element={<SignupPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);