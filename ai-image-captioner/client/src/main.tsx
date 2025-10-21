import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./session"; // <-- add
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
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  </React.StrictMode>
);
