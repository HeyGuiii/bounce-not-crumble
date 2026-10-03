import { getState, setState, getSessions } from "../../../lib/store.js";
import { generateSession, suggestDayType } from "../../../lib/engine.js";
import { migrateState } from "../../../lib/migrate.js";
import { ensureBlock, blockInfo } from "../../../lib/blocks.js";
import { runningPlan } from "../../../lib/running.js";
import { testDue } from "../../../lib/tests.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!(await isAuthed())) return unauthorized();

  const url = new URL(request.url);
  const today = localDate();
  const state = await getState();
  const recentSessions = await getSessions(30);

  // Blocks initialize/advance on the calendar; persist only when it changed.
  const migrated = migrateState(state);
  if (ensureBlock(state, today) || migrated) await setState(state);

  const suggestion = suggestDayType(state, recentSessions);
  const dayType = url.searchParams.get("dayType") || suggestion.dayType;
  const flexibility = url.searchParams.get("flex") === "1";
  const meatware = url.searchParams.get("meatware") === "1";

  const plan = generateSession({ dayType, flexibility, meatware, state, recentSessions, today });

  const doneToday = recentSessions.some((s) => s.date === today);

  return Response.json({
    plan,
    suggestion,
    doneToday,
    block: blockInfo(state, today),
    running: runningPlan(state, today),
    test: testDue(state, today),
    observation: state.observations[0] || null,
    changed: state.lastChanged || null,
    proposals: (state.proposals || []).filter((p) => p.status === "pending"),
  });
}
