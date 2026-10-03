// Monthly test day (phase 2, Eddie's "Absolutely!" 2026-10-02). Replaces one
// workout about every four weeks. No equipment beyond a tape measure and a
// wall. Every item is something the knee review said the app could not see:
// symmetry, max capacity, and a starting line for the longevity experiment.

export const TEST_INTERVAL_DAYS = 28;

export const TEST_ITEMS = [
  { id: "bodyweight", label: "Bodyweight", unit: "lb", hint: "Morning, before food if you can" },
  { id: "hopL", label: "Single-leg hop, LEFT", unit: "inches", side: "L", hint: "Stand on one foot, hop forward as far as you can, stick the landing. Best of three. Measure toe to heel" },
  { id: "hopR", label: "Single-leg hop, RIGHT", unit: "inches", side: "R", hint: "Same. This is the surgical side — the gap between L and R is the number that matters" },
  { id: "balanceL", label: "Eyes-closed balance, LEFT", unit: "seconds", side: "L", hint: "Eyes shut, hands on hips, stop the clock when the other foot touches. Max 60" },
  { id: "balanceR", label: "Eyes-closed balance, RIGHT", unit: "seconds", side: "R", hint: "Same" },
  { id: "pushups", label: "Max push-ups", unit: "reps", hint: "One set, full range, no rest at the top" },
  { id: "tibRaises", label: "Max tibialis raises", unit: "reps", hint: "Back against the wall, feet a foot out, toes up until they stop coming up" },
  { id: "wallSit", label: "Wall sit to failure", unit: "seconds", hint: "Thighs parallel, no hands. Stop when form breaks" },
  { id: "jumpReach", label: "Vertical jump", unit: "inches", optional: true, hint: "Chalk or tape: standing reach vs jump reach, both feet. Optional" },
  { id: "mile", label: "One mile", unit: "min:sec", optional: true, text: true, hint: "Only once you're running continuously. Optional" },
];

export function testDue(state, today) {
  const tests = state.tests || [];
  if (!tests.length) return { due: true, daysSince: null, last: null };
  const last = tests[tests.length - 1];
  const days = Math.round((new Date(`${today}T12:00:00`) - new Date(`${last.date}T12:00:00`)) / 86400000);
  return { due: days >= TEST_INTERVAL_DAYS, daysSince: days, last };
}

export const symmetry = (l, r) =>
  l && r ? Math.round((100 * Math.min(l, r)) / Math.max(l, r)) : null;
