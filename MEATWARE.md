# Meatware Mode — research + design (no code yet; moratorium until ~2026-09-05)

Eddie's ask (2026-09-04, from Truckee): a home-screen mode for zero-equipment days —
the day's session adapts to bodyweight versions that preserve what the day was
focusing on. Decisions locked in conversation:

| Decision | Eddie's call |
|---|---|
| Load rules | **Strictly bodyweight.** No improvised-load suggestions. Intensity comes from tempo, pauses, 1.5-reps, single-leg versions, and range of motion. |
| Stickiness | **One day at a time** — a serve-screen toggle like packed/full, resets daily. |
| Rows | **Skip rows when traveling** — substitute prone floor work (Y-T-W raises, reverse snow angels). Lighter stimulus accepted. |

## The intensity toolbox (how bodyweight matches load)

Without weight, difficulty comes from: **tempo** (3s lowering), **pauses** (2s at
the hardest point), **1.5 reps** (down, half up, down, all the way up), **single-leg/arm**
(doubles the load on the working side), **range** (deficit, deeper positions), and
**density** (shorter rests on packed days). The subs below bake these in.

## Full substitution map (every movement in the corpus)

Movements already bodyweight (15) pass through unchanged: box squat, wall sit,
glute bridge, single-leg glute bridge, single-leg hip thrust, push-up, incline
push-up, dead bug, bird dog, plank, side plank, single-leg balance, single-leg
RDL reach, calf raise, side-lying abduction. Mobility block: already equipment-free.

| Equipped movement | Meatware sub | Dose | Why it preserves the focus |
|---|---|---|---|
| Goblet Squat | **1.5-Rep Tempo Squat** (3s down, half up, full up) | 3×10 | Time under tension replaces the kettlebell; same squat pattern |
| Split Squat (high knee) | **Tempo Split Squat** (3s down) | 3×8/side | Single-leg already doubles load; tempo covers the dumbbells |
| Step-Up (high knee) | **Slow-Lower Step-Up** (stairs/sturdy chair, 3s down) | 3×8/side | The eccentric is the money; stairs are everywhere |
| Bulgarian Split Squat (high knee) | **Paused Bulgarian** (rear foot on couch, 2s pause at bottom) | 3×6/side | Pause at depth replaces load; same premier glute/single-leg stimulus |
| Kettlebell Deadlift | **Tempo Single-Leg RDL** (3s down, no weight) | 3×8/side | Hinge pattern + balance demand replaces load |
| Dumbbell RDL | **Tempo Single-Leg RDL** | 3×8/side | Same sub — unilateral hinge is the bodyweight RDL |
| Hip Thrust (flagship) | **Paused Single-Leg Hip Thrust** (2s squeeze at top) | 3×10/side | Single-leg + pause ≈ the barbell-less thrust; glute-max focus intact |
| Dumbbell Floor Press | **Tempo Push-Up** (3s down; decline/feet-elevated if strong) | 3×12 | Horizontal press, progressive via elevation |
| Dumbbell Overhead Press | **Pike Push-Up** (hips high, head toward floor) | 3×8 | The vertical-press bodyweight standard |
| Band Row | **Prone Y-T-W Raise** (2s squeeze each position) | 3×8 cycles | Eddie's call: floor work over furniture rows; upper-back focus kept |
| Dumbbell Bent-Over Row | **Reverse Snow Angel** (slow, arms hovering) | 3×10 | Scap retraction + rear delt without any pull surface |
| Band Pull-Apart | **Prone T Raise** (2s squeeze) | 3×12 | Same rear-delt/scap squeeze, gravity as the band |
| Farmer Carry | **Plank Shoulder Taps** (slow, hips dead still) | 3×20 taps | Anti-rotation + shoulder stability — the carry's trunk demand, zero space |
| Suitcase Carry | **Side Plank with Top-Leg Raise** | 3×20s/side | Anti-lateral-flexion (the suitcase carry's job) + glute med bonus |
| Pallof Press | **Plank Arm Reach** (slow alternating reach, hips square) | 3×8/side | Anti-rotation core, no band needed |
| Lateral Band Walk | **Lateral Lunge** (slow, push back through heel) | 3×8/side | Frontal-plane hip work; pairs with side-lying abduction for glute med |

Post-ACL note: every sub keeps or lowers its source movement's knee load except
none — tempo/paused single-leg squat variants stay tagged **high** knee load and
stay behind the existing knee gate. Nothing bypasses the gate in Meatware mode.

## Build sketch (post-moratorium)

- **Library**: `MEATWARE_SUBS` map — equipped movement id → full sub-movement object
  (own id `mw_*`, own dose, cues, kneeLoad inherited-or-lower, packedOk true for all).
  Progression state per `mw_*` id works automatically (travel progress tracked
  separately from equipped progress — the brain sees both).
- **Engine**: `meatware` flag on generateSession; after plan/validation, each
  movement with a sub is swapped; bodyweight movements pass through. Runs AFTER
  the brain's nextPlan is applied, so the day's focus survives the translation.
- **UI**: third toggle on the serve screen — "🥩 Meatware — no equipment today".
  One-day, resets like packed/full. Serve list and work screen show the subs.
- **Session record**: `meatware: true`; brain prompt told to read those days as
  travel days — don't down-adjust equipped doses from bodyweight completion data,
  don't count them against loaded-progression streaks, DO count them for the
  streak and knee signals.
- **Timer targets unchanged** (packed ~20 / full ~35-40).
