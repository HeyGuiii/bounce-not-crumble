// Storage: Postgres on Vercel (POSTGRES_URL set), JSON files in local dev.
// Two surfaces only: an append-only sessions log, and a single state blob
// (progression, streaks, brain observations, proposals).

import fs from "fs";
import path from "path";

const usePg = !!process.env.POSTGRES_URL;
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

// ── Postgres driver (Vercel) ────────────────────────────────────
let pgReady = null;
async function pg() {
  const { sql } = await import("@vercel/postgres");
  if (!pgReady) {
    pgReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT now(), data JSONB NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, data JSONB NOT NULL)`;
    })();
  }
  await pgReady;
  return sql;
}

// ── Public API ──────────────────────────────────────────────────
export async function getState() {
  if (usePg) {
    const sql = await pg();
    const { rows } = await sql`SELECT data FROM state WHERE key = 'main'`;
    return rows[0] ? { ...DEFAULT_STATE, ...rows[0].data } : { ...DEFAULT_STATE };
  }
  return { ...DEFAULT_STATE, ...fileRead("state.json", {}) };
}

export async function setState(state) {
  if (usePg) {
    const sql = await pg();
    await sql`INSERT INTO state (key, data) VALUES ('main', ${JSON.stringify(state)})
              ON CONFLICT (key) DO UPDATE SET data = ${JSON.stringify(state)}`;
    return;
  }
  fileWrite("state.json", state);
}

export async function saveSession(session) {
  if (usePg) {
    const sql = await pg();
    await sql`INSERT INTO sessions (id, data) VALUES (${session.id}, ${JSON.stringify(session)})
              ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(session)}`;
    return;
  }
  const sessions = fileRead("sessions.json", []);
  const i = sessions.findIndex((s) => s.id === session.id);
  if (i >= 0) sessions[i] = session;
  else sessions.push(session);
  fileWrite("sessions.json", sessions);
}

export async function getSessions(limit = 30) {
  if (usePg) {
    const sql = await pg();
    const { rows } = await sql`SELECT data FROM sessions ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map((r) => r.data);
  }
  const sessions = fileRead("sessions.json", []);
  return sessions.slice(-limit).reverse(); // newest first, matching pg
}
