import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-root">
      <div className="home-left-decor" aria-hidden>
        <div className="home-ribbon">
          <div className="ribbon-icon">SS</div>
          <div className="ribbon-dots" aria-hidden>
            <span/><span/><span/><span/>
          </div>
        </div>
      </div>

      <header className="home-hero">
        <div className="home-inner">
          <div className="home-brand">
            <div className="home-logo-badge">SS</div>
            <div>
              <h1 className="home-title">SkillStack</h1>
              <p className="home-sub">Personal skill tracker — build, practice, and grow.</p>
            </div>
          </div>

          <div className="home-cta-row">
            <button
              className="btn primary btn-hero"
              onClick={() => navigate("/dashboard")}
              aria-label="Go to dashboard"
            >
              Go to Dashboard
            </button>

            <button
              className="btn ghost"
              onClick={() => navigate("/skills")}
              aria-label="Open skills page"
            >
              View All Skills
            </button>
          </div>

          <p className="home-footnote">Tip: use the search bar in Dashboard to quickly find skills.</p>
        </div>
      </header>
    </div>
  );
}
