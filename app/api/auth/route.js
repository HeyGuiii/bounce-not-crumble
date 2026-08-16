import { login, isAuthed } from "../../../lib/auth.js";

export async function GET() {
  return Response.json({ authed: await isAuthed() });
}

export async function POST(request) {
  const { passphrase } = await request.json();
  const ok = await login(passphrase);
  return ok
    ? Response.json({ ok: true })
    : Response.json({ ok: false }, { status: 401 });
}
