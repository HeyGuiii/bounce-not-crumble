import { getState, setState } from "../../../lib/store.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";
import { localDate } from "../../../lib/dates.js";

export const dynamic = "force-dynamic";

// One-tap "ran today / played tennis" — context the brain sees, not a session.
export async function POST(request) {
  if (!(await isAuthed())) return unauthorized();

  const { kind } = await request.json();
  if (!["run", "tennis"].includes(kind)) {
    return Response.json({ error: "bad kind" }, { status: 400 });
  }
  const state = await getState();
  state.activityLog = [
    ...(state.activityLog || []),
    { date: localDate(), kind },
  ].slice(-90);
  await setState(state);
  return Response.json({ ok: true });
}
