import crypto from "crypto";
import { getState, setState, saveSession, getSessions } from "../../../lib/store.js";
import { runBrain } from "../../../lib/brain.js";
import { TEST_ITEMS } from "../../../lib/tests.js";
import { ensureBlock } from "../../../lib/blocks.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Monthly test day. Saves the numbers to state.tests AND records a session of
// dayType "test" so the day counts in the archive and the streak. The brain
// reads it like any session (it knows what a test day is).
export async function POST(request) {
  if (!(await isAuthed())) return unauthorized();

  const body = await request.json();
  const values = {};
  for (const item of TEST_ITEMS) {
    const raw = body.values?.[item.id];
    if (raw === "" || raw == null) continue;
    if (item.text) values[item.id] = String(raw).slice(0, 20);
    else if (!Number.isNaN(Number(raw))) values[item.id] = Number(raw);
  }
  if (!Object.keys(values).length) return Response.json({ error: "no values" }, { status: 400 });

  const today = localDate();
  const test = { id: crypto.randomUUID(), date: today, values, note: body.note || "" };

  const session = {
    id: test.id,
    date: today,
    finishedAt: new Date().toISOString(),
    dayType: "test",
    flexibility: false,
    meatware: false,
    startedAt: body.startedAt || null,
    durationSec: body.durationSec || null,
    exercises: [],
    completion: 100,
    knee: body.knee ?? null,
    reasons: {},
    sides: {},
    dump: body.note || "",
    test: values,
  };
  await saveSession(session);

  const state = await getState();
  ensureBlock(state, today);
  state.tests = [...(state.tests || []), test];

  let observation = "Test day saved. The brain will read it on your next session.";
  try {
    const recentSessions = await getSessions(30);
    const result = await runBrain({ session, recentSessions, state });
    observation = result.observation;
    state.observations = [{ date: today, text: observation }, ...(state.observations || [])].slice(0, 60);
    state.lastChanged = result.changed || null;
    if (result.nextPlan) {
      state.nextPlan = {
        dayType: result.nextPlan.dayType,
        note: result.nextPlan.note || null,
        movementIds: result.nextPlan.movementIds?.length ? result.nextPlan.movementIds : null,
      };
    }
  } catch (err) {
    console.error("brain failed on test day:", err?.message);
    state.observations = [{ date: today, text: observation }, ...(state.observations || [])].slice(0, 60);
  }
  await setState(state);
  return Response.json({ ok: true, observation, test });
}
