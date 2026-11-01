// Deterministic session generation. The brain never generates workouts —
// it adjusts doses (state.progress) and suggests the day's shape
// (state.nextPlan); this engine assembles the session from the frozen library.
//
// Phase 2 (2026-10-02): seven-slot skeleton driven by the current block
// (lib/blocks.js) — squat, hinge, push, pull, carry, core-or-balance (plyo on
// alternate days in blocks that allow it), and a daily ATG knee slot. Every
// prescribed load is snapped to Eddie's real inventory (lib/inventory.js) and
// the card says how to build it. The day after a run, nothing high-knee-load
// and no plyos. Never two high-knee-load movements in one session.

import { MOVEMENTS, MOBILITY, byId, MEATWARE_SUBS, perSide } from "./library.js";
import { snapLoad } from "./inventory.js";
import { currentBlock } from "./blocks.js";
import { ranOn } from "./running.js";

const pick = (list, i) => (list.length ? list[((i % list.length) + list.length) % list.length] : null);

// Recent knee signal decides whether high-knee-load movements are on the menu.
// Conservative default: no high-load until there are 3 sessions of history
// with the latest knee ratings averaging 7+.
function kneeCleared(recentSessions) {
  const rated = recentSessions.filter((s) => typeof s.knee === "number").slice(0, 3);
  if (rated.length < 3) return false;
  return rated.reduce((a, s) => a + s.knee, 0) / rated.length >= 7;
}

const yesterdayOf = (date) =>
  new Date(new Date(`${date}T12:00:00`) - 86400000).toLocaleDateString("en-CA");

function dose(movement, progress, { meatware, lever }) {
  const p = progress[movement.id] || {};
  let weight = meatware ? null : p.weight ?? null;
  let how = null;
  let snapped = false;
  if (!meatware && movement.loadMode && movement.loadMode !== "none" && weight != null) {
    const s = snapLoad(movement.loadMode, weight);
    weight = s.weight;
    how = s.how;
    snapped = s.snapped;
  }
  if (movement.loadMode === "none" || !movement.loadMode) weight = null;
  // A bell movement is never bodyweight: no dose yet means the lighter bell.
  if (!meatware && movement.loadMode === "kb" && weight == null) {
    const s = snapLoad("kb", 1);
    weight = s.weight;
    how = s.how;
  }
  const tempo =
    lever === "tempo" && ["squat", "hinge", "push"].includes(movement.pattern) && !movement.ballistic && !movement.id.startsWith("mw_")
      ? "3s down, 2s pause at the hard point"
      : null;
  return {
    id: movement.id,
    name: movement.name,
    pattern: movement.pattern,
    sets: p.sets ?? movement.sets,
    reps: p.reps ?? movement.reps,
    unit: movement.unit,
    weight,
    how,       // "two 30s + ruck" — how to build the load from what he owns
    snapped,   // true when the brain asked for a load he can't build
    tempo,
    cues: movement.cues,
    perSide: perSide(movement.unit),
    kneeLoad: movement.kneeLoad,
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

// Keep at most one high-knee-load movement per session: later ones are
// replaced by a non-high movement from the same pattern (or core).
function oneHighMax(list, seed) {
  let seenHigh = false;
  return list.map((m) => {
    if (!m || m.kneeLoad !== "high") return m;
    if (!seenHigh) {
      seenHigh = true;
      return m;
    }
    // A displaced plyo gives its slot back to the carry it took; anything
    // else falls to a non-high movement of the same pattern, then to a carry.
    const fallbackPattern = m.pattern === "plyo" ? "carry" : m.pattern;
    const alt = MOVEMENTS.filter((x) => x.pattern === fallbackPattern && x.kneeLoad !== "high" && !x.retired);
    return pick(alt, seed) || pick(MOVEMENTS.filter((x) => x.pattern === "carry"), seed);
  });
}

// Core slot: rotate through what the trunk has to do — resist rotation,
// resist extension, produce rotation (tennis), resist side-bend, flex under
// load — so a week covers all five, not five days of planks.
const CORE_FOCUS_ORDER = ["antiRotation", "antiExtension", "rotation", "antiLateral", "flexion"];
function pickCore(seed, usable) {
  const focus = CORE_FOCUS_ORDER[seed % CORE_FOCUS_ORDER.length];
  const exact = MOVEMENTS.filter((m) => m.pattern === "core" && m.coreFocus === focus && usable(m));
  const any = MOVEMENTS.filter((m) => m.pattern === "core" && usable(m));
  return pick(exact.length ? exact : any, Math.floor(seed / CORE_FOCUS_ORDER.length));
}

export function generateSession({ dayType, flexibility, meatware, state, recentSessions, today }) {
  const cleared = kneeCleared(recentSessions);
  const afterRun = today ? ranOn(state.activityLog, yesterdayOf(today)) : false;
  const highOk = cleared && !afterRun;
  const seed = recentSessions.length; // deterministic variety: rotates with history
  const progress = state.progress || {};
  const block = currentBlock(state);

  const usable = (m) => m && !m.retired && (highOk || m.kneeLoad !== "high");
  const pool = (pattern, extra = () => true) =>
    MOVEMENTS.filter((m) => m.pattern === pattern && usable(m) && extra(m));
  const fromBlock = (ids, pattern, extra) => {
    const list = ids.map((id) => byId[id]).filter((m) => usable(m) && (!extra || extra(m)));
    return list.length ? list : pool(pattern, extra);
  };

  let exercises;
  if (dayType === "packed") {
    // ~15 min dense circuit. Real training, never a soft default.
    const lower =
      state.lastEmphasis === "squat"
        ? fromBlock(block.hinge, "hinge", (m) => m.packedOk)
        : fromBlock(block.squat, "squat", (m) => m.packedOk);
    exercises = [
      pick(lower, seed),
      pick(pool("push", (m) => m.packedOk), seed),
      pick(pool("pull", (m) => m.packedOk), seed),
      pick(fromBlock(block.atg, "atg", (m) => m.packedOk), seed),
    ];
  } else {
    // ~25 min honest container (Eddie, 2026-10-02: "stop pretending").
    const squats = fromBlock(block.squat, "squat");
    const hinges = fromBlock(block.hinge, "hinge");
    // Core is daily (Eddie, 2026-10-31: core over glutes). On plyo days the
    // bounce work takes the carry slot — a carry is loaded core anyway.
    const plyoDay = block.plyo && highOk && seed % 2 === 0;
    exercises = [
      pick(state.lastEmphasis === "squat" ? hinges : squats, seed),
      pick(state.lastEmphasis === "squat" ? squats : hinges, seed + 1),
      pick(pool("push"), seed),
      pick(pool("pull"), seed),
      plyoDay ? pick(pool("plyo"), seed) : pick(pool("carry"), seed),
      pickCore(seed, usable),
      pick(fromBlock(block.atg, "atg"), seed),
    ];
  }

  // The brain's nextPlan can replace the movement list — validated against the
  // library, the knee gate, the run rule, the block's plyo permission, and the
  // one-high-max rule. Session size may flex: packed 3-5, full 5-8. Anything
  // invalid is silently ignored (rules win). The ATG slot is a daily mandate:
  // a plan without one gets one appended.
  const planned = state.nextPlan?.movementIds;
  const [minLen, maxLen] = dayType === "packed" ? [3, 5] : [5, 8];
  if (Array.isArray(planned) && planned.length >= minLen && planned.length <= maxLen) {
    const swapped = planned.map((id) => byId[id]).filter(Boolean);
    const valid =
      swapped.length === planned.length &&
      swapped.every(usable) &&
      swapped.filter((m) => m.kneeLoad === "high").length <= 1 &&
      swapped.every((m) => m.pattern !== "plyo" || block.plyo) &&
      (dayType !== "packed" || swapped.every((m) => m.packedOk));
    if (valid) {
      exercises = swapped;
      // Daily mandates the brain's plan must carry: an ATG knee movement and
      // (full days) a core movement. Seven is the honest-container size: at
      // the cap, the mandate replaces a slot instead of growing the session.
      const cap = dayType === "packed" ? 4 : 7;
      const ensure = (test, make) => {
        if (exercises.some(test)) return;
        const m = make();
        if (!m) return;
        if (exercises.length >= cap) {
          // Replace the last movement that isn't itself a mandate.
          let i = exercises.length - 1;
          while (i > 0 && (exercises[i].pattern === "atg" || exercises[i].pattern === "core")) i -= 1;
          exercises[i] = m;
        } else exercises.push(m);
      };
      ensure((m) => m.pattern === "atg", () => pick(fromBlock(block.atg, "atg", (m) => dayType !== "packed" || m.packedOk), seed));
      if (dayType !== "packed") ensure((m) => m.pattern === "core", () => pickCore(seed, usable));
    }
  }

  exercises = oneHighMax(exercises.filter(Boolean), seed);

  // Meatware translation (strictly bodyweight, MEATWARE.md) — runs AFTER the
  // brain's plan so the day's focus survives. Weights are stripped for every
  // movement (phase 2 fix); the knee gate re-applies; duplicate subs collapse.
  if (meatware) {
    const seen = new Set();
    exercises = exercises
      .map((m) => MEATWARE_SUBS[m.id] || m)
      .filter((m) => highOk || m.kneeLoad !== "high")
      .filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }

  return {
    dayType,
    flexibility: !!flexibility,
    meatware: !!meatware,
    block: { key: block.key, name: block.name, lever: block.lever },
    afterRun,
    exercises: exercises.map((m) => dose(m, progress, { meatware, lever: block.lever })),
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
