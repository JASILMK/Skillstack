import React from "react";
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export default function Timeline({ events = [], onDelete }) {
  // Group events by date
  const grouped = events.reduce((acc, ev) => {
    (acc[ev.date] = acc[ev.date] || []).push(ev);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)); // newest first

  return (
    <div style={{ marginTop: 10 }}>
      {dates.length === 0 && (
        <div style={{ padding: 10, color: "#666" }}>No activities yet.</div>
      )}

      {dates.map((date) => (
        <div key={date} style={{ marginBottom: 16 }}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 6,
              color: "#111",
              fontSize: 15,
            }}
          >
            {date}
          </div>

          {grouped[date].map((ev) => (
            <div
              key={ev.id}
              style={{
                background: "#fff",
                border: "1px solid #e6e9ef",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <strong>{ev.title}</strong>
                <span style={{ fontSize: 12, color: "#555" }}>
                  {ev.duration_minutes} min
                </span>
              </div>

              {ev.notes && (
                <div style={{ fontSize: 13, color: "#444", marginBottom: 8 }}>
                  {ev.notes}
                </div>
              )}

              <button
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 12,
                }}
                onClick={async () => {
                  if (!confirm("Delete this event?")) return;
                  try {
                    await API.delete(`/events/${ev.id}`);
                    onDelete && onDelete(ev.id);
                  } catch (err) {
                    console.error(err);
                    alert("Delete failed.");
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
