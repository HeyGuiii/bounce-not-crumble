# Bounce not Crumble — v0 Spec

**Decided with Eddie, 2026-08-15.** Non-negotiables live in CLAUDE.md and are not restated here.

## Decisions to date

| Decision | Call | Made |
|---|---|---|
| Cadence | Daily — even 20 min. Dose is the brain's call, showing up is not | 2026-08-15 |
| Name | Bounce not Crumble | 2026-08-15 |
| Vehicle | PWA on Vercel, added to home screen (HoneyDu pattern) | 2026-08-15 |
| Brain authority | **Dose free, rules approved.** Brain adjusts sessions freely (load, reps, swaps, packed-day dose) with a one-line "what I changed and why." Structural changes (progression rules, new movement patterns, override policy) are proposals Eddie accepts/declines | 2026-08-15 |
| Dump storage | Server-side DB (falls out of vehicle) — brain reads months of history | 2026-08-15 |
| Secondary goal | **Glute development** woven into existing programming — never a separate workout. Glute max (upper emphasis), glute med, hip extension, single-leg control. 2-4 glute-tagged movements/week inside existing sessions, minimum effective dose, progressive overload. Library gained hip thrust, single-leg hip thrust, Bulgarian split squat (high knee load — gated), side-lying abduction; direct glute drivers tagged `glutes: true`. Primary goal (ACL/tennis) always wins conflicts | 2026-08-29 |

## Proposals baked into v0 (Eddie can overturn any of these in conversation)

- **Movement library:** hand-built starter set (~24 movements), curated for post-ACL caution and the home equipment list (dumbbells, bands, one kettlebell). Frozen as data the rules engine draws from. The brain may *propose* additions; it cannot add them itself. First workouts validate the library against the only authority that matters — Eddie's knee.
- **Running & tennis:** v0 treats them as context, not generated sessions — a one-tap "ran today / played tennis" log the brain sees when setting the next day's dose. The completion-meter model stays strength-only until real usage says otherwise.
- **Session shapes:** `packed` (~20 min: minimal equipment, dense circuit) and `full` (~35-40 min: loaded work). Both real training. Flexibility yes/no appends a short mobility block. The brain picks the day's emphasis (lower / upper / hinge-pull / balance-capability mix) from history.

## The daily loop

1. **Serve** — open the app: today's session is already there. Two taps max before moving: packed/full (pre-answered by the brain's suggestion, changeable), flexibility yes/no.
2. **Work** — exercise cards, tap each set as done. Taps prefill the completion meter. Nothing else is asked mid-workout.
3. **Reflect** — one screen at the end: knee 1-10, three-button reason per dropped movement (knee / time / too hard), optional free-text dump (typed or dictated).
4. **Learn** — brain (Claude API, server-side) reads the session + history, writes: a short observation Eddie sees next open, adjustments to the next session (within its dose authority), and — rarely — a structural proposal for Eddie's approval.

## Override policy (from the packet, concretized — tune with usage)

Three consecutive `packed` days triggers the brain to serve `full` as the default with a visible note. Eddie can still override the override — but the app said its piece.

## Guardrails on the brain

- Never generates a workout from scratch — selects and doses from the frozen library via the rules engine.
- Never touches the library, session shapes, or progression rules without an accepted proposal.
- Anything knee-suspect in the data gets flagged conservatively — the brain suggests backing off; it never pushes through a bad knee signal.

## Stack

Next.js PWA on Vercel · Vercel Blob in production / JSON files in local dev (single user) · Claude API (`claude-opus-5`) via a server route after each session, structured outputs so the brain's adjustments come back as validated JSON · no passphrase (Eddie's explicit call 2026-08-15 — data is public-but-obscure; APP_PASSPHRASE support exists in code if he ever changes his mind).

## Out of scope for v0

Oura/Pulse meshing (explicitly deferred) · baseline battery (revisit after two weeks of sessions) · charts/analytics (the brain's prose observation IS the readout) · anything social.

## Phase 2 (decided with Eddie, 2026-10-02)

| Decision | Call | Made |
|---|---|---|
| Container | Full ≈ 25 min honest, Packed ≈ 15. "Stop pretending" | 2026-10-02 |
| Cadence | Still daily; a miss is nothing | 2026-10-02 |
| Blocks | Rotate A Load → B Single-leg & spring → C Tempo & range, 17 days each. Same 7-slot skeleton (squat, hinge, push, pull, carry, core/balance, ATG), one lever per block | 2026-10-02 |
| ATG knee slot | Daily. Backward walk, tib raise, slant calf raise, ATG split squat, Patrick step, Nordic, reverse Nordic, slider curl. Slant board on order | 2026-10-02 |
| Plyometrics | Blocks B and C only, knee clear, 10-20 contacts, never day after a run, never with another high-knee movement | 2026-10-02 |
| Inventory is law | Every load snapped to buildable from his gear; card shows how to build it. Adjustable dumbbells = deferred purchase, brain reminds when a per-hand lift caps at 30 | 2026-10-02 |
| Hip thrust | Single-leg is the primary progression (no bench; two-leg is balance-limited at ~105) | 2026-10-02 |
| Per-side | Optional L/R rating after the session on any /side movement: solid / a little off / weak. Right = surgical side | 2026-10-02 |
| Running | Logged as activity with minutes/miles/knee-after. Staged walk-run on-ramp managed by the app; advance on 3 clean runs; back off at knee ≤ 6; +10%/wk ceiling; marathon is the long goal. Day after a run: no high-knee lifting, no plyo | 2026-10-02 |
| Test day | ~Every 28 days, replaces a workout. Bodyweight, SL hop L/R, eyes-closed balance L/R, max push-ups, max tib raises, wall sit, optional vertical jump + mile | 2026-10-02 |
| Continuous sets | Parked until Apple Watch Ultra 4 (~2026-10-09) gives heart-rate data | 2026-10-02 |
| Charts | /progress: per-movement load + top-set lines with jump markers, knee, duration, tests, L/R | 2026-10-02 |
| Mobility | No separate days, no warm-up (Eddie). Toggle kept | 2026-10-02 |
