// Eddie's real equipment (confirmed 2026-10-02). The brain prescribed loads he
// didn't own at least five times (35s, a pair of 40s, 15s, a 100 lb RDL) — it
// caused both of his non-100% sessions. From here every prescribed load is
// snapped to something he can actually build, and the card says how to build it.
//
// REMINDER (Eddie's ask, 2026-10-02): adjustable dumbbells are the deferred
// purchase. When a per-hand movement is capped at 30 lb, that's the moment.

export const INVENTORY = {
  dumbbellPairs: [10, 25, 30],   // two of each
  dumbbellSingles: [40],         // one of each
  kettlebells: [25, 35],
  ruck: 25,                      // 25 lb rucksack — wearable or on the lap
  bands: true,
  slantBoard: true,              // ordered 2026-10-02, arrives 2026-10-03
  bench: false,
  pullupBar: false,
};

const RUCK = INVENTORY.ruck;

// Every single implement he can hold in one hand (or hug): dumbbells + bells.
const SINGLES = [
  ...INVENTORY.dumbbellPairs,
  ...INVENTORY.dumbbellSingles,
  ...INVENTORY.kettlebells,
].sort((a, b) => a - b);

function uniqSorted(list) {
  return [...new Set(list)].sort((a, b) => a - b);
}

// Load modes — what the `weight` number on a movement MEANS, and what values
// it can take. The engine snaps requested weights to these lists.
//
//   perHand : one dumbbell in each hand, number = per hand (OHP, floor press,
//             Bulgarian, step-up). Only matched pairs count.
//   single  : one implement held or placed, number = that implement (+ ruck
//             worn): goblet, box squat, suitcase carry, single-arm row,
//             single-leg hip thrust on the lap, slant squat.
//   pair    : two matched implements, number = total (+ ruck worn): RDL,
//             farmer carry, calf raise.
//   stack   : implements stacked on the lap, number = total (+ ruck): two-leg
//             hip thrust. Up to three implements — his stated balance ceiling.
//   ruck    : bodyweight or bodyweight + ruck (push-up, plank, wall sit,
//             glute bridge, backward walk).
//   none    : bodyweight only — weight is always null.
function build(mode) {
  const options = []; // { total, how }
  const push = (total, how) => options.push({ total, how });
  if (mode === "perHand") {
    for (const w of INVENTORY.dumbbellPairs) push(w, `${w}s, one per hand`);
  } else if (mode === "single") {
    for (const w of SINGLES) {
      const kind = INVENTORY.kettlebells.includes(w) && !INVENTORY.dumbbellPairs.includes(w) && !INVENTORY.dumbbellSingles.includes(w) ? "kettlebell" : "dumbbell";
      push(w, `${w} lb ${kind}`);
      push(w + RUCK, `${w} lb ${kind} + ruck`);
    }
  } else if (mode === "pair") {
    for (const w of INVENTORY.dumbbellPairs) {
      push(w * 2, `two ${w}s`);
      push(w * 2 + RUCK, `two ${w}s + ruck`);
    }
  } else if (mode === "stack") {
    // Subsets of up to three implements from the full pool (pairs count twice).
    const pool = [
      ...INVENTORY.dumbbellPairs.flatMap((w) => [w, w]),
      ...INVENTORY.dumbbellSingles,
      ...INVENTORY.kettlebells,
    ];
    const seen = new Map();
    const n = pool.length;
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n + 1; j++) {
        for (let k = j; k < n + 1; k++) {
          const picks = [pool[i], j < n ? pool[j] : null, k < n ? pool[k] : null].filter((x) => x != null);
          // j===i or k===j would double-use one implement — only legal for pairs.
          const counts = {};
          for (const p of picks) counts[p] = (counts[p] || 0) + 1;
          const legal = Object.entries(counts).every(([w, c]) => c <= pool.filter((x) => x === Number(w)).length);
          if (!legal) continue;
          const total = picks.reduce((a, b) => a + b, 0);
          const how = picks.map((p) => `${p}`).join(" + ");
          if (!seen.has(total)) seen.set(total, how);
          if (!seen.has(total + RUCK)) seen.set(total + RUCK, `${how} + ruck`);
        }
      }
    }
    for (const [total, how] of seen) push(total, how);
  } else if (mode === "ruck") {
    push(RUCK, "ruck on");
  }
  // Dedup by total, keep the first description, sort ascending.
  const byTotal = new Map();
  for (const o of options) if (!byTotal.has(o.total)) byTotal.set(o.total, o.how);
  return [...byTotal.entries()].map(([total, how]) => ({ total, how })).sort((a, b) => a.total - b.total);
}

const CACHE = {};
export function achievable(mode) {
  if (!mode || mode === "none") return [];
  return (CACHE[mode] ||= build(mode));
}

// Snap a requested load to the largest achievable load at or below it (or the
// smallest achievable if the request is below everything). null stays null.
// Returns { weight, how, snapped }.
export function snapLoad(mode, requested) {
  if (requested == null || !mode || mode === "none") return { weight: null, how: null, snapped: false };
  const list = achievable(mode);
  if (!list.length) return { weight: null, how: null, snapped: requested != null };
  const exact = list.find((o) => o.total === requested);
  if (exact) return { weight: exact.total, how: exact.how, snapped: false };
  const below = [...list].reverse().find((o) => o.total < requested);
  const pick = below || list[0];
  return { weight: pick.total, how: pick.how, snapped: true };
}

export function maxLoad(mode) {
  const list = achievable(mode);
  return list.length ? list[list.length - 1].total : null;
}

// Plain-English digest for the brain prompt.
export function inventoryDigest() {
  const line = (mode) => achievable(mode).map((o) => `${o.total} (${o.how})`).join(", ");
  return [
    `Dumbbells: pairs of ${INVENTORY.dumbbellPairs.join(", ")}; one single ${INVENTORY.dumbbellSingles.join(", ")}. Kettlebells: ${INVENTORY.kettlebells.join(", ")}. Ruck: ${RUCK} lb. Bands. Slant board. NO bench, NO pull-up bar, NO adjustable dumbbells (deferred purchase — remind him when a per-hand lift is capped at 30).`,
    `Achievable loads by mode — prescribe ONLY these numbers (the engine snaps anything else down):`,
    `  perHand (OHP, floor press, Bulgarian, step-up, split squat): ${line("perHand")}`,
    `  single (goblet, box squat, suitcase carry, DB row, single-leg hip thrust, slant squat): ${line("single")}`,
    `  pair (RDL, farmer carry, calf raise): ${line("pair")}`,
    `  stack (two-leg hip thrust on the lap, max three implements): ${line("stack")}`,
    `  ruck (push-up, plank, wall sit, glute bridge, backward walk): bodyweight (null) or ${RUCK}`,
  ].join("\n");
}
