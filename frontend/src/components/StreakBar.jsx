import React, { useMemo } from "react";
function formatDayLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: "short" }); 
}

export default function StreakBar({ events = [] }) {

  const countsByDate = useMemo(() => {
    const m = {};
    for (const ev of events) {
      if (!ev?.date) continue;
      m[ev.date] = (m[ev.date] || 0) + 1;
    }
    return m;
  }, [events]);


  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        date: iso,
        label: formatDayLabel(d),
        dayNum: d.getDate(),
        count: countsByDate[iso] || 0,
      });
    }
    return out;
  }, [countsByDate]);

  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);

 
  const spark = useMemo(() => {
    const w = 140; 
    const h = 36;  
    const pad = 4;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    const points = days.map((d, i) => {
      const x = pad + (i / Math.max(1, days.length - 1)) * innerW;
 
      const y = pad + (1 - (d.count / Math.max(1, maxCount))) * innerH;
      return `${x},${y}`;
    }).join(" ");
  
    return { w, h, pad, points };
  }, [days, maxCount]);

  const barWidthPct = (count) => Math.round((count / maxCount) * 100);

  return (
    <div className="card" style={{ padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Activity (last 7 days)</div>
        <div style={{ fontSize: 13, color: "#666" }}>{total} activities</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <svg width={spark.w} height={spark.h} viewBox={`0 0 ${spark.w} ${spark.h}`} aria-hidden>
      
          <defs>
            <linearGradient id="gradSpark" x1="0" x2="1">
              <stop offset="0%" stopColor="#ffd89b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ff9900" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          <polyline
            points={`${spark.points} ${spark.w - spark.pad},${spark.h - spark.pad} ${spark.pad},${spark.h - spark.pad}`}
            fill="url(#gradSpark)"
            fillOpacity="0.12"
            stroke="none"
          />

          <polyline
            points={spark.points}
            fill="none"
            stroke="url(#gradSpark)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.06))" }}
          />

          {days.map((d, i) => {
            const coords = spark.points.split(" ")[i];
            if (!coords) return null;
            const [cx, cy] = coords.split(",").map(Number);
            return <circle key={d.date} cx={cx} cy={cy} r={2.2} fill="#ff9900" />;
          })}
        </svg>

        <div style={{ fontSize: 12, color: "#666" }}>
          <div style={{ fontWeight: 600 }}>{total} total</div>
          <div style={{ fontSize: 12 }}>Max/day: {maxCount}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {days.map((d) => (
          <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 56, textAlign: "left", fontSize: 13 }}>
              <div style={{ fontWeight: 700 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{d.dayNum}</div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ height: 12, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${barWidthPct(d.count)}%`,
                    background: "linear-gradient(90deg, #ffd89b, #ff9900)",
                    transition: "width 300ms ease",
                  }}
                />
              </div>
            </div>

            <div style={{ width: 40, textAlign: "right", fontSize: 13, color: "#333" }}>{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
