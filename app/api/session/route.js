import crypto from "crypto";
import { getState, setState, saveSession, getSessions, deleteSession } from "../../../lib/store.js";
import { runBrain } from "../../../lib/brain.js";
import { byId } from "../../../lib/library.js";
import { snapLoad } from "../../../lib/inventory.js";
import { migrateState } from "../../../lib/migrate.js";
import { ensureBlock } from "../../../lib/blocks.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate, yesterdayDate, isIsoDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // brain call can take a while

const SIDE_VALUES = new Set(["solid", "off", "weak"]);

export async function POST(request) {
  if (!(await isAuthed())) return unauthorized();

  const body = await request.json();

  // Per-side ratings (phase 2): { movementId: { left, right } }, each
  // solid | off | weak. Anything else is dropped.
  const sides = {};
  for (const [id, v] of Object.entries(body.sides || {})) {
    if (!v || typeof v !== "object") continue;
    const clean = {};
    if (SIDE_VALUES.has(v.left)) clean.left = v.left;
    if (SIDE_VALUES.has(v.right)) clean.right = v.right;
    if (Object.keys(clean).length) sides[id] = clean;
  }

  const session = {
    id: crypto.randomUUID(),
    // "yesterday" = he did it yesterday and is logging it late (reflect toggle).
    date: body.logDate === "yesterday" ? yesterdayDate() : localDate(),
    finishedAt: new Date().toISOString(),
    dayType: body.dayType,
    flexibility: !!body.flexibility,
    meatware: !!body.meatware,
    block: body.block || null,
    startedAt: body.startedAt || null,
    durationSec: body.durationSec || null,
    exercises: body.exercises, // [{id, name, sets: [repsDone...], reps, weight, note?}]
    completion: body.completion, // 0-100 across all sets
    knee: body.knee, // 1-10
    reasons: body.reasons || {}, // movementId -> knee|time|too_hard
    sides,
    dump: body.dump || "",
  };

  // Session is saved FIRST — a brain failure never loses the workout.
  await saveSession(session);

  const state = await getState();
  migrateState(state);
  ensureBlock(state, session.date);
  const recentSessions = await getSessions(30);

  let brainResult = null;
  try {
    brainResult = await runBrain({ session, recentSessions, state });
  } catch (err) {
    console.error("brain failed:", err?.message);
  }

  if (brainResult) {
    // Dose changes: the brain's free authority — but only for known movements,
    // and every weight snapped to something Eddie can actually build.
    const snaps = [];
    for (const change of brainResult.doseChanges || []) {
      const m = byId[change.movementId];
      if (!m) continue;
      const s = snapLoad(m.loadMode, change.weight);
      if (s.snapped) snaps.push(`${m.name}: asked ${change.weight}, set ${s.weight ?? "bodyweight"}`);
      state.progress[change.movementId] = {
        reps: change.reps,
        sets: change.sets,
        weight: s.weight,
      };
    }
    if (brainResult.nextPlan) {
      state.nextPlan = {
        dayType: brainResult.nextPlan.dayType,
        note: brainResult.nextPlan.note || null,
        movementIds: brainResult.nextPlan.movementIds?.length
          ? brainResult.nextPlan.movementIds
          : null,
      };
    }
    state.lastChanged = [brainResult.changed || "", ...(snaps.length ? [`(snapped to your gear — ${snaps.join("; ")})`] : [])]
      .filter(Boolean)
      .join(" ") || null;
    state.observations = [
      { date: session.date, text: brainResult.observation },
      ...(state.observations || []),
    ].slice(0, 60);
    for (const text of brainResult.proposals || []) {
      state.proposals = [
        { id: crypto.randomUUID(), date: session.date, text, status: "pending" },
        ...(state.proposals || []),
      ];
    }
  } else {
    state.observations = [
      {
        date: session.date,
        text: "Session saved. The brain couldn't run this time — it'll catch up on your next session.",
      },
      ...(state.observations || []),
    ].slice(0, 60);
  }

  // Emphasis alternates on full days so lower-body work rotates.
  if (session.dayType === "full") {
    state.lastEmphasis = state.lastEmphasis === "squat" ? "hinge" : "squat";
  }

  await setState(state);

  return Response.json({
    ok: true,
    observation: state.observations[0].text,
    changed: state.lastChanged,
    proposals: (state.proposals || []).filter((p) => p.status === "pending"),
  });
}

// Move a session to a different calendar day (and optionally clear a bogus
// duration). Used when a workout was logged late without the toggle. The
// brain observation written for it moves with it.
export async function PATCH(request) {
  if (!(await isAuthed())) return unauthorized();
  const { id, date, clearDuration } = await request.json();
  if (!id || !isIsoDate(date)) return Response.json({ error: "bad request" }, { status: 400 });
  const sessions = await getSessions(365);
  const session = sessions.find((s) => s.id === id);
  if (!session) return Response.json({ error: "not found" }, { status: 404 });
  const from = session.date;
  session.date = date;
  session.movedFrom = from;
  if (clearDuration) session.durationSec = null;
  await saveSession(session);
  const state = await getState();
  const obs = (state.observations || []).find((o) => o.date === from);
  if (obs && !(state.observations || []).some((o) => o.date === date)) obs.date = date;
  await setState(state);
  return Response.json({ ok: true, session: { id, from, to: date } });
}

// Remove a duplicate save (two identical sessions on one day).
export async function DELETE(request) {
  if (!(await isAuthed())) return unauthorized();
  const { id } = await request.json();
  if (!id) return Response.json({ error: "bad request" }, { status: 400 });
  const ok = await deleteSession(id);
  return Response.json({ ok }, { status: ok ? 200 : 404 });
}
