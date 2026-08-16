import { getState, getSessions } from "../../../lib/store.js";
import { generateSession, suggestDayType } from "../../../lib/engine.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await isAuthed())) return unauthorized();

  const url = new URL(request.url);
  const state = await getState();
  const recentSessions = await getSessions(30);

  const suggestion = suggestDayType(state, recentSessions);
  const dayType = url.searchParams.get("dayType") || suggestion.dayType;
  const flexibility = url.searchParams.get("flex") === "1";

  const plan = generateSession({ dayType, flexibility, state, recentSessions });

  const doneToday = recentSessions.some((s) => s.date === localDate());

  return Response.json({
    plan,
    suggestion,
    doneToday,
    observation: state.observations[0] || null,
    changed: state.lastChanged || null,
    proposals: (state.proposals || []).filter((p) => p.status === "pending"),
  });
}
