import { getState, setState } from "../../../lib/store.js";
import { advanceIfEarned, runningPlan, STAGES } from "../../../lib/running.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";

const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));

// "Ran today / played tennis" — context the brain sees, not a session.
// Phase 2: runs carry minutes, miles, knee-after and the stage they were run
// at, and feed the staged on-ramp (lib/running.js).
export async function POST(request) {
  if (!(await isAuthed())) return unauthorized();

  const body = await request.json();
  const { kind } = body;
  if (!["run", "tennis"].includes(kind)) {
    return Response.json({ error: "bad kind" }, { status: 400 });
  }
  const state = await getState();
  const today = localDate();
  const entry = { date: today, kind };
  if (num(body.minutes) != null) entry.minutes = num(body.minutes);
  if (num(body.miles) != null) entry.miles = num(body.miles);
  if (num(body.kneeAfter) != null) entry.kneeAfter = Math.min(10, Math.max(1, num(body.kneeAfter)));
  if (body.note) entry.note = String(body.note).slice(0, 500);
  if (kind === "run") entry.stage = state.running?.stage || 1;

  state.activityLog = [...(state.activityLog || []), entry].slice(-365);

  let note = null;
  if (kind === "run") note = advanceIfEarned(state, today);
  await setState(state);
  return Response.json({ ok: true, note, running: runningPlan(state, today) });
}

// Manual stage control: Eddie has run 6 miles before and can bump himself.
export async function PATCH(request) {
  if (!(await isAuthed())) return unauthorized();
  const { action } = await request.json(); // bump | back
  const state = await getState();
  const today = localDate();
  const cur = state.running?.stage || 1;
  const next = action === "bump" ? Math.min(STAGES.length, cur + 1) : action === "back" ? Math.max(1, cur - 1) : cur;
  state.running = { stage: next, adjustedAt: today, by: "eddie" };
  await setState(state);
  return Response.json({ ok: true, running: runningPlan(state, today) });
}
