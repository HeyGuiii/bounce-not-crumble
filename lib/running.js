// Running track (phase 2, 2026-10-02). Running is Eddie's conditioning and his
// jam — marathon is the long goal. His June/July 2026 stint went to 6 miles
// indoors in three weeks and the knee started hurting, so the on-ramp restarts
// as walk-run and advances on clean runs, not on calendar time. Runs are logged
// as activity (not sessions); the brain sees them and the engine keeps high
// knee-load lifting and plyos off the day after a run.
//
// Progression (post-ACL return-to-running literature, see BUILD_LOG 2026-10-02):
// four walk-run stages, then continuous, then build by no more than 10%/week.
// Back-off rule: knee pain or swelling that lasts past the next morning →
// hold the stage and cut volume by a quarter.

export const STAGES = [
  { stage: 1, label: "Walk-run 4:1", prescription: "4 rounds of walk 4 min, jog 1 min — about 20 min, easy" },
  { stage: 2, label: "Walk-run 3:2", prescription: "4 rounds of walk 3 min, jog 2 min — about 20 min" },
  { stage: 3, label: "Walk-run 2:3", prescription: "4 rounds of walk 2 min, jog 3 min — about 20 min" },
  { stage: 4, label: "Walk-run 1:4", prescription: "4 rounds of walk 1 min, jog 4 min — about 20 min" },
  { stage: 5, label: "Continuous, short", prescription: "Jog 10 to 15 min continuous, conversational pace" },
  { stage: 6, label: "Continuous, base", prescription: "Jog 20 to 30 min continuous, conversational pace" },
  { stage: 7, label: "Build", prescription: "Three runs a week. Add no more than 10% to last week's minutes. Long run grows first" },
];

export const CLEAN_RUNS_TO_ADVANCE = 3;
export const CLEAN_KNEE = 8; // kneeAfter at or above this = clean

export const runs = (activityLog) =>
  (activityLog || []).filter((a) => a.kind === "run").sort((a, b) => (a.date < b.date ? -1 : 1));

function minutesInWindow(list, endDate, days) {
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end - days * 86400000);
  return list
    .filter((r) => {
      const d = new Date(`${r.date}T12:00:00`);
      return d > start && d <= end;
    })
    .reduce((a, r) => a + (Number(r.minutes) || 0), 0);
}

// state.running = { stage, adjustedAt } — stage advances automatically on
// clean runs; Eddie can bump or step back by hand (he's run 6 miles before).
export function runningPlan(state, today) {
  const list = runs(state.activityLog);
  const running = state.running || { stage: 1 };
  const stage = Math.min(Math.max(running.stage || 1, 1), STAGES.length);
  const def = STAGES[stage - 1];
  const atStage = list.filter((r) => (r.stage || 1) === stage);
  const clean = atStage.filter((r) => r.kneeAfter == null || r.kneeAfter >= CLEAN_KNEE).length;
  const lastRun = list[list.length - 1] || null;
  const thisWeek = minutesInWindow(list, today, 7);
  const lastWeek = minutesInWindow(list, new Date(new Date(`${today}T12:00:00`) - 7 * 86400000).toLocaleDateString("en-CA"), 7);

  let caution = null;
  if (lastRun && lastRun.kneeAfter != null && lastRun.kneeAfter <= 6) {
    caution = `Last run left the knee at ${lastRun.kneeAfter}. Hold this stage and cut the next run by a quarter. If it is still sore the morning after, that is a PT question.`;
  } else if (stage >= 7 && lastWeek > 0 && thisWeek > lastWeek * 1.1) {
    caution = `This week is already ${Math.round(((thisWeek - lastWeek) / lastWeek) * 100)}% over last week. Ten percent is the ceiling.`;
  }

  return {
    stage,
    label: def.label,
    prescription: def.prescription,
    cleanAtStage: clean,
    needed: CLEAN_RUNS_TO_ADVANCE,
    lastRun,
    thisWeekMin: thisWeek,
    lastWeekMin: lastWeek,
    caution,
    totalRuns: list.length,
  };
}

// Called after a run is logged: advance when enough clean runs sit at the
// current stage. Returns a note when the stage changed, else null.
export function advanceIfEarned(state, today) {
  const plan = runningPlan(state, today);
  if (plan.stage < STAGES.length && plan.cleanAtStage >= CLEAN_RUNS_TO_ADVANCE && !plan.caution) {
    state.running = { stage: plan.stage + 1, adjustedAt: today, by: "earned" };
    return `Three clean runs at stage ${plan.stage}. Next run is stage ${plan.stage + 1}: ${STAGES[plan.stage].prescription}.`;
  }
  return null;
}

export function ranOn(activityLog, date) {
  return (activityLog || []).some((a) => a.kind === "run" && a.date === date);
}
