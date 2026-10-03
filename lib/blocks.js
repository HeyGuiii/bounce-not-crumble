// Training blocks (phase 2, Eddie's call 2026-10-02): rotate in two-to-three
// week blocks. Every block keeps the same seven-slot skeleton — squat, hinge,
// push, pull, carry, core-or-balance, ATG knee slot — and changes which
// movements fill the slots and which lever moves them. Sameness builds the
// adaptation; the rotation keeps him interested ("living in the gray").

export const BLOCK_DAYS = 17; // ~2.5 weeks

export const BLOCKS = [
  {
    key: "A",
    name: "Load",
    lever: "load",
    tagline: "Buy progress with weight. Eight to twelve reps. Rest between sets on the squat, hinge and press — the rest can chain.",
    squat: ["box_squat", "goblet_squat", "slant_squat"],
    hinge: ["db_rdl", "kb_deadlift", "sl_hip_thrust"],
    atg: ["backward_walk", "tib_raise", "slant_calf_raise", "nordic_curl"],
    plyo: false,
  },
  {
    key: "B",
    name: "Single-leg & spring",
    lever: "single-leg",
    tagline: "One leg at a time, and the first landings. Small doses of bounce — quiet feet, stick every landing.",
    squat: ["bulgarian_split_squat", "step_up", "atg_split_squat", "split_squat"],
    hinge: ["sl_hip_thrust", "sl_rdl_reach", "db_hip_thrust"],
    atg: ["patrick_step", "nordic_curl", "reverse_nordic", "slider_curl"],
    plyo: true,
  },
  {
    key: "C",
    name: "Tempo & range",
    lever: "tempo",
    tagline: "Same loads, three seconds down, two-second pause at the hard point. Deeper, not heavier.",
    squat: ["slant_squat", "box_squat", "bulgarian_split_squat"],
    hinge: ["db_rdl", "db_hip_thrust", "sl_hip_thrust"],
    atg: ["backward_walk", "slant_calf_raise", "reverse_nordic", "tib_raise"],
    plyo: true,
  },
];

const DAY = 86400000;
export const daysBetween = (a, b) =>
  Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / DAY);

// Initialize or advance state.block. Returns true when state changed.
export function ensureBlock(state, today) {
  if (!state.block) {
    state.block = { index: 0, key: BLOCKS[0].key, startDate: today, history: [] };
    return true;
  }
  const age = daysBetween(state.block.startDate, today);
  if (age >= BLOCK_DAYS) {
    const next = (state.block.index + 1) % BLOCKS.length;
    state.block = {
      index: next,
      key: BLOCKS[next].key,
      startDate: today,
      history: [...(state.block.history || []), { key: state.block.key, startDate: state.block.startDate, endDate: today }].slice(-12),
    };
    return true;
  }
  return false;
}

export function currentBlock(state) {
  return BLOCKS[state.block?.index ?? 0];
}

export function blockInfo(state, today) {
  const b = currentBlock(state);
  const day = state.block ? daysBetween(state.block.startDate, today) + 1 : 1;
  return { key: b.key, name: b.name, lever: b.lever, tagline: b.tagline, day: Math.max(1, day), of: BLOCK_DAYS, plyo: b.plyo };
}
