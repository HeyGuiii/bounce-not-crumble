// Storage: Vercel Blob in production (BLOB_READ_WRITE_TOKEN set), JSON files
// in local dev. Two surfaces only: a sessions log and a single state blob
// (progression, streaks, brain observations, proposals).
// Note: blob URLs are public-but-obscure — Eddie explicitly declined a
// passphrase/lockdown on this data (2026-08-15).

import fs from "fs";
import path from "path";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const DATA_DIR = path.join(process.cwd(), "data");

const DEFAULT_STATE = {
  packedStreak: 0,
  lastEmphasis: "squat",
  progress: {},        // movementId -> { reps, sets, weight }
  nextPlan: null,      // brain's suggestion for the next session (validated)
  observations: [],    // [{ date, text }] newest first
  proposals: [],       // [{ id, date, text, status: pending|accepted|declined }]
  activityLog: [],     // [{ date, kind: run|tennis }] context the brain sees
};

// ── JSON-file driver (local dev) ────────────────────────────────
function fileRead(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
  } catch {
    return fallback;
  }
}
function fileWrite(name, value) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(value, null, 2));
}

// ── Vercel Blob driver (production) ─────────────────────────────
async function blobRead(name, fallback) {
  const { head } = await import("@vercel/blob");
  try {
    const meta = await head(name);
    // Query-bust the CDN cache so reads are always fresh.
    const res = await fetch(`${meta.url}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return await res.json();
  } catch {
    return fallback; // blob doesn't exist yet
  }
}
async function blobWrite(name, value) {
  const { put } = await import("@vercel/blob");
  await put(name, JSON.stringify(value), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

// ── Public API ──────────────────────────────────────────────────
export async function getState() {
  if (useBlob) return { ...DEFAULT_STATE, ...(await blobRead("state.json", {})) };
  return { ...DEFAULT_STATE, ...fileRead("state.json", {}) };
}

export async function setState(state) {
  if (useBlob) return blobWrite("state.json", state);
  fileWrite("state.json", state);
}

export async function saveSession(session) {
  const sessions = useBlob
    ? await blobRead("sessions.json", [])
    : fileRead("sessions.json", []);
  const i = sessions.findIndex((s) => s.id === session.id);
  if (i >= 0) sessions[i] = session;
  else sessions.push(session);
  if (useBlob) return blobWrite("sessions.json", sessions);
  fileWrite("sessions.json", sessions);
}

export async function getSessions(limit = 30) {
  const sessions = useBlob
    ? await blobRead("sessions.json", [])
    : fileRead("sessions.json", []);
  return sessions.slice(-limit).reverse(); // newest first
}
