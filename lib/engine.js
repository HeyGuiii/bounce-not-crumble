// Deterministic session generation. The brain never generates workouts —
// it adjusts doses (state.progress) and suggests the day's shape
// (state.nextPlan); this engine assembles the session from the frozen library.

import { MOVEMENTS, MOBILITY, byId } from "./library.js";

const pick = (list, i) => list[i % list.length];

// Recent knee signal decides whether high-knee-load movements are on the menu.
// Conservative default: no high-load until there are 3 sessions of history
// with the latest knee ratings averaging 7+.
function kneeCleared(recentSessions) {
  const rated = recentSessions.filter((s) => typeof s.knee === "number").slice(0, 3);
  if (rated.length < 3) return false;
  return rated.reduce((a, s) => a + s.knee, 0) / rated.length >= 7;
}

function dose(movement, progress) {
  const p = progress[movement.id] || {};
  return {
    id: movement.id,
    name: movement.name,
    pattern: movement.pattern,
    sets: p.sets ?? movement.sets,
    reps: p.reps ?? movement.reps,
    unit: movement.unit,
    weight: p.weight ?? null, // null = bodyweight / Eddie's choice
    cues: movement.cues,
  };
}

// Count consecutive packed sessions from the top of history.
export function packedStreak(recentSessions) {
  let n = 0;
  for (const s of recentSessions) {
    if (s.dayType === "packed") n += 1;
    else break;
  }
  return n;
}

export function generateSession({ dayType, flexibility, state, recentSessions }) {
  const cleared = kneeCleared(recentSessions);
  const seed = recentSessions.length; // deterministic variety: rotates with history
  const progress = state.progress || {};

  const pool = (pattern, extra = () => true) =>
    MOVEMENTS.filter(
      (m) => m.pattern === pattern && (cleared || m.kneeLoad !== "high") && extra(m)
    );

  let exercises;
  if (dayType === "packed") {
    // ~20 min dense circuit, minimal setup. Real training, never a soft default.
    const lower =
      state.lastEmphasis === "squat"
        ? pool("hinge", (m) => m.packedOk)
        : pool("squat", (m) => m.packedOk);
    exercises = [
      pick(lower, seed),
      pick(pool("push", (m) => m.packedOk), seed),
      pick(pool("pull", (m) => m.packedOk), seed),
      pick(pool(seed % 2 ? "core" : "balance", (m) => m.packedOk), seed),
    ];
  } else {
    // ~35-40 min, loaded work front and center (muscle is armor).
    const squats = pool("squat", (m) => m.loaded || !cleared);
    const hinges = pool("hinge", (m) => m.loaded || !cleared);
    exercises = [
      pick(state.lastEmphasis === "squat" ? hinges : squats, seed),
      pick(state.lastEmphasis === "squat" ? squats : hinges, seed + 1),
      pick(pool("push"), seed),
      pick(pool("pull"), seed),
      pick(pool("carry"), seed),
      pick(pool(seed % 2 ? "balance" : "core"), seed),
    ];
  }

  // The brain's nextPlan can replace the movement list — validated against the
  // library and the knee gate. Session size may flex within bounds (its dose
  // authority covers volume): packed 3-5 movements, full 5-8. Anything invalid
  // is silently ignored (rules win).
  const planned = state.nextPlan?.movementIds;
  const [minLen, maxLen] = dayType === "packed" ? [3, 5] : [5, 8];
  if (Array.isArray(planned) && planned.length >= minLen && planned.length <= maxLen) {
    const swapped = planned.map((id) => byId[id]).filter(Boolean);
    if (
      swapped.length === planned.length &&
      swapped.every((m) => cleared || m.kneeLoad !== "high") &&
      (dayType !== "packed" || swapped.every((m) => m.packedOk))
    ) {
      exercises = swapped;
    }
  }

  return {
    dayType,
    flexibility: !!flexibility,
    exercises: exercises.filter(Boolean).map((m) => dose(m, progress)),
    mobility: flexibility ? MOBILITY : [],
    format: dayType === "packed" ? "circuit" : "sets",
  };
}

// Override rule (SPEC.md): 3 consecutive packed days → serve full as the
// default, with a visible note. Eddie can still override the override.
export function suggestDayType(state, recentSessions) {
  const streak = packedStreak(recentSessions);
  if (streak >= 3) {
    return {
      dayType: "full",
      note: `That's ${streak} packed days in a row — serving the full session today. Muscle is armor.`,
    };
  }
  const brainSuggestion = state.nextPlan?.dayType;
  if (brainSuggestion === "packed" || brainSuggestion === "full") {
    return { dayType: brainSuggestion, note: state.nextPlan?.note || null };
  }
  return { dayType: "full", note: null };
}
