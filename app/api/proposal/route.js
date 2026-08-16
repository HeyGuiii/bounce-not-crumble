import { getState, setState } from "../../../lib/store.js";
import { isAuthed, unauthorized } from "../../../lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!(await isAuthed())) return unauthorized();

  const { id, action } = await request.json(); // action: accepted | declined
  if (!["accepted", "declined"].includes(action)) {
    return Response.json({ error: "bad action" }, { status: 400 });
  }
  const state = await getState();
  const proposal = (state.proposals || []).find((p) => p.id === id);
  if (!proposal) return Response.json({ error: "not found" }, { status: 404 });
  proposal.status = action;
  proposal.decidedAt = new Date().toISOString();
  await setState(state);
  return Response.json({ ok: true });
}
