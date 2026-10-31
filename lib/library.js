// Frozen movement library — the rules engine selects and doses from here.
// The brain may PROPOSE additions; it cannot add them itself (SPEC.md guardrail).
// kneeLoad reflects post-ACL caution (quad autograft, June 2025): "high" movements
// appear only when recent knee ratings support them, never two in one session,
// never the day after a run.
//
// loadMode (lib/inventory.js) says what `weight` means and which numbers are
// buildable from Eddie's gear: perHand | single | pair | stack | ruck | none.
// Phase 2 (2026-10-02) added the ATG knee slot, hamstring knee-flexion work,
// and a plyometric pattern that only unlocks from block B onward.

export const MOVEMENTS = [
  // ── Squat pattern ─────────────────────────────────────────────
  { id: "goblet_squat",      name: "Goblet Squat",             pattern: "squat",   loadMode: "single",  kneeLoad: "med",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", cues: "Heels down, chest tall, sit between the hips" },
  { id: "box_squat",         name: "Box Squat (to chair)",     pattern: "squat",   loadMode: "single",  kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Control the sit, stand without rocking" },
  { id: "slant_squat",       name: "Slant Board Squat",        pattern: "squat",   loadMode: "single",  kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", equipment: "slant", cues: "Heels on the board, knees travel over the toes, as deep as the knee allows, slow on the way down (no board yet? rolled towel under the heels)" },
  { id: "split_squat",       name: "Split Squat",              pattern: "squat",   loadMode: "perHand", kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Short steps first; front knee tracks over toes" },
  { id: "step_up",           name: "Step-Up",                  pattern: "squat",   loadMode: "perHand", kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Low step to start; drive through the whole foot" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", pattern: "squat",  loadMode: "perHand", kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Rear foot on couch; slight forward lean loads the glute; front shin stays near vertical" },
  { id: "atg_split_squat",   name: "ATG Split Squat",          pattern: "squat",   loadMode: "perHand", kneeLoad: "high", packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, equipment: "slant", cues: "Front foot on the slant board, knee travels far past the toes, back leg long and straight; hold the couch for balance if you need it" },
  { id: "wall_sit",          name: "Wall Sit",                 pattern: "squat",   loadMode: "ruck",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds", cues: "Thighs toward parallel only if knee is quiet" },

  // ── Hinge pattern ─────────────────────────────────────────────
  { id: "kb_deadlift",       name: "Kettlebell Deadlift",      pattern: "hinge",   loadMode: "single",  kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", glutes: true, cues: "Push the floor away, hips and shoulders rise together" },
  { id: "db_rdl",            name: "Dumbbell RDL",             pattern: "hinge",   loadMode: "pair",    kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", glutes: true, cues: "Soft knees, hips back, long spine; squeeze the glutes to stand" },
  { id: "glute_bridge",      name: "Glute Bridge",             pattern: "hinge",   loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", glutes: true, cues: "Squeeze at the top, ribs down" },
  { id: "sl_glute_bridge",   name: "Single-Leg Glute Bridge",  pattern: "hinge",   loadMode: "none",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Hips level; slow down before adding reps" },
  { id: "db_hip_thrust",     name: "Hip Thrust (shoulders on couch)", pattern: "hinge", loadMode: "stack", kneeLoad: "low", packedOk: false, loaded: true, sets: 3, reps: 10, unit: "reps", glutes: true, cues: "Weights on the hips, chin tucked, drive to a flat tabletop and squeeze 2s at the top" },
  { id: "sl_hip_thrust",     name: "Single-Leg Hip Thrust",    pattern: "hinge",   loadMode: "single",  kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Shoulders on couch, one dumbbell on the working hip, hips square, full lockout and a 2s squeeze each rep" },

  // ── Push pattern ──────────────────────────────────────────────
  { id: "pushup",            name: "Push-Up",                  pattern: "push",    loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Body one line, elbows ~45°" },
  { id: "incline_pushup",    name: "Incline Push-Up",          pattern: "push",    loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Counter or sturdy chair; full range" },
  { id: "db_floor_press",    name: "Dumbbell Floor Press",     pattern: "push",    loadMode: "perHand", kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 10, unit: "reps", cues: "Pause lightly at the floor, press smooth" },
  { id: "db_ohp",            name: "Dumbbell Overhead Press",  pattern: "push",    loadMode: "perHand", kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", cues: "Ribs down, glutes on, press past the ears" },

  // ── Pull pattern ──────────────────────────────────────────────
  { id: "band_row",          name: "Band Row",                 pattern: "pull",    loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Standing, squeeze the shoulder blades, slow return" },
  { id: "db_row",            name: "Dumbbell Bent-Over Row",   pattern: "pull",    loadMode: "single",  kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps/side", cues: "Hinge to set up, pull to the hip" },
  { id: "band_pull_apart",   name: "Band Pull-Apart",          pattern: "pull",    loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 15, unit: "reps", cues: "Arms long, squeeze between the blades" },

  // ── Carry (loaded only — muscle is armor) ─────────────────────
  { id: "farmer_carry",      name: "Farmer Carry",             pattern: "carry",   loadMode: "pair",    kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 40, unit: "steps", cues: "Tall posture, knuckles down, no lean" },
  { id: "suitcase_carry",    name: "Suitcase Carry",           pattern: "carry",   loadMode: "single",  kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 30, unit: "steps/side", cues: "One side loaded; stay dead level" },

  // ── Core (phase 3, Eddie 2026-10-31: core over glutes — DAILY slot) ──
  // coreFocus is what the trunk is being asked to do; the engine rotates
  // through all five across a week: antiRotation, antiExtension, rotation
  // (tennis), antiLateral, flexion. Carries cover antiLateral under load too.
  { id: "dead_bug",          name: "Dead Bug",                 pattern: "core",    coreFocus: "antiExtension", loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", cues: "Low back glued to the floor; ruck held over the chest makes it honest" },
  { id: "bird_dog",          name: "Bird Dog",                 pattern: "core",    coreFocus: "antiExtension", loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", retired: "2026-09-28 — Eddie asked for harder", cues: "Slow; nothing else moves" },
  { id: "plank",             name: "Plank",                    pattern: "core",    coreFocus: "antiExtension", loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds", cues: "Glutes on, ribs down, breathe. Ruck on the back when it gets easy" },
  { id: "hollow_hold",       name: "Hollow Hold",              pattern: "core",    coreFocus: "antiExtension", loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 20, unit: "seconds", cues: "On your back, low back pressed down, shoulders and legs off the floor. Bend the knees to make it easier, straighten to make it harder" },
  { id: "side_plank",        name: "Side Plank",               pattern: "core",    coreFocus: "antiLateral",   loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 2, reps: 20, unit: "seconds/side", cues: "Straight line ear to ankle; float the top leg when it gets easy" },
  { id: "copenhagen_plank",  name: "Copenhagen Plank",         pattern: "core",    coreFocus: "antiLateral",   loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 2, reps: 15, unit: "seconds/side", cues: "Side plank with the top foot on a chair seat, bottom leg bent under it. Inner thigh and side trunk — the groin insurance tennis players skip" },
  { id: "pallof_press",      name: "Pallof Press",             pattern: "core",    coreFocus: "antiRotation",  loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps/side", cues: "Press out, resist the twist, 2s hold at full reach" },
  { id: "pallof_hold_walkout", name: "Pallof Hold Walk-Out",   pattern: "core",    coreFocus: "antiRotation",  loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 5,  unit: "reps/side", cues: "Arms long at chest height, step sideways away from the anchor until the band is fighting you, hold 5s, step back in" },
  { id: "bear_hold_taps",    name: "Bear Hold Shoulder Taps",  pattern: "core",    coreFocus: "antiRotation",  loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 16, unit: "taps", cues: "Hands and toes, knees an inch off the floor, tap the opposite shoulder. Hips do not move an inch" },
  { id: "band_chop",         name: "Half-Kneeling Band Chop",  pattern: "core",    coreFocus: "rotation",      loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps/side", cues: "Band anchored high, kneel on the inside knee, pull down and across to the outside hip with long arms. Rotate from the ribs, hips stay square" },
  { id: "standing_band_rotation", name: "Standing Band Rotation", pattern: "core", coreFocus: "rotation",      loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps/side", cues: "Band at chest height, arms long, rotate away fast and come back slow. This is the forehand — drive from the back hip" },
  { id: "weighted_situp",    name: "Weighted Sit-Up",          pattern: "core",    coreFocus: "flexion",       loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Ruck hugged to the chest, feet under the couch, curl up one vertebra at a time, lower slow" },
  { id: "reverse_crunch",    name: "Reverse Crunch",           pattern: "core",    coreFocus: "flexion",       loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "On your back, knees bent, lift the hips off the floor by curling the tailbone up. Lower slow, no swinging" },
  { id: "l_sit_chairs",      name: "L-Sit (two chairs)",       pattern: "core",    coreFocus: "flexion",       loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "seconds", cues: "Hands on two chair seats, lift the legs out straight, hold. Tucked knees to start. Hip flexors and abs together" },

  // ── Balance / capability (bounce not crumble) ─────────────────
  { id: "sl_balance",        name: "Single-Leg Balance",       pattern: "balance", loadMode: "single",  kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds/side", cues: "Eyes up; progress to eyes closed" },
  { id: "sl_rdl_reach",      name: "Single-Leg RDL Reach",     pattern: "balance", loadMode: "single",  kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 6,  unit: "reps/side", cues: "Reach long, hips square, touch and return" },
  { id: "calf_raise",        name: "Calf Raise",               pattern: "balance", loadMode: "pair",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 15, unit: "reps", cues: "Full range, pause at the top" },
  { id: "lateral_band_walk", name: "Lateral Band Walk",        pattern: "balance", loadMode: "none",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "steps/side", glutes: true, cues: "Stay low-ish, band tension the whole way" },
  { id: "side_lying_abduction", name: "Side-Lying Hip Abduction", pattern: "balance", loadMode: "none", kneeLoad: "low", packedOk: true, loaded: false, sets: 3, reps: 12, unit: "reps/side", glutes: true, cues: "Top leg straight, heel leads, toes slightly down — lift from the hip, not the waist" },

  // ── ATG knee slot (phase 2, daily) ────────────────────────────
  // Knees Over Toes principles: full range, light load, high reps, every day.
  // Fills the three holes the 2026-10-02 review found: quad end-range and
  // isometrics, hamstring knee flexion, shin and ankle strength.
  { id: "backward_walk",     name: "Backward Walk",            pattern: "atg",     loadMode: "ruck",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 60, unit: "steps", cues: "Slow, toes land first, knees bend with every step. Hallway or driveway. Blood flow for the knee — the ATG daily" },
  { id: "tib_raise",         name: "Tibialis Raise (wall)",    pattern: "atg",     loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 20, unit: "reps", cues: "Back and heels against the wall, feet a foot out, lift the toes as high as they go, slow down" },
  { id: "slant_calf_raise",  name: "Slant Board Calf Raise (knee bent)", pattern: "atg", loadMode: "single", kneeLoad: "med", packedOk: true, loaded: false, sets: 3, reps: 15, unit: "reps", equipment: "slant", cues: "Toes on the high end, knees bent and forward over the toes the whole time, full range. This is the soleus — the knee's shock absorber (no board yet? stair edge)" },
  { id: "patrick_step",      name: "Patrick Step",             pattern: "atg",     loadMode: "none",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps/side", cues: "Stand on a step on one leg, reach the other heel down toward the floor with the standing knee over the toes, tap, return. Slow" },
  { id: "nordic_curl",       name: "Nordic Curl (feet under couch)", pattern: "atg", loadMode: "none",  kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 5,  unit: "reps", cues: "Kneel on something soft, feet wedged under the couch, lower forward as slow as you can, hands catch you, push back up. The hamstrings protect the ACL" },
  { id: "reverse_nordic",    name: "Reverse Nordic",           pattern: "atg",     loadMode: "none",    kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 6,  unit: "reps", cues: "Tall kneeling, glutes tight, lean back from the knees in one straight line, come back. Quad end-range" },
  { id: "slider_curl",       name: "Hamstring Slider Curl",    pattern: "atg",     loadMode: "none",    kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps", cues: "Bridge with socks on a hard floor or towels, slide the heels out slow, pull them back in. Hips stay up" },

  // ── Plyometric (block B onward — the "bounce") ────────────────
  // Low dose, quiet landings, never the day after a run, never with another
  // high-knee-load movement in the same session.
  { id: "pogo_hops",         name: "Pogo Hops",                pattern: "plyo",    loadMode: "none",    kneeLoad: "high", packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Stiff ankles, small and quick, land on the balls of the feet, quiet" },
  { id: "drop_stick",        name: "Drop and Stick",           pattern: "plyo",    loadMode: "none",    kneeLoad: "high", packedOk: true,  loaded: false, sets: 3, reps: 5,  unit: "reps", cues: "Step off a low step, land soft on both feet, knees over toes, stick it for two seconds" },
  { id: "lateral_bound_stick", name: "Lateral Bound and Stick", pattern: "plyo",  loadMode: "none",    kneeLoad: "high", packedOk: true,  loaded: false, sets: 3, reps: 4,  unit: "reps/side", cues: "Push off one leg sideways, land on the other, stick it quiet. Small hops first — this is the tennis move" },
];

// Optional mobility block appended when "flexibility today" = yes (~5 min).
// Eddie (2026-10-02): never used it, doesn't want a warm-up. Kept for the toggle.
export const MOBILITY = [
  { id: "hip_flexor_stretch", name: "Half-Kneeling Hip Flexor Stretch", reps: 45, unit: "seconds/side" },
  { id: "hamstring_floss",    name: "Hamstring Floss",                  reps: 10, unit: "reps/side" },
  { id: "ankle_circles",      name: "Ankle Circles + Wall Dorsiflexion", reps: 10, unit: "reps/side" },
  { id: "worlds_greatest",    name: "World's Greatest Stretch",          reps: 5,  unit: "reps/side" },
];

// ── Meatware mode: strictly-bodyweight substitutions ────────────
// Full research + Eddie's decisions in MEATWARE.md (2026-09-04). Movements not
// listed here pass through unchanged WITH weight stripped to null (phase 2 fix
// for the "weight artifacts" Eddie hit on the road). Knee gates carry over.
export const MEATWARE_SUBS = {
  goblet_squat:         { id: "mw_tempo_squat",       name: "1.5-Rep Tempo Squat",          pattern: "squat",   loadMode: "none", kneeLoad: "med",  packedOk: true, loaded: false, sets: 3, reps: 10, unit: "reps", cues: "3s down to chair height, halfway up, back down, all the way up" },
  split_squat:          { id: "mw_tempo_split_squat", name: "Tempo Split Squat",            pattern: "squat",   loadMode: "none", kneeLoad: "high", packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "3s lowering; front knee tracks over toes" },
  step_up:              { id: "mw_slow_step_up",      name: "Slow-Lower Step-Up",           pattern: "squat",   loadMode: "none", kneeLoad: "high", packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Stairs or sturdy chair; the 3s lowering is the exercise" },
  bulgarian_split_squat:{ id: "mw_paused_bulgarian",  name: "Paused Bulgarian Split Squat", pattern: "squat",   loadMode: "none", kneeLoad: "high", packedOk: true, loaded: false, sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Rear foot on couch; 2s pause at the bottom replaces the dumbbells" },
  kb_deadlift:          { id: "mw_sl_rdl",            name: "Tempo Single-Leg RDL",         pattern: "hinge",   loadMode: "none", kneeLoad: "med",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "3s down, long spine, squeeze the glute to stand" },
  db_rdl:               { id: "mw_sl_rdl",            name: "Tempo Single-Leg RDL",         pattern: "hinge",   loadMode: "none", kneeLoad: "med",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "3s down, long spine, squeeze the glute to stand" },
  db_hip_thrust:        { id: "mw_paused_sl_thrust",  name: "Paused Single-Leg Hip Thrust", pattern: "hinge",   loadMode: "none", kneeLoad: "med",  packedOk: true, loaded: false, sets: 3, reps: 10, unit: "reps/side", glutes: true, cues: "Shoulders on couch/bed edge; 2s squeeze at the top of every rep" },
  db_floor_press:       { id: "mw_tempo_pushup",      name: "Tempo Push-Up",                pattern: "push",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 12, unit: "reps", cues: "3s down; elevate the feet if it's easy" },
  db_ohp:               { id: "mw_pike_pushup",       name: "Pike Push-Up",                 pattern: "push",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps", cues: "Hips high, head toward the floor between the hands" },
  band_row:             { id: "mw_ytw",               name: "Prone Y-T-W Raise",            pattern: "pull",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "cycles", cues: "Face down; 2s squeeze in each of the three positions" },
  db_row:               { id: "mw_snow_angel",        name: "Reverse Snow Angel",           pattern: "pull",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Arms hover the whole time; slow sweep from hips to overhead" },
  band_pull_apart:      { id: "mw_prone_t",           name: "Prone T Raise",                pattern: "pull",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Thumbs up, 2s squeeze between the shoulder blades" },
  farmer_carry:         { id: "mw_shoulder_taps",     name: "Plank Shoulder Taps",          pattern: "carry",   loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 20, unit: "taps", cues: "Slow; hips dead still — that stillness is the carry" },
  suitcase_carry:       { id: "mw_side_plank_raise",  name: "Side Plank + Top-Leg Raise",   pattern: "carry",   loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 20, unit: "seconds/side", glutes: true, cues: "Straight line, then float the top leg — anti-lean plus glute med" },
  pallof_press:         { id: "mw_plank_reach",       name: "Plank Arm Reach",              pattern: "core",    loadMode: "none", kneeLoad: "low",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", cues: "Reach long without the hips twisting an inch" },
  lateral_band_walk:    { id: "mw_lateral_lunge",     name: "Lateral Lunge",                pattern: "balance", loadMode: "none", kneeLoad: "med",  packedOk: true, loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Slow sit into the hip, push back through the heel" },
  // Slant-board movements on the road (no board): the same movement off a stair edge or a rolled towel.
  slant_calf_raise:     { id: "mw_stair_calf_raise",  name: "Bent-Knee Calf Raise (stair edge)", pattern: "atg", loadMode: "none", kneeLoad: "med", packedOk: true, loaded: false, sets: 3, reps: 15, unit: "reps", cues: "Balls of the feet on a stair edge, knees bent and forward, full range" },
  slant_squat:          { id: "mw_heel_squat",        name: "Heels-Up Squat (towel under heels)", pattern: "squat", loadMode: "none", kneeLoad: "med", packedOk: true, loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Rolled towel under the heels, knees forward, deep and slow" },
};

export const byId = Object.fromEntries(MOVEMENTS.map((m) => [m.id, m]));
export const ALL_BY_ID = {
  ...byId,
  ...Object.fromEntries(Object.values(MEATWARE_SUBS).map((m) => [m.id, m])),
};
export const perSide = (unit) => typeof unit === "string" && unit.includes("/side");
