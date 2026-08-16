"use client";

import { useEffect, useState, useCallback } from "react";

const todayStr = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading|auth|serve|work|reflect|saving|done
  const [pass, setPass] = useState("");
  const [data, setData] = useState(null); // /api/today payload
  const [dayType, setDayType] = useState(null);
  const [flex, setFlex] = useState(false);
  const [work, setWork] = useState(null); // exercises w/ set-done state
  const [knee, setKnee] = useState(null);
  const [reasons, setReasons] = useState({});
  const [dump, setDump] = useState("");
  const [result, setResult] = useState(null);
  const [chipFlash, setChipFlash] = useState(null);

  const loadToday = useCallback(async (dt, fx) => {
    const params = new URLSearchParams();
    if (dt) params.set("dayType", dt);
    if (fx) params.set("flex", "1");
    const res = await fetch(`/api/today?${params}`);
    if (res.status === 401) return setPhase("auth");
    const payload = await res.json();
    setData(payload);
    setDayType(dt || payload.suggestion.dayType);
    setPhase("serve");
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  async function submitPass(e) {
    e.preventDefault();
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passphrase: pass }),
    });
    if (res.ok) loadToday();
    else alert("Not it. Try again.");
  }

  function startWorkout() {
    setWork(
      data.plan.exercises.map((ex) => ({
        ...ex,
        done: Array(ex.sets).fill(false),
      }))
    );
    setPhase("work");
  }

  function tapSet(exIdx, setIdx) {
    setWork((w) =>
      w.map((ex, i) =>
        i === exIdx
          ? { ...ex, done: ex.done.map((d, j) => (j === setIdx ? !d : d)) }
          : ex
      )
    );
  }

  const completion = work
    ? Math.round(
        (100 * work.reduce((a, ex) => a + ex.done.filter(Boolean).length, 0)) /
          Math.max(1, work.reduce((a, ex) => a + ex.done.length, 0))
      )
    : 0;

  const dropped = work ? work.filter((ex) => ex.done.some((d) => !d)) : [];

  async function saveSession() {
    setPhase("saving");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayType,
        flexibility: flex,
        exercises: work.map(({ id, name, done, reps, weight }) => ({
          id, name, sets: done, reps, weight,
        })),
        completion,
        knee,
        reasons,
        dump,
      }),
    });
    const payload = await res.json();
    setResult(payload);
    setPhase("done");
  }

  async function logActivity(kind) {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    setChipFlash(kind);
    setTimeout(() => setChipFlash(null), 1500);
  }

  async function decideProposal(id, action) {
    await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setData((d) => ({ ...d, proposals: d.proposals.filter((p) => p.id !== id) }));
  }

  // ── Screens ─────────────────────────────────────────────────
  if (phase === "loading") return <div className="app"><div className="spin">Loading…</div></div>;

  if (phase === "auth")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>Hey Eddie.</h1>
        <div className="date">{todayStr()}</div>
        <form onSubmit={submitPass}>
          <input
            type="password"
            placeholder="Passphrase"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoFocus
          />
          <button className="btn" type="submit">Let me in</button>
        </form>
      </div>
    );

  if (phase === "serve")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>Today&apos;s workout</h1>
        <div className="date">{todayStr()}</div>

        {data.suggestion.note && (
          <div className="card note">
            <div className="card-label">The app says</div>
            <p>{data.suggestion.note}</p>
          </div>
        )}

        {data.observation && (
          <div className="card obs">
            <div className="card-label">From last time</div>
            <p>{data.observation.text}</p>
            {data.changed && <div className="changed">↻ {data.changed}</div>}
          </div>
        )}

        {data.proposals.map((p) => (
          <div className="card" key={p.id}>
            <div className="card-label">The brain proposes</div>
            <p>{p.text}</p>
            <div className="proposal-actions">
              <button className="btn small" onClick={() => decideProposal(p.id, "accepted")}>Accept</button>
              <button className="btn small ghost" onClick={() => decideProposal(p.id, "declined")}>Decline</button>
            </div>
          </div>
        ))}

        <div className="toggle-row">
          <button
            className={`toggle ${dayType === "packed" ? "on" : ""}`}
            onClick={() => loadToday("packed", flex)}
          >
            Packed<small>~20 min</small>
          </button>
          <button
            className={`toggle ${dayType === "full" ? "on" : ""}`}
            onClick={() => loadToday("full", flex)}
          >
            Full<small>~35–40 min</small>
          </button>
        </div>
        <div className="toggle-row">
          <button
            className={`toggle ${flex ? "on" : ""}`}
            onClick={() => { setFlex(!flex); loadToday(dayType, !flex); }}
          >
            {flex ? "Mobility block: on" : "Mobility today?"}
          </button>
        </div>

        <div className="card">
          <div className="card-label">
            {data.plan.format === "circuit" ? "Circuit — cycle through" : "Straight sets"}
          </div>
          {data.plan.exercises.map((ex) => (
            <div className="ex-head" key={ex.id} style={{ marginBottom: 6 }}>
              <span className="ex-name" style={{ fontSize: 15 }}>{ex.name}</span>
              <span className="ex-dose">
                {ex.sets}×{ex.reps} {ex.unit}{ex.weight ? ` · ${ex.weight} lb` : ""}
              </span>
            </div>
          ))}
          {data.plan.mobility.length > 0 && (
            <div className="changed">+ mobility: {data.plan.mobility.map((m) => m.name).join(", ")}</div>
          )}
        </div>

        <button className="btn" onClick={startWorkout}>
          {data.doneToday ? "Go again (already done today)" : "Start"}
        </button>

        <div className="chips">
          <button className={`chip ${chipFlash === "run" ? "flash" : ""}`} onClick={() => logActivity("run")}>
            {chipFlash === "run" ? "Logged ✓" : "🏃 Ran today"}
          </button>
          <button className={`chip ${chipFlash === "tennis" ? "flash" : ""}`} onClick={() => logActivity("tennis")}>
            {chipFlash === "tennis" ? "Logged ✓" : "🎾 Played tennis"}
          </button>
        </div>
      </div>
    );

  if (phase === "work")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>{dayType === "packed" ? "Packed session" : "Full session"}</h1>
        <div className="meter"><div style={{ width: `${completion}%` }} /></div>

        {work.map((ex, i) => (
          <div className="card ex" key={ex.id}>
            <div className="ex-head">
              <span className="ex-name">{ex.name}</span>
              <span className="ex-dose">
                {ex.reps} {ex.unit}{ex.weight ? ` · ${ex.weight} lb` : ""}
              </span>
            </div>
            <div className="ex-cues">{ex.cues}</div>
            <div className="sets">
              {ex.done.map((d, j) => (
                <button key={j} className={`set ${d ? "done" : ""}`} onClick={() => tapSet(i, j)}>
                  {d ? "✓" : `Set ${j + 1}`}
                </button>
              ))}
            </div>
          </div>
        ))}

        {flex && data.plan.mobility.length > 0 && (
          <div className="card">
            <div className="card-label">Mobility (~5 min)</div>
            {data.plan.mobility.map((m) => (
              <p key={m.id} style={{ marginBottom: 4 }}>
                {m.name} — {m.reps} {m.unit}
              </p>
            ))}
          </div>
        )}

        <button className="btn" onClick={() => setPhase("reflect")}>Done — reflect</button>
      </div>
    );

  if (phase === "reflect")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>How&apos;d it go?</h1>
        <div className="date">Completion: {completion}%</div>

        <div className="card">
          <div className="card-label">Knee, 1–10 (10 = great)</div>
          <div className="knee-row">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button key={n} className={`knee ${knee === n ? "on" : ""}`} onClick={() => setKnee(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {dropped.map((ex) => (
          <div className="card" key={ex.id}>
            <div className="card-label">Didn&apos;t finish: {ex.name} — why?</div>
            <div className="reason-row">
              {["knee", "time", "too_hard"].map((r) => (
                <button
                  key={r}
                  className={`reason ${reasons[ex.id] === r ? "on" : ""}`}
                  onClick={() => setReasons({ ...reasons, [ex.id]: r })}
                >
                  {r === "knee" ? "Knee" : r === "time" ? "Time" : "Too hard"}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="card">
          <div className="card-label">Anything else? (optional — dictate it)</div>
          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder="How it felt, what was weird, what was great…"
          />
        </div>

        <button className="btn" disabled={knee === null} onClick={saveSession}>
          Save session
        </button>
      </div>
    );

  if (phase === "saving")
    return (
      <div className="app">
        <div className="spin">Saved. The brain is reading your session…</div>
      </div>
    );

  if (phase === "done")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>Bounced. 💪</h1>
        <div className="date">{todayStr()}</div>
        <div className="card obs">
          <div className="card-label">The brain</div>
          <p>{result?.observation}</p>
          {result?.changed && <div className="changed">↻ {result.changed}</div>}
        </div>
        {(result?.proposals || []).map((p) => (
          <div className="card" key={p.id}>
            <div className="card-label">The brain proposes</div>
            <p>{p.text}</p>
            <div className="proposal-actions">
              <button className="btn small" onClick={() => decideProposal(p.id, "accepted")}>Accept</button>
              <button className="btn small ghost" onClick={() => decideProposal(p.id, "declined")}>Decline</button>
            </div>
          </div>
        ))}
        <p className="dim">See you tomorrow. Showing up is the whole ballgame.</p>
      </div>
    );

  return null;
}
