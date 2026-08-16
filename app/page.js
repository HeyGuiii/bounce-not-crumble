"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const todayStr = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const fmtClock = (sec) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

const videoUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " proper form")}`;

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading|auth|serve|work|reflect|saving|done
  const [pass, setPass] = useState("");
  const [data, setData] = useState(null);
  const [dayType, setDayType] = useState(null);
  const [flex, setFlex] = useState(false);
  const [work, setWork] = useState(null); // exercises: {..., done: [repsDone per set], note, showNote}
  const [knee, setKnee] = useState(null);
  const [reasons, setReasons] = useState({});
  const [dump, setDump] = useState("");
  const [result, setResult] = useState(null);
  const [chipFlash, setChipFlash] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);

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
    return () => clearInterval(timerRef.current);
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
        done: Array(ex.sets).fill(0), // reps completed per set
        note: "",
        showNote: false,
      }))
    );
    startRef.current = Date.now();
    setElapsed(0);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setElapsed(Math.round((Date.now() - startRef.current) / 1000)),
      1000
    );
    setPhase("work");
  }

  function setReps(exIdx, setIdx, reps) {
    setWork((w) =>
      w.map((ex, i) =>
        i === exIdx
          ? { ...ex, done: ex.done.map((d, j) => (j === setIdx ? reps : d)) }
          : ex
      )
    );
  }

  // Fast path: tap the set label = full target reps (tap again to clear).
  function tapSet(exIdx, setIdx) {
    const ex = work[exIdx];
    setReps(exIdx, setIdx, ex.done[setIdx] >= ex.reps ? 0 : ex.reps);
  }

  function toggleNote(exIdx) {
    setWork((w) =>
      w.map((ex, i) => (i === exIdx ? { ...ex, showNote: !ex.showNote } : ex))
    );
  }
  function setNote(exIdx, note) {
    setWork((w) => w.map((ex, i) => (i === exIdx ? { ...ex, note } : ex)));
  }

  const totals = work
    ? work.reduce(
        (a, ex) => ({
          done: a.done + ex.done.reduce((x, y) => x + y, 0),
          target: a.target + ex.sets * ex.reps,
        }),
        { done: 0, target: 0 }
      )
    : { done: 0, target: 1 };
  const completion = Math.round((100 * totals.done) / Math.max(1, totals.target));

  const dropped = work
    ? work.filter((ex) => ex.done.reduce((x, y) => x + y, 0) < ex.sets * ex.reps)
    : [];

  function finishWorkout() {
    clearInterval(timerRef.current);
    setPhase("reflect");
  }

  async function saveSession() {
    setPhase("saving");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayType,
        flexibility: flex,
        startedAt: new Date(startRef.current).toISOString(),
        durationSec: elapsed,
        exercises: work.map(({ id, name, done, reps, weight, note }) => ({
          id, name, sets: done, reps, weight, note: note || undefined,
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
          <a className="chip" href="/archive">📖 Archive</a>
        </div>
      </div>
    );

  if (phase === "work")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <div className="work-head">
          <h1>{dayType === "packed" ? "Packed session" : "Full session"}</h1>
          <span className="timer">{fmtClock(elapsed)}</span>
        </div>
        <div className="meter"><div style={{ width: `${completion}%` }} /></div>

        {work.map((ex, i) => (
          <div className="card ex" key={ex.id}>
            <div className="ex-head">
              <span className="ex-name">{ex.name}</span>
              <span className="ex-dose">
                {ex.sets} × {ex.reps} {ex.unit}{ex.weight ? ` · ${ex.weight} lb` : ""}
              </span>
            </div>
            <div className="ex-cues">
              {ex.cues}{" "}
              <a className="howto" href={videoUrl(ex.name)} target="_blank" rel="noreferrer">
                ▶ how-to
              </a>
            </div>

            {ex.done.map((repsDone, j) => (
              <div className="set-row" key={j}>
                <button
                  className={`set-chip ${repsDone >= ex.reps ? "done" : ""}`}
                  onClick={() => tapSet(i, j)}
                >
                  {repsDone >= ex.reps ? "✓" : `Set ${j + 1}`}
                </button>
                <input
                  type="range"
                  min={0}
                  max={ex.reps}
                  value={repsDone}
                  onChange={(e) => setReps(i, j, Number(e.target.value))}
                />
                <span className={`set-count ${repsDone >= ex.reps ? "full" : ""}`}>
                  {repsDone}/{ex.reps}
                </span>
              </div>
            ))}

            {ex.showNote ? (
              <textarea
                className="ex-note"
                placeholder={`Notes on ${ex.name.toLowerCase()}…`}
                value={ex.note}
                onChange={(e) => setNote(i, e.target.value)}
                autoFocus
              />
            ) : (
              <button className="note-toggle" onClick={() => toggleNote(i)}>
                ＋ note
              </button>
            )}
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

        <button className="btn" onClick={finishWorkout}>Done — reflect</button>
      </div>
    );

  if (phase === "reflect")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>How&apos;d it go?</h1>
        <div className="date">
          Completion: {completion}% · {fmtClock(elapsed)}
        </div>

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
        <div className="date">{todayStr()} · {fmtClock(elapsed)}</div>
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
        <a className="chip" href="/archive">📖 See it in the archive</a>
        <p className="dim" style={{ marginTop: 14 }}>See you tomorrow. Showing up is the whole ballgame.</p>
      </div>
    );

  return null;
}
