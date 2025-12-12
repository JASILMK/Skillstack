import React, { useState } from "react";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export default function EventForm({ skills = [], onAdded }) {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    skill_id: "",
    title: "",
    date: today,
    duration_minutes: 30,
    notes: "",
  });

  function change(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "duration_minutes" ? Number(value) : value,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Please enter an activity title");
      return;
    }

    try {
      const payload = {
        skill_id: form.skill_id ? Number(form.skill_id) : null,
        title: form.title,
        date: form.date,
        duration_minutes: form.duration_minutes,
        notes: form.notes,
      };

      const res = await API.post("/events/", payload);
      onAdded && onAdded(res.data); 

      setForm({
        skill_id: "",
        title: "",
        date: today,
        duration_minutes: 30,
        notes: "",
      });
    } catch (err) {
      console.error(err);
      alert("Failed to add event. Check backend.");
    }
  }

  return (
    <form className="event-form" onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <select
          name="skill_id"
          value={form.skill_id}
          onChange={change}
          className="select small"
        >
          <option value="">(No skill)</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          name="title"
          value={form.title}
          onChange={change}
          placeholder="Activity title (e.g., Watched Lecture 3)"
          className="input"
        />

        <input
          name="date"
          type="date"
          value={form.date}
          onChange={change}
          className="input small"
        />

        <input
          name="duration_minutes"
          type="number"
          min="0"
          value={form.duration_minutes}
          onChange={change}
          className="input small"
        />

        <button className="btn primary" type="submit">
          Add
        </button>
      </div>

      <textarea
        name="notes"
        value={form.notes}
        onChange={change}
        placeholder="Notes (optional)"
        className="textarea"
        rows={2}
      />
    </form>
  );
}
