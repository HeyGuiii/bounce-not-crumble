"use client";

// Progress page (phase 2, Eddie's ask 2026-10-02): "I forget when weight or
// reps increase for each exercise, probably good to see." One chart per
// measure, one axis each (never dual-axis), markers only where the number
// jumped and at the latest point, tap a point for its value, table view per
// movement. Single series everywhere, so no legends.

import { useEffect, useMemo, useState } from "react";
import { byId, ALL_BY_ID } from "../../lib/library.js";
import { TEST_ITEMS, symmetry } from "../../lib/tests.js";

const fmtShort = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const topSet = (ex) => {
  if (!Array.isArray(ex.sets) || !ex.sets.length) return ex.reps ?? 0;
  if (typeof ex.sets[0] === "boolean") return ex.reps ?? 0;
  return Math.max(...ex.sets.map((n) => Number(n) || 0));
};

const unitWord = (loadMode) =>
  loadMode === "perHand" ? "lb per hand" : loadMode === "ruck" ? "lb (ruck)" : "lb";

// ── Tiny line chart: single series, hairline grid, 2px line, 8px markers at
// jumps and the last point with a surface ring, tap for value. ──────────────
function MiniLine({ points, unit, id }) {
  const [sel, setSel] = useState(null);
  const W = 320, H = 84, padL = 30, padR = 12, padT = 12, padB = 18;
  const ys = points.map((p) => p.y);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const lo = minY === maxY ? minY - 1 : minY;
  const hi = minY === maxY ? maxY + 1 : maxY;
  const x = (i) => padL + (points.length === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (points.length - 1));
  const y = (v) => padT + ((hi - v) * (H - padT - padB)) / (hi - lo);
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(" ");
  const jumps = new Set(points.map((p, i) => (i > 0 && p.y > points[i - 1].y ? i : -1)).filter((i) => i >= 0));
  jumps.add(points.length - 1);
  const mid = (lo + hi) / 2;
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} over time`}>
        <line className="grid" x1={padL} x2={W - padR} y1={y(hi)} y2={y(hi)} />
        <line className="grid" x1={padL} x2={W - padR} y1={y(mid)} y2={y(mid)} />
        <line className="grid" x1={padL} x2={W - padR} y1={y(lo)} y2={y(lo)} />
        <text className="lbl" x={padL - 4} y={y(hi) + 3} textAnchor="end">{hi}</text>
        <text className="lbl" x={padL - 4} y={y(lo) + 3} textAnchor="end">{lo}</text>
        <path className="line" d={d} />
        {points.map((p, i) =>
          jumps.has(i) ? (
            <g key={i}>
              <circle className={`dot ${sel === i ? "sel" : ""}`} cx={x(i)} cy={y(p.y)} r={4} />
              {i !== points.length - 1 && (
                <text className="lbl val" x={x(i)} y={y(p.y) - 7} textAnchor="middle">{p.y}</text>
              )}
            </g>
          ) : null
        )}
        <text className="lbl" x={padL} y={H - 4}>{fmtShort(points[0].x)}</text>
        <text className="lbl" x={W - padR} y={H - 4} textAnchor="end">{fmtShort(points[points.length - 1].x)}</text>
        {points.map((p, i) => (
          <rect
            key={`h${i}`}
            className="hit"
            x={x(i) - (W - padL - padR) / (2 * Math.max(1, points.length - 1))}
            y={0}
            width={(W - padL - padR) / Math.max(1, points.length - 1)}
            height={H}
            onClick={() => setSel(sel === i ? null : i)}
          />
        ))}
      </svg>
      <div className="chart-tip">
        {sel != null ? `${fmtShort(points[sel].x)} · ${points[sel].y} ${unit}${points[sel].extra ? ` · ${points[sel].extra}` : ""}` : ""}
      </div>
    </>
  );
}

function MovementCard({ id, rows }) {
  const [table, setTable] = useState(false);
  const m = ALL_BY_ID[id] || { name: rows[0].name, loadMode: "none" };
  const loadPts = rows.filter((r) => r.weight != null).map((r) => ({ x: r.date, y: r.weight, extra: `${r.sets} sets, top ${r.top}` }));
  const repPts = rows.map((r) => ({ x: r.date, y: r.top, extra: r.weight != null ? `${r.weight} lb` : "bodyweight" }));
  const last = rows[rows.length - 1];
  const jumps = [];
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (b.weight != null && a.weight != null && b.weight > a.weight) jumps.push(`${fmtShort(b.date)}: load ${a.weight} → ${b.weight}`);
    else if (b.weight != null && a.weight == null) jumps.push(`${fmtShort(b.date)}: loaded at ${b.weight}`);
    if (b.top > a.top) jumps.push(`${fmtShort(b.date)}: reps ${a.top} → ${b.top}`);
  }
  const unit = unitWord(m.loadMode);
  return (
    <div className="card">
      <div className="ex-head">
        <span className="ex-name" style={{ fontSize: 16 }}>{m.name}</span>
        <span className="ex-dose">{rows.length}×</span>
      </div>
      <div className="dim">
        Last {fmtShort(last.date)}: {last.sets}×{last.top}{last.weight != null ? ` @ ${last.weight} ${unit}` : " bodyweight"}
      </div>
      {loadPts.length >= 2 && (
        <>
          <div className="chart-title"><span>Load ({unit})</span><span>{loadPts[0].y} → {loadPts[loadPts.length - 1].y}</span></div>
          <MiniLine points={loadPts} unit={unit} id={`${id}-w`} />
        </>
      )}
      <div className="chart-title"><span>Top set ({(m.unit || "reps").replace("/side", " per side")})</span><span>{repPts[0].y} → {repPts[repPts.length - 1].y}</span></div>
      <MiniLine points={repPts} unit={(m.unit || "reps").split("/")[0]} id={`${id}-r`} />
      {jumps.length > 0 && (
        <div className="jumps">
          {jumps.slice(-6).map((j, i) => <div key={i}>↑ <b>{j.split(":")[0]}</b>:{j.split(":").slice(1).join(":")}</div>)}
        </div>
      )}
      <button className="linkish" style={{ marginTop: 8 }} onClick={() => setTable(!table)}>
        {table ? "hide table" : "table view"}
      </button>
      {table && (
        <table className="plain">
          <thead><tr><th>Date</th><th>Sets</th><th>Top</th><th>Load</th></tr></thead>
          <tbody>
            {rows.slice().reverse().map((r) => (
              <tr key={r.date + r.sid}><td>{fmtShort(r.date)}</td><td>{r.sets}</td><td>{r.top}</td><td>{r.weight ?? "—"}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Progress() {
  const [data, setData] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const sessions = data.sessions.slice().reverse().filter((s) => s.dayType !== "test"); // oldest first
    const byMove = {};
    for (const s of sessions) {
      for (const ex of s.exercises || []) {
        if (!byMove[ex.id]) byMove[ex.id] = [];
        byMove[ex.id].push({
          sid: s.id, date: s.date, name: ex.name, sets: Array.isArray(ex.sets) ? ex.sets.length : 3,
          top: topSet(ex), weight: s.meatware ? null : ex.weight ?? null,
        });
      }
    }
    const movements = Object.entries(byMove)
      .filter(([, rows]) => rows.length >= 2)
      .sort((a, b) => (a[1][a[1].length - 1].date < b[1][b[1].length - 1].date ? 1 : -1));
    const knee = sessions.filter((s) => typeof s.knee === "number").map((s) => ({ x: s.date, y: s.knee }));
    const dur = sessions.filter((s) => s.durationSec).map((s) => ({ x: s.date, y: Math.round(s.durationSec / 60) }));
    // Streak: consecutive calendar days ending today or yesterday.
    const dates = new Set(data.sessions.map((s) => s.date));
    let streak = 0;
    const d = new Date();
    const key = (dt) => dt.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    if (!dates.has(key(d))) d.setDate(d.getDate() - 1);
    while (dates.has(key(d))) { streak += 1; d.setDate(d.getDate() - 1); }
    const last14 = knee.slice(-14);
    const avgKnee = last14.length ? (last14.reduce((a, p) => a + p.y, 0) / last14.length).toFixed(1) : "—";
    // Per-side ratings, newest first.
    const sides = [];
    for (const s of data.sessions) for (const [id, v] of Object.entries(s.sides || {})) sides.push({ date: s.date, id, ...v });
    return { movements, knee, dur, streak, avgKnee, sides, total: data.sessions.length };
  }, [data]);

  if (!data || !derived) return <div className="app"><div className="spin">Drawing the lines…</div></div>;

  const tests = data.tests || [];
  const shown = showAll ? derived.movements : derived.movements.slice(0, 8);

  return (
    <div className="app">
      <div className="brand">Bounce not Crumble</div>
      <h1>Progress</h1>
      <div className="date">
        {data.block ? `Block ${data.block.key} · ${data.block.name} · day ${data.block.day} of ${data.block.of}` : "Phase 2 starts with your next workout"}
      </div>

      <div className="tiles">
        <div className="tile"><div className="n">{derived.total}</div><div className="l">sessions</div></div>
        <div className="tile"><div className="n">{derived.streak}</div><div className="l">day streak</div></div>
        <div className="tile"><div className="n">{derived.avgKnee}</div><div className="l">knee, 14 days</div></div>
      </div>

      {derived.knee.length >= 2 && (
        <div className="card">
          <div className="chart-title"><span>Knee after each session (1–10)</span><span>{derived.knee.filter((p) => p.y < 10).length} days under 10</span></div>
          <MiniLine points={derived.knee.slice(-60)} unit="/10" id="knee" />
        </div>
      )}
      {derived.dur.length >= 2 && (
        <div className="card">
          <div className="chart-title"><span>Session minutes</span><span>honest container ~25</span></div>
          <MiniLine points={derived.dur.slice(-60)} unit="min" id="dur" />
        </div>
      )}

      {tests.length > 0 ? (
        <div className="card">
          <div className="card-label">Test days</div>
          <table className="plain">
            <thead>
              <tr><th>Item</th>{tests.slice(-4).map((t) => <th key={t.id}>{fmtShort(t.date)}</th>)}</tr>
            </thead>
            <tbody>
              {TEST_ITEMS.filter((item) => tests.some((t) => t.values?.[item.id] != null)).map((item) => (
                <tr key={item.id}>
                  <td>{item.label}</td>
                  {tests.slice(-4).map((t) => <td key={t.id}>{t.values?.[item.id] ?? "—"}</td>)}
                </tr>
              ))}
              <tr>
                <td>Hop symmetry (R/L)</td>
                {tests.slice(-4).map((t) => <td key={t.id}>{symmetry(t.values?.hopL, t.values?.hopR) ?? "—"}%</td>)}
              </tr>
              <tr>
                <td>Balance symmetry</td>
                {tests.slice(-4).map((t) => <td key={t.id}>{symmetry(t.values?.balanceL, t.values?.balanceR) ?? "—"}%</td>)}
              </tr>
            </tbody>
          </table>
          <div className="dim" style={{ marginTop: 8 }}>Under 90% hop symmetry means the right side is still behind.</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-label">Test days</div>
          <p className="dim">No test day yet. The first one is your starting line — it&apos;s waiting on the home screen.</p>
        </div>
      )}

      {derived.sides.length > 0 && (
        <div className="card">
          <div className="card-label">Left vs right</div>
          {derived.sides.slice(0, 12).map((s, i) => (
            <div className="ex-head" key={i} style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 13 }}>{fmtShort(s.date)} · {(ALL_BY_ID[s.id] || {}).name || s.id}</span>
              <span>
                <span className={`tag ${s.left || ""}`}>L {s.left || "—"}</span>
                <span className={`tag ${s.right || ""}`}>R {s.right || "—"}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {data.running && data.running.totalRuns > 0 && (
        <div className="card">
          <div className="card-label">Running</div>
          <p>Stage {data.running.stage} · {data.running.label}</p>
          <div className="dim">{data.running.totalRuns} runs logged · {data.running.thisWeekMin} min this week, {data.running.lastWeekMin} last week</div>
        </div>
      )}

      <h1 style={{ fontSize: 20, margin: "18px 0 8px" }}>By movement</h1>
      <div className="dim" style={{ marginBottom: 10 }}>Markers show where the number went up. Tap a point for the date and value.</div>
      {shown.map(([id, rows]) => <MovementCard key={id} id={id} rows={rows} />)}
      {derived.movements.length > 8 && (
        <button className="btn ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show fewer" : `Show all ${derived.movements.length} movements`}
        </button>
      )}

      <div className="chips">
        <a className="chip" href="/">← Today</a>
        <a className="chip" href="/archive">📖 Archive</a>
      </div>
    </div>
  );
}
