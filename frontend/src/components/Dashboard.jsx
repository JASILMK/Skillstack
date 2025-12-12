import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000" });
const AI = axios.create({ baseURL: (import.meta.env.VITE_API_URL || "http://localhost:8000") + "/ai" });

import EventForm from "./EventForm";
import Timeline from "./Timeline";
import StreakBar from "./StreakBar";
function AddSkill({ onAdded }) {
  const [form, setForm] = useState({
    name: "",
    resource_type: "",
    platform: "",
    progress: "started",
    hours_spent: 0,
    difficulty: 3,
    notes: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: (name === "hours_spent" || name === "difficulty") ? Number(value) : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Please enter a skill name");
    try {
      const res = await API.post("/skills/", form);
      onAdded(res.data);
      setForm({ name: "", resource_type: "", platform: "", progress: "started", hours_spent: 0, difficulty: 3, notes: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to add skill. Check backend.");
    }
  };

  return (
    <form className="add-skill card" onSubmit={submit} aria-label="Add new skill">
      <div className="row">
        <input name="name" value={form.name} onChange={handleChange}
               placeholder="Skill name" className="input name" aria-label="Skill name" required />
        <select name="resource_type" value={form.resource_type} onChange={handleChange} className="select" aria-label="Resource type">
          <option value="">Resource type</option>
          <option value="video">Video</option>
          <option value="course">Course</option>
          <option value="article">Article</option>
        </select>
        <input name="platform" value={form.platform} onChange={handleChange}
               placeholder="Platform (e.g., Coursera)" className="input" aria-label="Platform" />
      </div>

      <div className="row">
        <select name="progress" value={form.progress} onChange={handleChange} className="select small" aria-label="Progress">
          <option value="started">Started</option>
          <option value="in-progress">In-progress</option>
          <option value="completed">Completed</option>
        </select>

        <input name="hours_spent" type="number" min="0" value={form.hours_spent} onChange={handleChange}
               placeholder="Hours" className="input small" aria-label="Hours" />
        <input name="difficulty" type="number" min="1" max="5" value={form.difficulty} onChange={handleChange}
               placeholder="Difficulty" className="input small" aria-label="Difficulty" />
        <button type="submit" className="btn primary" aria-label="Add skill">Add Skill</button>
      </div>

      <textarea name="notes" value={form.notes} onChange={handleChange}
                placeholder="Notes (optional)" rows="2" className="textarea" aria-label="Notes" />
    </form>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/skills/");
      setSkills(res.data || []);
    } catch (err) {
      console.error("Failed to load skills:", err);
      alert("Cannot load skills from backend. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await API.get("/events/");
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events:", err);
    }
  };

  useEffect(() => {
    load();
    loadEvents();
  }, []);

  const totalHours = skills.reduce((s, it) => s + (Number(it.hours_spent) || 0), 0);
  const counts = skills.reduce((acc, it) => {
    acc[it.progress] = (acc[it.progress] || 0) + 1;
    return acc;
  }, {});

  async function handleDelete(id) {
    const ok = window.confirm("Delete this skill? This action cannot be undone.");
    if (!ok) return;
    try {
      await API.delete(`/skills/${id}`);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed. Check backend.");
    }
  }

  function startEdit(skill) {
    setEditingId(skill.id);
    setEditForm({
      name: skill.name || "",
      resource_type: skill.resource_type || "",
      platform: skill.platform || "",
      progress: skill.progress || "started",
      hours_spent: skill.hours_spent || 0,
      difficulty: skill.difficulty || 3,
      notes: skill.notes || ""
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function editChange(e) {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: (name === "hours_spent" || name === "difficulty") ? Number(value) : value }));
  }

  async function saveEdit(id) {
    try {
      const payload = { ...editForm };
      const res = await API.patch(`/skills/${id}`, payload);
      if (res && res.data) setSkills(prev => prev.map(s => s.id === id ? res.data : s));
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error(err);
      alert("Save failed. Check backend.");
    }
  }


  async function handleRecommend(skillName) {
    try {
      const res = await AI.get(`/recommend/?q=${encodeURIComponent(skillName)}&top_k=3`);
      const items = res.data;
      if (!items || items.length === 0) return alert("No recommendations found.");
      const txt = items.map(r => `${r.title} — ${r.platform} (score ${r.score?.toFixed ? r.score.toFixed(2) : r.score})`).join("\n");
      alert("Top recommendations:\n\n" + txt);
    } catch (err) {
      console.error(err);
      alert("Recommendation failed.");
    }
  }

  async function handleSummarize(notes, useOpenAI = false) {
    if (!notes) return alert("No notes to summarize");
    try {
      const res = await API.post("/ai/summarize/", { text: notes, max_sentences: 2, use_openai: useOpenAI });
      alert("Summary:\n\n" + (res.data?.summary || "—"));
    } catch (err) {
      console.error(err);
      alert("Summarization failed.");
    }
  }

  const handleEventAdded = (ev) => setEvents(prev => [ev, ...prev]);
  const handleEventDeleted = (id) => setEvents(prev => prev.filter(e => e.id !== id));

  const filtered = skills.filter(s => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (s.name || "").toLowerCase().includes(q) || (s.platform || "").toLowerCase().includes(q) || (s.resource_type || "").toLowerCase().includes(q);
  });


  const goToSkillsPage = () => navigate("/skills");
  const openSkill = (id) => navigate(`/skills/${id}`);

  return (
    <div className="page">
      <div className="top" role="banner">
        <div className="brand" aria-hidden>
          <div className="logo-badge">SS</div>
          <div className="brand-text">
            <h2>SkillStack</h2>
            <div className="brand-sub">Personal skill tracker</div>
          </div>
        </div>

        <div className="search-area">
          <input className="search" placeholder="Search skills, platform, type..." value={query} onChange={e => setQuery(e.target.value)} aria-label="Search skills" />
        </div>

        <div className="cta">
          <button className="btn ghost" onClick={() => { load(); loadEvents(); }} aria-label="Refresh">Refresh</button>
        </div>
      </div>

      <div className="content">
        <aside className="sidebar" aria-labelledby="sidebar-stats">
          <div className="card stats" id="sidebar-stats" role="region" aria-label="Overview">
            <div className="stat-row">
              <div>
                <div className="stat-num">{skills.length}</div>
                <div className="stat-label">Total skills</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="stat-num">{totalHours}</div>
                <div className="stat-label">Total hours</div>
              </div>
            </div>

            <hr className="muted-hr"/>

            <div className="progress-list" aria-hidden>
              <div><span className="chip">Started</span> {counts["started"] || 0}</div>
              <div><span className="chip">In-progress</span> {counts["in-progress"] || 0}</div>
              <div><span className="chip">Completed</span> {counts["completed"] || 0}</div>
            </div>
          </div>

          <div className="card" role="note" aria-label="Quick tips">
            <h4 style={{ marginTop: 0 }}>Quick Tips</h4>
            <ul className="tips">
              <li>Add skills you want to master</li>
              <li>Use notes to store links or timestamps</li>
              <li>Try Recommend for resource suggestions</li>
            </ul>
          </div>
        </aside>

        <main className="main" role="main">
          <div className="card" aria-label="Add skill form">
            <AddSkill onAdded={(s) => setSkills(prev => [s, ...prev])} />
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <h3 style={{ marginTop: 0 }}>Add Activity / Timeline Event</h3>
            <EventForm skills={skills} onAdded={handleEventAdded} />
          </div>

    
          <div className="timeline-area" style={{ marginTop: 12 }}>
            <div className="activity-card" aria-label="Activity (7 days)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <strong>Activity (7 days)</strong>
                <button className="btn outline small" onClick={goToSkillsPage} aria-label="View all skills">View all</button>
              </div>

              <div className="streakbar" aria-hidden>
                <StreakBar events={events} />
              </div>

              <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
                {events.length === 0 ? "No recent activity" : (
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {events.slice(0, 7).map(ev => <li key={ev.id}>{ev.date}: {ev.title}</li>)}
                  </ul>
                )}
              </div>
            </div>

            <div className="timeline-card" aria-label="Timeline">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong>Timeline</strong>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{events.length} events</div>
              </div>
              <Timeline events={events} onDelete={handleEventDeleted} />
            </div>
          </div>

        
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <h3 className="section-title" style={{ margin: 0 }}>Your Skills</h3>
            <div>
              <button className="btn outline" onClick={goToSkillsPage} aria-label="Open skills page">Open skills page</button>
            </div>
          </div>

        
          <div className="skills-area" aria-label="Skills area">
            <div /> 
            <div className="grid" role="list" aria-label="Skill cards">
              {loading && <div className="loader">Loading…</div>}
              {!loading && filtered.length === 0 && <div className="empty">No skills yet — add your first one!</div>}

              {filtered.map(s => (
                <article
                  id={`skill-${s.id}`}
                  key={s.id}
                  className="skill-card"
                  role="listitem"
                  tabIndex={0}
                  onClick={() => openSkill(s.id)}
                  onKeyDown={(e) => { if (e.key === "Enter") openSkill(s.id); }}
                  aria-label={`Open skill ${s.name}`}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-top">
                    <div>
                      {editingId === s.id ? (
                        <input name="name" value={editForm.name} onChange={editChange} className="input" />
                      ) : (
                        <div className="skill-title">{s.name}</div>
                      )}
                      {editingId === s.id ? (
                        <div style={{ marginTop: 6 }}>
                          <input name="resource_type" value={editForm.resource_type} onChange={editChange} placeholder="Resource type" className="input small" />
                          <input name="platform" value={editForm.platform} onChange={editChange} placeholder="Platform" className="input small" />
                        </div>
                      ) : (
                        <div className="skill-meta">{s.resource_type || "—"} • {s.platform || "—"}</div>
                      )}
                    </div>

                    <div className="badges" onClick={e => e.stopPropagation()}>
                      {editingId === s.id ? (
                        <select name="progress" value={editForm.progress} onChange={editChange} className="select small">
                          <option value="started">Started</option>
                          <option value="in-progress">In-progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      ) : (
                        <div className={`badge ${s.progress === "completed" ? "green" : s.progress === "in-progress" ? "blue" : ""}`}>{s.progress}</div>
                      )}

                      {editingId === s.id ? (
                        <input name="difficulty" value={editForm.difficulty} onChange={editChange} type="number" min="1" max="5" className="input small" />
                      ) : (
                        <div className="badge">★ {s.difficulty || 3}</div>
                      )}
                    </div>
                  </div>

                  <div className="card-body">
                    {editingId === s.id ? (
                      <textarea name="notes" value={editForm.notes} onChange={editChange} className="textarea" rows={3} />
                    ) : (
                      s.notes ? <p className="notes">{s.notes}</p> : <p className="notes muted">No notes</p>
                    )}
                  </div>

                  <div className="card-footer" onClick={e => e.stopPropagation()}>
                    <div className="small-meta">Hours: {editingId === s.id ? <input name="hours_spent" value={editForm.hours_spent} onChange={editChange} type="number" className="input small" /> : (s.hours_spent || 0)}</div>
                    <div className="actions">
                      {editingId === s.id ? (
                        <>
                          <button className="btn primary" onClick={() => saveEdit(s.id)}>Save</button>
                          <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn outline" onClick={() => handleRecommend(s.name)}>Recommend</button>
                          {s.notes && <button className="btn outline" onClick={() => handleSummarize(s.notes, false)}>Summarize</button>}
                          <button className="btn outline" onClick={() => startEdit(s)}>Edit</button>
                          <button className="btn outline" onClick={() => handleDelete(s.id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
