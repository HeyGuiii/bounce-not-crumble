"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TEST_ITEMS } from "../lib/tests.js";

const todayStr = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

const fmtClock = (sec) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

const videoUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " proper form")}`;

const SIDE_OPTIONS = [
  { v: "solid", label: "Solid" },
  { v: "off", label: "A little off" },
  { v: "weak", label: "Weak" },
];

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading|auth|serve|work|reflect|saving|done|test|testdone
  const [pass, setPass] = useState("");
  const [data, setData] = useState(null);
  const [dayType, setDayType] = useState(null);
  const [flex, setFlex] = useState(false);
  const [mw, setMw] = useState(false); // Meatware: no-equipment day (resets daily)
  const [work, setWork] = useState(null); // exercises: {..., done: [repsDone per set], note, showNote}
  const [knee, setKnee] = useState(null);
  const [reasons, setReasons] = useState({});
  const [sides, setSides] = useState({}); // movementId -> { left, right }
  const [dump, setDump] = useState("");
  const [result, setResult] = useState(null);
  const [chipFlash, setChipFlash] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  // Running log form
  const [runOpen, setRunOpen] = useState(false);
  const [runForm, setRunForm] = useState({ minutes: "", miles: "", kneeAfter: "" });
  const [runNote, setRunNote] = useState(null);

  // Test day
  const [testVals, setTestVals] = useState({});
  const [testNote, setTestNote] = useState("");
  const [testResult, setTestResult] = useState(null);

  const loadToday = useCallback(async (dt, fx, meat) => {
    const params = new URLSearchParams();
    if (dt) params.set("dayType", dt);
    if (fx) params.set("flex", "1");
    if (meat) params.set("meatware", "1");
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

  function startTimer() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setElapsed(Math.round((Date.now() - startRef.current) / 1000)),
      1000
    );
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
    startTimer();
    setPhase("work");
  }

  function startTest() {
    startRef.current = Date.now();
    setElapsed(0);
    startTimer();
    setTestVals({});
    setTestNote("");
    setKnee(null);
    setPhase("test");
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

  function setSide(id, which, v) {
    setSides((s) => {
      const cur = s[id] || {};
      return { ...s, [id]: { ...cur, [which]: cur[which] === v ? undefined : v } };
    });
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
  const perSideMoves = work ? work.filter((ex) => ex.perSide) : [];

  function finishWorkout() {
    clearInterval(timerRef.current);
    setPhase("reflect");
  }

  // Accidental "Done" tap — go back and keep working; the timer resumes
  // from the true start time.
  function backToWorkout() {
    startTimer();
    setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    setPhase("work");
  }

  async function saveSession() {
    setPhase("saving");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayType,
        flexibility: flex,
        meatware: mw,
        block: data.plan.block,
        startedAt: new Date(startRef.current).toISOString(),
        durationSec: elapsed,
        exercises: work.map(({ id, name, done, reps, weight, note }) => ({
          id, name, sets: done, reps, weight, note: note || undefined,
        })),
        completion,
        knee,
        reasons,
        sides,
        dump,
      }),
    });
    const payload = await res.json();
    setResult(payload);
    setPhase("done");
  }

  async function saveTest() {
    clearInterval(timerRef.current);
    setPhase("saving");
    const res = await fetch("/api/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        values: testVals,
        knee,
        note: testNote,
        startedAt: new Date(startRef.current).toISOString(),
        durationSec: elapsed,
      }),
    });
    const payload = await res.json();
    setTestResult(payload);
    setPhase("testdone");
  }

  async function logActivity(kind, extra = {}) {
    const res = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...extra }),
    });
    const payload = await res.json().catch(() => ({}));
    setChipFlash(kind);
    setTimeout(() => setChipFlash(null), 1500);
    if (payload.running) setData((d) => ({ ...d, running: payload.running }));
    if (payload.note) setRunNote(payload.note);
  }

  async function submitRun(e) {
    e.preventDefault();
    await logActivity("run", runForm);
    setRunOpen(false);
    setRunForm({ minutes: "", miles: "", kneeAfter: "" });
  }

  async function adjustStage(action) {
    const res = await fetch("/api/activity", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await res.json().catch(() => ({}));
    if (payload.running) setData((d) => ({ ...d, running: payload.running }));
  }

  const [decided, setDecided] = useState({}); // proposalId -> "accepted"|"declined"|"error"

  async function decideProposal(id, action) {
    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error("save failed");
      setDecided((d) => ({ ...d, [id]: action }));
    } catch {
      setDecided((d) => ({ ...d, [id]: "error" }));
    }
  }

  function proposalCard(p) {
    const verdict = decided[p.id];
    return (
      <div className="card" key={p.id}>
        <div className="card-label">The brain proposes</div>
        <p>{p.text}</p>
        {verdict === "accepted" && (
          <p className="verdict ok">✓ Accepted — the brain will build this in starting next session.</p>
        )}
        {verdict === "declined" && (
          <p className="verdict">✗ Declined — the brain will drop it.</p>
        )}
        {verdict === "error" && (
          <p className="verdict err">Couldn&apos;t save that — check your connection and tap again.</p>
        )}
        {(!verdict || verdict === "error") && (
          <div className="proposal-actions">
            <button className="btn small" onClick={() => decideProposal(p.id, "accepted")}>Accept</button>
            <button className="btn small ghost" onClick={() => decideProposal(p.id, "declined")}>Decline</button>
          </div>
        )}
      </div>
    );
  }

  const doseText = (ex) =>
    `${ex.sets}×${ex.reps} ${ex.unit}${ex.weight ? ` · ${ex.weight} lb` : ""}`;

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

  if (phase === "serve") {
    const running = data.running;
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

        {data.proposals.map(proposalCard)}

        {data.block && (
          <div className="card block">
            <div className="ex-head">
              <span className="block-name">Block {data.block.key} · {data.block.name}</span>
              <span className="block-day">day {data.block.day} of {data.block.of}</span>
            </div>
            <div className="changed" style={{ marginTop: 4 }}>{data.block.tagline}</div>
          </div>
        )}

        {data.test?.due && (
          <div className="card note">
            <div className="card-label">Test day</div>
            <p>
              {data.test.last
                ? `It's been ${data.test.daysSince} days since your last test. Bodyweight, hops, balance, push-ups, tib raises, wall sit — about 15 minutes, and it counts as today's workout.`
                : "No starting line yet. Bodyweight, single-leg hops, eyes-closed balance, max push-ups, tib raises, wall sit — about 15 minutes, and it counts as today's workout. Tape measure and a wall."}
            </p>
            <div className="inline-actions">
              <button className="btn small" onClick={startTest}>Do the test day instead</button>
            </div>
          </div>
        )}

        <div className="toggle-row">
          <button
            className={`toggle ${dayType === "packed" ? "on" : ""}`}
            onClick={() => loadToday("packed", flex, mw)}
          >
            Packed<small>~15 min</small>
          </button>
          <button
            className={`toggle ${dayType === "full" ? "on" : ""}`}
            onClick={() => loadToday("full", flex, mw)}
          >
            Full<small>~25 min</small>
          </button>
        </div>
        <div className="toggle-row">
          <button
            className={`toggle ${flex ? "on" : ""}`}
            onClick={() => { setFlex(!flex); loadToday(dayType, !flex, mw); }}
          >
            {flex ? "Mobility block: on" : "Mobility today?"}
          </button>
          <button
            className={`toggle ${mw ? "on" : ""}`}
            onClick={() => { setMw(!mw); loadToday(dayType, flex, !mw); }}
          >
            {mw ? "🥩 Meatware: on" : "🥩 No equipment?"}<small>bodyweight only</small>
          </button>
        </div>

        <div className="card">
          <div className="card-label">
            {data.plan.format === "circuit" ? "Circuit — cycle through" : "Straight sets"}
            {data.plan.afterRun ? " · day after a run: nothing high-knee" : ""}
          </div>
          {data.plan.exercises.map((ex) => (
            <div key={ex.id} style={{ marginBottom: 8 }}>
              <div className="ex-head">
                <span className="ex-name" style={{ fontSize: 15 }}>{ex.name}</span>
                <span className="ex-dose">{doseText(ex)}</span>
              </div>
              {ex.how && <span className={`how ${ex.snapped ? "snapped" : ""}`}>{ex.snapped ? "snapped to your gear: " : ""}{ex.how}</span>}
            </div>
          ))}
          {data.plan.mobility.length > 0 && (
            <div className="changed">+ mobility: {data.plan.mobility.map((m) => m.name).join(", ")}</div>
          )}
        </div>

        <button className="btn" onClick={startWorkout}>
          {data.doneToday ? "Go again (already done today)" : "Start"}
        </button>

        {running && (
          <div className="card" style={{ marginTop: 14 }}>
            <div className="ex-head">
              <span className="card-label" style={{ marginBottom: 0 }}>Running track · stage {running.stage}</span>
              <span className="ex-dose">{running.cleanAtStage}/{running.needed} clean</span>
            </div>
            <p style={{ marginTop: 6 }}>{running.prescription}</p>
            {running.caution && <div className="changed" style={{ color: "var(--warn)" }}>{running.caution}</div>}
            {runNote && <div className="verdict ok">{runNote}</div>}
            {!runOpen ? (
              <div className="inline-actions">
                <button className="btn small" onClick={() => setRunOpen(true)}>🏃 Log a run</button>
                <button className="btn small ghost" onClick={() => adjustStage("bump")}>I&apos;m past this stage</button>
                {running.stage > 1 && <button className="btn small ghost" onClick={() => adjustStage("back")}>Step back</button>}
              </div>
            ) : (
              <form onSubmit={submitRun} style={{ marginTop: 10 }}>
                <div className="field-row">
                  <label>Minutes<input type="number" inputMode="decimal" value={runForm.minutes} onChange={(e) => setRunForm({ ...runForm, minutes: e.target.value })} /></label>
                  <label>Miles<input type="number" inputMode="decimal" step="0.1" value={runForm.miles} onChange={(e) => setRunForm({ ...runForm, miles: e.target.value })} /></label>
                  <label>Knee after (1–10)<input type="number" inputMode="numeric" min={1} max={10} value={runForm.kneeAfter} onChange={(e) => setRunForm({ ...runForm, kneeAfter: e.target.value })} /></label>
                </div>
                <div className="inline-actions">
                  <button className="btn small" type="submit">Save run</button>
                  <button className="btn small ghost" type="button" onClick={() => setRunOpen(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="chips">
          <button className={`chip ${chipFlash === "tennis" ? "flash" : ""}`} onClick={() => logActivity("tennis")}>
            {chipFlash === "tennis" ? "Logged ✓" : "🎾 Played tennis"}
          </button>
          <a className="chip" href="/progress">📈 Progress</a>
          <a className="chip" href="/archive">📖 Archive</a>
        </div>
      </div>
    );
  }

  if (phase === "work")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <div className="work-head">
          <h1>{mw ? "🥩 " : ""}{dayType === "packed" ? "Packed session" : "Full session"}</h1>
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
            {ex.how && <span className={`how ${ex.snapped ? "snapped" : ""}`} style={{ marginBottom: 6 }}>{ex.how}</span>}
            {ex.tempo && <div className="tempo">⏱ {ex.tempo}</div>}
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

        {perSideMoves.length > 0 && (
          <div className="card">
            <div className="card-label">Left vs right (optional — skip what felt even)</div>
            {perSideMoves.map((ex) => (
              <div className="side-block" key={ex.id}>
                <div className="side-name">{ex.name}</div>
                {["left", "right"].map((which) => (
                  <div className="side-row" key={which}>
                    <span className="side-label">{which === "left" ? "L" : "R"}</span>
                    {SIDE_OPTIONS.map((o) => (
                      <button
                        key={o.v}
                        className={`side-btn ${sides[ex.id]?.[which] === o.v ? `on ${o.v}` : ""}`}
                        onClick={() => setSide(ex.id, which, o.v)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

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
        <button className="btn ghost" onClick={backToWorkout}>
          ← Back to the workout
        </button>
      </div>
    );

  if (phase === "test")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <div className="work-head">
          <h1>Test day</h1>
          <span className="timer">{fmtClock(elapsed)}</span>
        </div>
        <div className="date">Warm up with 60 backward steps and 20 tib raises first. Best effort, honest numbers.</div>

        <div className="card">
          {TEST_ITEMS.map((item) => (
            <div className="test-item" key={item.id}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>
                {item.label} <span className="dim" style={{ fontWeight: 400 }}>({item.unit}{item.optional ? ", optional" : ""})</span>
                <input
                  type={item.text ? "text" : "number"}
                  inputMode={item.text ? "text" : "decimal"}
                  placeholder={item.text ? "e.g. 9:30" : ""}
                  value={testVals[item.id] ?? ""}
                  onChange={(e) => setTestVals({ ...testVals, [item.id]: e.target.value })}
                />
              </label>
              <div className="hint">{item.hint}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-label">Knee after, 1–10</div>
          <div className="knee-row">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button key={n} className={`knee ${knee === n ? "on" : ""}`} onClick={() => setKnee(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Notes (optional)</div>
          <textarea value={testNote} onChange={(e) => setTestNote(e.target.value)} placeholder="Which side felt off, what surprised you…" />
        </div>

        <button
          className="btn"
          disabled={knee === null || !TEST_ITEMS.some((t) => !t.optional && testVals[t.id] !== undefined && testVals[t.id] !== "")}
          onClick={saveTest}
        >
          Save test day
        </button>
        <button className="btn ghost" onClick={() => { clearInterval(timerRef.current); setPhase("serve"); }}>
          ← Back to today&apos;s workout
        </button>
      </div>
    );

  if (phase === "saving")
    return (
      <div className="app">
        <div className="spin">Saved. The brain is reading your session…</div>
      </div>
    );

  if (phase === "testdone")
    return (
      <div className="app">
        <div className="brand">Bounce not Crumble</div>
        <h1>Starting line set. 📏</h1>
        <div className="date">{todayStr()} · {fmtClock(elapsed)}</div>
        <div className="card obs">
          <div className="card-label">The brain</div>
          <p>{testResult?.observation}</p>
        </div>
        <div className="chips">
          <a className="chip" href="/progress">📈 See it on the progress page</a>
        </div>
        <p className="dim" style={{ marginTop: 14 }}>Next test in about four weeks. The app will ask.</p>
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
        {(result?.proposals || []).map(proposalCard)}
        <div className="chips">
          <a className="chip" href="/progress">📈 Progress</a>
          <a className="chip" href="/archive">📖 Archive</a>
        </div>
        <p className="dim" style={{ marginTop: 14 }}>See you tomorrow. Showing up is the whole ballgame.</p>
      </div>
    );

  return null;
}
