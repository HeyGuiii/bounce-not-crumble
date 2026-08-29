# Build Log — append only

## 2026-08-15
- Project registered (`physical-robustness`) after two voice packets; Eddie named it Bounce not Crumble.
- Decisions: daily cadence; PWA-on-Vercel vehicle; brain = dose free / rules approved.
- Eddie confirmed no separate handoff doc — the 08-15 voice packet is the complete spec source.
- SPEC.md v0 written; build started in this folder.

- v0 built and verified locally: 26-movement post-ACL library, deterministic engine (knee gate: no high-knee-load until 3 sessions averaging 7+), packed/full + mobility block, tap-set UI, post-workout reflection (knee 1-10, three-button reasons, dump), brain endpoint (claude-opus-5, structured outputs, dose-free/rules-approved enforced in code), 3-packed-day override rule, run/tennis one-tap context log, passphrase gate, PWA manifest + icons.
- Verified: serve/save loop, local-date bug found and fixed (UTC rolled dates at 5 PM Pacific), graceful brain fallback without API key, override rule fires after 3 packed days.
- PENDING (Eddie): ANTHROPIC_API_KEY + APP_PASSPHRASE into .env.local (copy .env.local.example), then Vercel deploy + Postgres.
- API key wired into .env.local (borrowed from sheetsmarts; recommend a dedicated key later). LIVE brain verified: correctly diagnosed pushup failure as strength ceiling vs knee (joint-diagnostic working), backed dose 10->8, zero proposals. Test data reset; app is clean for Workout #1.
- Remaining before deploy: Eddie picks APP_PASSPHRASE; Vercel deploy + Postgres.
- Eddie declined the passphrase (his call, logged). Storage switched Postgres -> Vercel Blob (fully CLI/API-automatable; store bnc-store linked, orphans cleaned). DEPLOYED: https://bounce-not-crumble.vercel.app - production loop verified live (serve, save, brain, blob storage), test data wiped. App is clean and waiting for Workout #1.

## 2026-08-16
- Eddie did Workout #1 for real: full session, 100% completion, knee 10.
- First-workout feedback round shipped (flow/structure preserved per his explicit ask): work screen now shows full dose (sets x reps); per-set rep SLIDERS (tap set label = fast-path full reps); "how-to" YouTube link per exercise; optional per-exercise notes drill-down; session timer (starts on Start, stops at reflect; duration stored + fed to brain with packed ~20 / full ~35-40 targets); Archive page (/archive) with full history, durations, per-set numbers, notes, dumps, and brain observations per session.
- Session schema: sets now reps-per-set numbers (was booleans); archive renders both. Deployed; Workout #1 data verified intact in prod.

## 2026-08-20
- Feedback round 2: back button on reflect screen (timer resumes from true start); proposal Accept/Decline now shows an inline verdict confirmation (and an error + retry state on network failure).
- BUG (Eddie-reported): his accept on the 7-movement proposal recorded as declined. Flipped to accepted in prod state on his word, with an audit note on the proposal.
- BUG (found while investigating): proposal decisions were never fed to the brain - accepts/declines had no effect. Brain prompt now carries proposal history with statuses (accepted = mandate, declined = boundary, pending = wait).
- BUG (found while investigating): engine rejected brain movement lists that didn't exactly match default length - the brain's 7-movement full session was being silently dropped. Engine now allows packed 3-5 / full 5-8, all other gates unchanged. Verified: prod serves the 7-movement plan.

## 2026-08-29
- Eddie: daily streak since Denver ("really moved atoms"). Secondary goal added on his word: GLUTE DEVELOPMENT woven into existing programming, never a separate workout. Library +4: hip thrust (flagship), single-leg hip thrust, Bulgarian split squat (high knee load, gated like step-up), side-lying abduction; direct glute drivers tagged glutes:true (visible in brain digest). Brain charter: 2-4 glute movements/week inside existing sessions, minimum effective dose, upper-glute + glute-med emphasis, progressive overload, primary goal (ACL/tennis) wins conflicts. SPEC updated. Deployed; serve verified.
