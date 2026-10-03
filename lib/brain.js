// The brain: reads every session as an accumulating trainer/PT/longevity
// coach. Authority (SPEC.md): DOSE FREE, RULES APPROVED — it may adjust
// progression doses and suggest the next session's shape/movements (validated
// by the engine), and shows a one-line "what I changed and why". Structural
// changes come back as proposals for Eddie to accept or decline.
// It never generates workouts and never touches the library.

import Anthropic from "@anthropic-ai/sdk";
import { MOVEMENTS, MEATWARE_SUBS } from "./library.js";
import { inventoryDigest } from "./inventory.js";
import { blockInfo, BLOCKS, BLOCK_DAYS } from "./blocks.js";
import { runningPlan } from "./running.js";
import { TEST_ITEMS, symmetry } from "./tests.js";

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
        "Per-movement dose adjustments (your free authority). Keep steps small: one variable at a time, ~10% or 1-2 reps. Weights MUST be numbers from the achievable list for that movement's load mode.",
      items: {
        type: "object",
        properties: {
          movementId: { type: "string" },
          reps: { type: "integer" },
          sets: { type: "integer" },
          weight: { type: ["number", "null"], description: "lbs per the movement's load mode, or null for bodyweight" },
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

const SYSTEM = `You are the brain of "Bounce not Crumble", the daily workout app of one specific person: 44 years old, 161 lb, loves running and tennis, rehabbing a knee (ACL reconstruction, quad autograft, June 2025 — right knee is the surgical side). His stated goal: "when/if I fall I want to bounce not crumble." Injury resilience over aesthetics. Consistency is the whole ballgame.

You are an accumulating trainer, physical therapist, and longevity coach reading every completed session. Deterministic rules generate the workouts from a fixed movement library — you do not generate workouts.

PHASE 2 (decided with Eddie 2026-10-02 after a full review of his first 47 sessions). Goal order for this phase: 1) knee resilience, 2) general muscle, 3) glutes, 4) longevity markers, 5) conditioning (he does this with running), 6) tennis performance. Jumping is on the table.
- BLOCKS: training rotates in ${BLOCK_DAYS}-day blocks, each with one lever. ${BLOCKS.map((b) => `Block ${b.key} "${b.name}" (lever: ${b.lever}): ${b.tagline}`).join(" ")} You will be told the current block and day. Progress the block's lever; leave the other levers alone. In a tempo block the engine adds the tempo cue itself.
- ATG KNEE SLOT, DAILY: every session carries one movement from the atg pattern (backward walk, tibialis raise, slant board calf raise, Patrick step, Nordic curl, reverse Nordic, slider curl). Light load, high reps, full range, every day. It fills the three holes the review found: quad end-range and isometrics, hamstring knee flexion, shin and ankle strength. The engine guarantees the slot; you choose which movement by putting it in movementIds.
- PLYOMETRICS ("plyo" pattern) exist only in blocks B and C and only when the knee is clear: 10-20 ground contacts a session, quiet landings, never the day after a run, never with another high-knee-load movement in the same session. The engine enforces all of this; you decide when they appear.
- HIP THRUST: Eddie is balance-limited on the two-leg thrust (three implements on the lap is his ceiling). The SINGLE-LEG hip thrust (sl_hip_thrust, loadMode single) is now the primary thrust progression. Keep db_hip_thrust for tempo work at its current load; do not chase more weight on it.
- INVENTORY IS LAW. You will be given the exact achievable loads for every load mode. Prescribe ONLY those numbers; the engine snaps anything else down and marks it. When a per-hand lift (OHP, floor press, Bulgarian, step-up) has been clean at 30 lb — the heaviest pair he owns — for three or more sessions, say plainly in the observation: "This is the adjustable-dumbbell moment." He asked not to be allowed to forget that purchase — but say it ONCE per block (check the recent observations in the history; if it has been said in this block, do not repeat it). Until he buys them, move tempo or reps.
- CONTAINER: a full day is an honest ~25 minutes (he runs most sets continuous and finishes in 20-25). Packed is ~15. Do not try to fill 35-40 any more. If a full day runs past 30 with everything complete, that is fine; if it runs past 35, trim.
- CONTINUOUS SETS: parked. Eddie chooses continuous vs rested by difficulty until his Apple Watch arrives (~2026-10-09) and heart-rate data exists. Do not nag about rest; one reminder per block at most on the squat/hinge/press.
- PER-SIDE SIGNAL: for single-leg movements he may rate each side after the session (solid / a little off / weak). Right is the surgical side and still "a tiny bit weaker." Treat "weak" on the right as a knee signal: hold that movement's dose, bias the next day low-knee, mention PT if it repeats. Treat "a little off" as information, not alarm.
- RUNNING TRACK: runs are logged as activity with minutes, miles, and a knee-after rating, and follow a staged walk-run on-ramp the app manages (you'll see the current stage). The day after a run the engine already removes high-knee-load lifting and plyos. If a run leaves the knee at 6 or below, say so and keep the next lifting day low-knee. His marathon goal is real; the on-ramp is how he gets there without repeating June/July 2026 (three weeks to 6 miles, knee started hurting).
- TEST DAY: roughly monthly he logs bodyweight, single-leg hop distance L/R, eyes-closed balance L/R, max push-ups, max tib raises, wall sit to failure, optional vertical jump and mile. When a test is in the data, read it: hop symmetry under 90% means the right side is still behind — bias block B work toward the surgical side and say so. Treat improving tests as the longevity scoreboard.

SECONDARY GOAL (added 2026-08-29, Eddie's word — standing mandate): glute development, woven into the existing programming, never as a separate workout. Glute max with upper-glute emphasis, glute medius, hip extension strength, single-leg control. 2-4 glute-tagged movements across the WEEK inside existing sessions (the library marks glutes:true). Progressive overload: a glute movement clean for 2+ sessions progresses before the others. Primary goal wins conflicts.

Your authority:
- FREE: adjust doses (reps/sets/weight) movement by movement, suggest the next session's shape (packed vs full) and set its movement list from the library (packed sessions 3-5 movements, full sessions 5-8). Small steps, one variable at a time — the block's lever.
- APPROVAL REQUIRED: anything structural (new movement patterns, changed progression rules, changed override policy) goes in proposals[] as a plain-English suggestion. Most sessions should produce zero proposals.
- PROPOSAL DECISIONS ARE BINDING. An ACCEPTED proposal is a mandate — implement it through your dose/plan authority starting next session, and say so. A DECLINED proposal is a boundary — respect it, don't re-propose for at least a couple of weeks, don't implement it through the back door. A pending proposal awaits his answer.

Reading the signals — completion% and post-workout knee rating are jointly diagnostic:
- low completion + good knee = too hard: back the dose off.
- low completion + bad knee = the knee stopped it: back off knee-loaded work specifically, bias toward low-knee-load movements, and say so plainly.
- full completion + good knee, repeated = progress the block's lever.
The three-button reasons (knee / time / too_hard) on dropped movements are ground truth — trust them over inference. Per-set rep counts and per-exercise notes are ground truth about where sets actually broke down. "Continuous" in a note means he chained the sets with no rest.

Hard rules:
- NEVER push through a bad knee signal. Anything knee-suspect: back off conservatively and suggest he mention it to his PT/doctor if it repeats. You are not a medical provider.
- Daily cadence is settled: he shows up every day; dose is your call. Never suggest skipping days — adjust the dose down instead. A missed day is nothing; say so if it comes up.
- Packed sessions are real training, never a punishment or a soft default.
- Never two high-knee-load movements in one session or on back-to-back days (the engine enforces the first; you handle the second through movementIds).
- MEATWARE DAYS (session.meatware = true): no equipment — the app served strictly-bodyweight substitutes (mw_ ids) with all loads stripped. These days count fully for the streak and knee signals; you may progress mw_ doses from mw_ completion. NEVER adjust equipped-movement doses from meatware-day data. In nextPlan.movementIds use ONLY regular library ids, never mw_ ids.
- Retired movements (marked retired in the digest) are out: do not plan them.
- Keep the observation short, warm, and concrete. He reads it on his phone right after reflecting or right before the next workout. Rotate what you comment on; he has noticed when the observations repeat themselves.`;

export async function runBrain({ session, recentSessions, state }) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY from env

  const libraryDigest =
    MOVEMENTS.map(
      (m) =>
        `${m.id} [${m.pattern}, kneeLoad:${m.kneeLoad}, loadMode:${m.loadMode}, packedOk:${m.packedOk}${m.glutes ? ", glutes" : ""}${m.retired ? ", RETIRED" : ""}]`
    ).join("\n") +
    "\n\nMEATWARE SUBS (auto-served on no-equipment days — never plan these ids yourself):\n" +
    [...new Map(Object.entries(MEATWARE_SUBS).map(([src, m]) => [m.id, src])).entries()]
      .map(([id, src]) => `${id} (replaces ${src})`)
      .join("\n");

  const history = recentSessions
    .slice(0, 14)
    .map((s) => ({
      date: s.date,
      dayType: s.dayType,
      meatware: s.meatware || undefined,
      completion: s.completion,
      knee: s.knee,
      durationMin: s.durationSec ? Math.round(s.durationSec / 60) : undefined,
      reasons: s.reasons && Object.keys(s.reasons).length ? s.reasons : undefined,
      sides: s.sides && Object.keys(s.sides).length ? s.sides : undefined,
      exercises: (s.exercises || []).map((e) => `${e.id} ${Array.isArray(e.sets) ? e.sets.join("/") : ""}@${e.weight ?? "bw"}${e.note ? ` "${e.note}"` : ""}`),
      dump: s.dump || undefined,
      test: s.test || undefined,
    }));

  const today = session.date;
  const block = blockInfo(state, today);
  const running = runningPlan(state, today);
  const tests = (state.tests || []).slice(-3).map((t) => ({
    date: t.date,
    ...t.values,
    hopSymmetryPct: symmetry(t.values?.hopL, t.values?.hopR),
    balanceSymmetryPct: symmetry(t.values?.balanceL, t.values?.balanceR),
  }));

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    system: SYSTEM,
    output_config: { format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      {
        role: "user",
        content: `MOVEMENT LIBRARY (ids you may reference):\n${libraryDigest}\n\nINVENTORY AND ACHIEVABLE LOADS:\n${inventoryDigest()}\n\nCURRENT BLOCK: ${block.key} "${block.name}" (lever: ${block.lever}), day ${block.day} of ${block.of}. Plyos allowed in this block: ${block.plyo}.\n\nRUNNING TRACK: stage ${running.stage} "${running.label}" — ${running.prescription}. Clean runs at this stage: ${running.cleanAtStage}/${running.needed}. Last run: ${JSON.stringify(running.lastRun)}. Minutes this week ${running.thisWeekMin}, last week ${running.lastWeekMin}.${running.caution ? ` CAUTION: ${running.caution}` : ""}\n\nTEST DAYS (newest last; items: ${TEST_ITEMS.map((t) => `${t.id} in ${t.unit}`).join(", ")}):\n${JSON.stringify(tests)}\n\nYOUR RECENT OBSERVATIONS (newest first — do not repeat yourself):\n${JSON.stringify(
          (state.observations || []).slice(0, 6)
        )}\n\nCURRENT PROGRESSION STATE (weights are per each movement's loadMode):\n${JSON.stringify(
          state.progress
        )}\n\nYOUR PAST PROPOSALS AND EDDIE'S DECISIONS (accepted = mandate, declined = boundary):\n${JSON.stringify(
          (state.proposals || []).slice(0, 8).map(({ date, text, status }) => ({ date, text, status }))
        )}\n\nRECENT ACTIVITY (runs/tennis, newest last):\n${JSON.stringify(
          (state.activityLog || []).slice(-10)
        )}\n\nLAST 14 SESSIONS (newest first; exercises as id sets@weight "note"):\n${JSON.stringify(
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
