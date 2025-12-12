import React, { useEffect, useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const loadSkills = async () => {
    try {
      const res = await API.get("/skills/");
      setSkills(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load skills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);
  const filteredSkills = skills
    .filter((s) =>
      (s.name || "").toLowerCase().includes(query.toLowerCase())
    )
    .filter((s) =>
      progressFilter === "all" ? true : s.progress === progressFilter
    )
    .sort((a, b) => {
      if (sortBy === "recent") return b.id - a.id;
      if (sortBy === "difficulty") return b.difficulty - a.difficulty;
      if (sortBy === "hours") return b.hours_spent - a.hours_spent;
      return 0;
    });

  return (
    <div className="page skills-page">
      <h2 className="skills-title">Your Skills</h2>

      {/* Search + Filters Container */}
      <div className="skills-controls glass-card">
        <input
          className="search"
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="select"
          value={progressFilter}
          onChange={(e) => setProgressFilter(e.target.value)}
        >
          <option value="all">All Progress</option>
          <option value="started">Started</option>
          <option value="in-progress">In-progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className="select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="recent">Newest First</option>
          <option value="difficulty">Difficulty (High → Low)</option>
          <option value="hours">Hours Spent (High → Low)</option>
        </select>
      </div>

      {loading ? (
        <div className="loader">Loading…</div>
      ) : filteredSkills.length === 0 ? (
        <div className="empty">No matching skills found.</div>
      ) : (
        <div className="grid">
          {filteredSkills.map((s) => (
            <div key={s.id} className="skill-card glass-card">
              <div className="card-top">
                <div>
                  <div className="skill-title">{s.name}</div>
                  <div className="skill-meta">
                    {s.resource_type || "—"} • {s.platform || "—"}
                  </div>
                </div>

                <div className="badges">
                  <div
                    className={`badge ${
                      s.progress === "completed"
                        ? "green"
                        : s.progress === "in-progress"
                        ? "blue"
                        : ""
                    }`}
                  >
                    {s.progress}
                  </div>

                  <div className="badge">★ {s.difficulty || 3}</div>
                </div>
              </div>

              <div className="card-body">
                {s.notes ? (
                  <p className="notes">{s.notes}</p>
                ) : (
                  <p className="notes muted">No notes</p>
                )}
              </div>

              <div className="card-footer">
                <div className="small-meta">Hours: {s.hours_spent}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
