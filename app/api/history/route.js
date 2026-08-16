import { getState, getSessions } from "../../../lib/store.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return unauthorized();

  const [state, sessions] = await Promise.all([getState(), getSessions(365)]);
  const obsByDate = {};
  for (const o of state.observations || []) {
    if (!obsByDate[o.date]) obsByDate[o.date] = o.text; // newest wins (list is newest-first)
  }
  return Response.json({
    sessions: sessions.map((s) => ({ ...s, observation: obsByDate[s.date] || null })),
    activityLog: (state.activityLog || []).slice().reverse(),
  });
}
