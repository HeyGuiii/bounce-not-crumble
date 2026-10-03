import { getState, getSessions } from "../../../lib/store.js";
import { blockInfo } from "../../../lib/blocks.js";
import { runningPlan } from "../../../lib/running.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";

// Everything the archive and the progress page need in one call.
export async function GET() {
  if (!(await isAuthed())) return unauthorized();

  const today = localDate();
  const [state, sessions] = await Promise.all([getState(), getSessions(365)]);
  const obsByDate = {};
  for (const o of state.observations || []) {
    if (!obsByDate[o.date]) obsByDate[o.date] = o.text; // newest wins (list is newest-first)
  }
  return Response.json({
    sessions: sessions.map((s) => ({ ...s, observation: obsByDate[s.date] || null })),
    activityLog: (state.activityLog || []).slice().reverse(),
    tests: state.tests || [],
    block: state.block ? blockInfo(state, today) : null,
    blockHistory: state.block?.history || [],
    running: runningPlan(state, today),
    progress: state.progress || {},
  });
}
