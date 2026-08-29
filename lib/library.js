// Frozen movement library — the rules engine selects and doses from here.
// The brain may PROPOSE additions; it cannot add them itself (SPEC.md guardrail).
// kneeLoad reflects post-ACL caution (quad autograft, June 2025): "high" movements
// appear only in full sessions and only when recent knee ratings support them.
// Equipment on hand: dumbbells, bands, one kettlebell.

export const MOVEMENTS = [
  // ── Squat pattern ─────────────────────────────────────────────
  { id: "goblet_squat",      name: "Goblet Squat",             pattern: "squat",   equipment: "kb",   kneeLoad: "med",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", cues: "Heels down, chest tall, sit between the hips" },
  { id: "box_squat",         name: "Box Squat (to chair)",     pattern: "squat",   equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Control the sit, stand without rocking" },
  { id: "split_squat",       name: "Split Squat",              pattern: "squat",   equipment: "db",   kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Short steps first; front knee tracks over toes" },
  { id: "step_up",           name: "Step-Up",                  pattern: "squat",   equipment: "db",   kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Low step to start; drive through the whole foot" },
  { id: "bulgarian_split_squat", name: "Bulgarian Split Squat", pattern: "squat",  equipment: "db",   kneeLoad: "high", packedOk: false, loaded: true,  sets: 3, reps: 6,  unit: "reps/side", glutes: true, cues: "Rear foot on couch; slight forward lean loads the glute; front shin stays near vertical" },
  { id: "wall_sit",          name: "Wall Sit",                 pattern: "squat",   equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds", cues: "Thighs toward parallel only if knee is quiet" },

  // ── Hinge pattern ─────────────────────────────────────────────
  { id: "kb_deadlift",       name: "Kettlebell Deadlift",      pattern: "hinge",   equipment: "kb",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", glutes: true, cues: "Push the floor away, hips and shoulders rise together" },
  { id: "db_rdl",            name: "Dumbbell RDL",             pattern: "hinge",   equipment: "db",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", glutes: true, cues: "Soft knees, hips back, long spine; squeeze the glutes to stand" },
  { id: "glute_bridge",      name: "Glute Bridge",             pattern: "hinge",   equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", glutes: true, cues: "Squeeze at the top, ribs down" },
  { id: "sl_glute_bridge",   name: "Single-Leg Glute Bridge",  pattern: "hinge",   equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Hips level; slow down before adding reps" },
  { id: "db_hip_thrust",     name: "Hip Thrust (shoulders on couch)", pattern: "hinge", equipment: "db", kneeLoad: "low", packedOk: false, loaded: true, sets: 3, reps: 10, unit: "reps", glutes: true, cues: "Dumbbell on hips, chin tucked, drive to a flat tabletop and squeeze 2s at the top" },
  { id: "sl_hip_thrust",     name: "Single-Leg Hip Thrust",    pattern: "hinge",   equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", glutes: true, cues: "Shoulders on couch, hips square, full lockout each rep" },

  // ── Push pattern ──────────────────────────────────────────────
  { id: "pushup",            name: "Push-Up",                  pattern: "push",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps", cues: "Body one line, elbows ~45°" },
  { id: "incline_pushup",    name: "Incline Push-Up",          pattern: "push",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Counter or sturdy chair; full range" },
  { id: "db_floor_press",    name: "Dumbbell Floor Press",     pattern: "push",    equipment: "db",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 10, unit: "reps", cues: "Pause lightly at the floor, press smooth" },
  { id: "db_ohp",            name: "Dumbbell Overhead Press",  pattern: "push",    equipment: "db",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps", cues: "Ribs down, glutes on, press past the ears" },

  // ── Pull pattern ──────────────────────────────────────────────
  { id: "band_row",          name: "Band Row",                 pattern: "pull",    equipment: "band", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 12, unit: "reps", cues: "Squeeze the shoulder blades, slow return" },
  { id: "db_row",            name: "Dumbbell Bent-Over Row",   pattern: "pull",    equipment: "db",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 8,  unit: "reps/side", cues: "Hinge to set up, pull to the hip" },
  { id: "band_pull_apart",   name: "Band Pull-Apart",          pattern: "pull",    equipment: "band", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 15, unit: "reps", cues: "Arms long, squeeze between the blades" },

  // ── Carry (loaded only — muscle is armor) ─────────────────────
  { id: "farmer_carry",      name: "Farmer Carry",             pattern: "carry",   equipment: "db",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 40, unit: "steps", cues: "Tall posture, knuckles down, no lean" },
  { id: "suitcase_carry",    name: "Suitcase Carry",           pattern: "carry",   equipment: "kb",   kneeLoad: "low",  packedOk: false, loaded: true,  sets: 3, reps: 30, unit: "steps/side", cues: "One side loaded; stay dead level" },

  // ── Core ──────────────────────────────────────────────────────
  { id: "dead_bug",          name: "Dead Bug",                 pattern: "core",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", cues: "Low back stays glued to the floor" },
  { id: "bird_dog",          name: "Bird Dog",                 pattern: "core",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 8,  unit: "reps/side", cues: "Slow; nothing else moves" },
  { id: "plank",             name: "Plank",                    pattern: "core",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds", cues: "Glutes on, breathe" },
  { id: "side_plank",        name: "Side Plank",               pattern: "core",    equipment: "none", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 2, reps: 20, unit: "seconds/side", cues: "Straight line ear to ankle" },
  { id: "pallof_press",      name: "Pallof Press",             pattern: "core",    equipment: "band", kneeLoad: "low",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "reps/side", cues: "Press out, resist the twist" },

  // ── Balance / capability (bounce not crumble) ─────────────────
  { id: "sl_balance",        name: "Single-Leg Balance",       pattern: "balance", equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 30, unit: "seconds/side", cues: "Eyes up; progress to eyes closed" },
  { id: "sl_rdl_reach",      name: "Single-Leg RDL Reach",     pattern: "balance", equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 6,  unit: "reps/side", cues: "Reach long, hips square, touch and return" },
  { id: "calf_raise",        name: "Calf Raise",               pattern: "balance", equipment: "none", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 15, unit: "reps", cues: "Full range, pause at the top" },
  { id: "lateral_band_walk", name: "Lateral Band Walk",        pattern: "balance", equipment: "band", kneeLoad: "med",  packedOk: true,  loaded: false, sets: 3, reps: 10, unit: "steps/side", glutes: true, cues: "Stay low-ish, band tension the whole way" },
  { id: "side_lying_abduction", name: "Side-Lying Hip Abduction", pattern: "balance", equipment: "none", kneeLoad: "low", packedOk: true, loaded: false, sets: 3, reps: 12, unit: "reps/side", glutes: true, cues: "Top leg straight, heel leads, toes slightly down — lift from the hip, not the waist" },
];

// Optional mobility block appended when "flexibility today" = yes (~5 min).
export const MOBILITY = [
  { id: "hip_flexor_stretch", name: "Half-Kneeling Hip Flexor Stretch", reps: 45, unit: "seconds/side" },
  { id: "hamstring_floss",    name: "Hamstring Floss",                  reps: 10, unit: "reps/side" },
  { id: "ankle_circles",      name: "Ankle Circles + Wall Dorsiflexion", reps: 10, unit: "reps/side" },
  { id: "worlds_greatest",    name: "World's Greatest Stretch",          reps: 5,  unit: "reps/side" },
];

export const byId = Object.fromEntries(MOVEMENTS.map((m) => [m.id, m]));
