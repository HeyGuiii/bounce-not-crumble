// Single-user passphrase gate. Personal health data — not public, not multi-user.
import { cookies } from "next/headers";
import crypto from "crypto";

function token() {
  const pass = process.env.APP_PASSPHRASE || "";
  return crypto.createHash("sha256").update(`bnc:${pass}`).digest("hex");
}

export async function isAuthed() {
  if (!process.env.APP_PASSPHRASE) return true; // no passphrase configured = open (local dev)
  const jar = await cookies();
  return jar.get("bnc_auth")?.value === token();
}

export async function login(passphrase) {
  if (!process.env.APP_PASSPHRASE) return true;
  if (passphrase !== process.env.APP_PASSPHRASE) return false;
  const jar = await cookies();
  jar.set("bnc_auth", token(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return true;
}

export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
