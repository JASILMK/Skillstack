
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./components/Dashboard";
import SkillsPage from "./pages/SkillsPage";
import Home from "./pages/Home";           // <-- new
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ background: "#f6f7fb", minHeight: "100vh" }}>
        <div className="glow-ribbon-wrapper" aria-hidden>
          <div className="glow-ribbon">
            <div className="ribbon-icon">SS</div>
          </div>
        </div>

        <div className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skills" element={<SkillsPage />} />
            {/* fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
