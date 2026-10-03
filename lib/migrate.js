// One-time state migrations. Each runs once, guarded by a stamp in state.
// Phase 2 (2026-10-02): the load-mode model made two historical weights
// ambiguous — they were logged per hand but the movement's mode is "pair"
// (total). Fixing them here so the first phase-2 serve is honest.

export function migrateState(state) {
  let changed = false;
  state.progress ||= {};
  if (!state.migrations?.phase2) {
    const p = state.progress;
    // Calf raise: logged "30" meaning two 30s (+ ruck in his notes since 09-06).
    if (p.calf_raise && p.calf_raise.weight != null && p.calf_raise.weight <= 40) {
      p.calf_raise = { ...p.calf_raise, weight: 85 };
    }
    // Step-up: logged "25" meaning the ruck, done with 10s in hand. perHand = 10.
    if (p.step_up && p.step_up.weight === 25) {
      p.step_up = { ...p.step_up, weight: 10 };
    }
    // Band row carried a dumbbell weight from improvised rows; it's a band row.
    if (p.band_row) p.band_row = { ...p.band_row, weight: null };
    state.migrations = { ...(state.migrations || {}), phase2: new Date().toISOString() };
    changed = true;
  }
  return changed;
}
