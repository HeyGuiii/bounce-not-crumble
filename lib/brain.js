// The brain: reads every session as an accumulating trainer/PT/longevity
// coach. Authority (SPEC.md): DOSE FREE, RULES APPROVED — it may adjust
// progression doses and suggest the next session's shape/movements (validated
// by the engine), and shows a one-line "what I changed and why". Structural
// changes come back as proposals for Eddie to accept or decline.
// It never generates workouts and never touches the library.

import Anthropic from "@anthropic-ai/sdk";
import { MOVEMENTS } from "./library.js";

const SCHEMA = {
  type: "object",
  properties: {
    observation: {
      type: "string",
      description:
        "2-4 sentences Eddie sees when he next opens the app: what today's session showed, and the one thing that matters going forward. Warm, direct, no fluff.",
    },
    changed: {
      type: "string",
      description:
        "One line: what you changed for next time and why (e.g. 'Goblet squat to 3x10 — two clean sessions at 8'). Empty string if nothing changed.",
    },
    nextPlan: {
      type: "object",
      properties: {
        dayType: { type: "string", enum: ["packed", "full"] },
        note: { type: "string" },
        movementIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional full replacement of the next session's movement list, using ONLY ids from the library. Omit by passing [] to accept the engine's defaults.",
        },
      },
      required: ["dayType", "note", "movementIds"],
      additionalProperties: false,
    },
    doseChanges: {
      type: "array",
      description:
        "Per-movement dose adjustments (your free authority). Keep steps small: one variable at a time, ~10% or 1-2 reps.",
      items: {
        type: "object",
        properties: {
          movementId: { type: "string" },
          reps: { type: "integer" },
          sets: { type: "integer" },
          weight: { type: ["number", "null"], description: "lbs, or null for bodyweight" },
        },
        required: ["movementId", "reps", "sets", "weight"],
        additionalProperties: false,
      },
    },
    proposals: {
      type: "array",
      description:
        "RARE. Structural changes needing Eddie's approval: new movement patterns, progression-rule changes, override-policy changes. Most sessions produce none.",
      items: { type: "string" },
    },
  },
  required: ["observation", "changed", "nextPlan", "doseChanges", "proposals"],
  additionalProperties: false,
};

const SYSTEM = `You are the brain of "Bounce not Crumble", the daily workout app of one specific person: 44 years old, loves running and tennis, hates weights, rehabbing a knee (ACL reconstruction, quad autograft, June 2025). His stated goal: "when/if I fall I want to bounce not crumble." Injury resilience over aesthetics. Consistency is the whole ballgame.

You are an accumulating trainer, physical therapist, and longevity coach reading every completed session. Deterministic rules generate the workouts from a fixed movement library — you do not generate workouts.

Your authority:
- FREE: adjust doses (reps/sets/weight) movement by movement, suggest the next session's shape (packed vs full) and set its movement list from the library (packed sessions 3-5 movements, full sessions 5-8). Small steps, one variable at a time.
- APPROVAL REQUIRED: anything structural (new movement patterns, changed progression rules, changed override policy) goes in proposals[] as a plain-English suggestion. Most sessions should produce zero proposals.
- PROPOSAL DECISIONS ARE BINDING. You will see your past proposals with Eddie's decisions. An ACCEPTED proposal is a mandate — implement it through your dose/plan authority starting with the next session, and say so in your observation. A DECLINED proposal is a boundary — respect it, don't re-propose it for at least a couple of weeks, and don't implement it through the back door. A pending proposal awaits his answer; don't act on it yet.

Reading the signals — completion% and post-workout knee rating are jointly diagnostic:
- low completion + good knee = too hard: back the dose off.
- low completion + bad knee = the knee stopped it: back off knee-loaded work specifically, bias toward low-knee-load movements, and say so plainly.
- full completion + good knee, repeated = progress the dose.
The three-button reasons (knee / time / too_hard) on dropped movements are ground truth — trust them over inference.

Hard rules:
- NEVER push through a bad knee signal. Anything knee-suspect: back off conservatively and suggest he mention it to his PT/doctor if it repeats. You are not a medical provider.
- Daily cadence is settled: he shows up every day; dose is your call. Never suggest skipping days — adjust the dose down instead.
- Packed sessions are real training, never a punishment or a soft default.
- Runs and tennis in the activity log are context: lighten lower-body dose the day after hard ones if the signals agree.
- Session duration is a signal: packed targets ~20 min, full ~35-40 min. If packed days consistently run long, the dose is too big for the container — trim it. If full days consistently run short with full completion, there's room to add. Per-set rep counts and per-exercise notes are ground truth about where sets actually broke down.
- Keep the observation short, warm, and concrete. He reads it on his phone right after reflecting or right before the next workout.`;

export async function runBrain({ session, recentSessions, state }) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY from env

  const libraryDigest = MOVEMENTS.map(
    (m) => `${m.id} [${m.pattern}, kneeLoad:${m.kneeLoad}, packedOk:${m.packedOk}]`
  ).join("\n");

  const history = recentSessions
    .slice(0, 14)
    .map((s) => ({
      date: s.date,
      dayType: s.dayType,
      completion: s.completion,
      knee: s.knee,
      durationMin: s.durationSec ? Math.round(s.durationSec / 60) : undefined,
      reasons: s.reasons,
      exerciseNotes: Object.fromEntries(
        (s.exercises || []).filter((e) => e.note).map((e) => [e.id, e.note])
      ),
      dump: s.dump || undefined,
    }));

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `MOVEMENT LIBRARY (ids you may reference):\n${libraryDigest}\n\nCURRENT PROGRESSION STATE:\n${JSON.stringify(
          state.progress
        )}\n\nYOUR PAST PROPOSALS AND EDDIE'S DECISIONS (accepted = mandate, declined = boundary):\n${JSON.stringify(
          (state.proposals || []).slice(0, 8).map(({ date, text, status }) => ({ date, text, status }))
        )}\n\nRECENT ACTIVITY (runs/tennis):\n${JSON.stringify(
          (state.activityLog || []).slice(-10)
        )}\n\nLAST 14 SESSIONS (newest first):\n${JSON.stringify(
          history
        )}\n\nTODAY'S COMPLETED SESSION:\n${JSON.stringify(
          session
        )}\n\nRead today's session against the history and respond per your instructions.`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("brain refused");
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  return JSON.parse(text);
}
