"use client";

import { useEffect, useState } from "react";

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

const fmtDuration = (sec) =>
  sec ? `${Math.round(sec / 60)} min` : null;

// Set data is reps-per-set (numbers) in current sessions; the very first
// sessions stored booleans. Render both.
function setSummary(ex) {
  if (!Array.isArray(ex.sets)) return "";
  if (typeof ex.sets[0] === "boolean") {
    return `${ex.sets.filter(Boolean).length}/${ex.sets.length} sets`;
  }
  return ex.sets.map((r) => r).join(" · ") + ` of ${ex.reps}`;
}

export default function Archive() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then(setData);
  }, []);

  if (!data) return <div className="app"><div className="spin">Loading the book…</div></div>;

  const totalSessions = data.sessions.length;
  const streakDates = new Set(data.sessions.map((s) => s.date));

  return (
    <div className="app">
      <div className="brand">Bounce not Crumble</div>
      <h1>The archive</h1>
      <div className="date">
        {totalSessions} workout{totalSessions === 1 ? "" : "s"} in the books
        {data.activityLog.length > 0 ? ` · +${data.activityLog.length} runs/tennis` : ""}
      </div>

      {totalSessions === 0 && (
        <div className="card"><p className="dim">Nothing yet — today&apos;s a good day to start one.</p></div>
      )}

      {data.sessions.map((s) => (
        <div className="card" key={s.id}>
          <div
            className="ex-head"
            onClick={() => setOpen(open === s.id ? null : s.id)}
            style={{ cursor: "pointer" }}
          >
            <span className="ex-name" style={{ fontSize: 16 }}>
              {fmtDate(s.date)} — {s.dayType === "packed" ? "Packed" : "Full"}
              {s.meatware ? " 🥩" : ""}
              {s.flexibility ? " +mobility" : ""}
            </span>
            <span className="ex-dose">
              {s.completion}%{fmtDuration(s.durationSec) ? ` · ${fmtDuration(s.durationSec)}` : ""} · knee {s.knee}
            </span>
          </div>

          {open === s.id && (
            <div style={{ marginTop: 10 }}>
              {(s.exercises || []).map((ex) => (
                <div key={ex.id} style={{ marginBottom: 8 }}>
                  <div className="ex-head">
                    <span style={{ fontSize: 14 }}>{ex.name}</span>
                    <span className="ex-dose">
                      {setSummary(ex)}
                      {ex.weight ? ` · ${ex.weight} lb` : ""}
                      {s.reasons?.[ex.id] ? ` · stopped: ${s.reasons[ex.id].replace("_", " ")}` : ""}
                    </span>
                  </div>
                  {ex.note && <div className="changed">✎ {ex.note}</div>}
                </div>
              ))}
              {s.dump && (
                <div className="changed" style={{ marginTop: 6 }}>
                  <strong>You:</strong> {s.dump}
                </div>
              )}
              {s.observation && (
                <div className="changed" style={{ marginTop: 6 }}>
                  <strong>The brain:</strong> {s.observation}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <a className="chip" href="/">← Back to today</a>
    </div>
  );
}
