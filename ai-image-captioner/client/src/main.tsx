import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import EditorPage from "./pages/EditorPage";
import SharePage from "./pages/SharePage";
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
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);