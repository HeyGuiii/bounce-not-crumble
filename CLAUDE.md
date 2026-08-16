# Bounce not Crumble

Eddie's daily workout app. Registry slug: `physical-robustness` (knowledge-base/registry/projects.yaml). The name is the mission: "when/if I fall I want to bounce not crumble."

## The one-paragraph brief

Every day the workout comes to Eddie, with near-zero decisions asked of him. Injury resilience over aesthetics — post-ACL knee rehab (quad autograft, June 2025), age 44, loves running and tennis, hates weights, needs strength. Home equipment: dumbbells, bands, one kettlebell. Deterministic rules generate the session; the Claude API reads every completed session as an accumulating trainer/PT/longevity brain on top. Consistency is the whole ballgame: every decision point is a place the loop can break.

## Non-negotiables (Eddie-authored — do not relitigate)

1. **Daily cadence.** Show up every day, even if only 20 minutes. Dose/intensity is the brain's call; showing up is not. (Decided 2026-08-15.)
2. **Bodyweight/packed mode is real training, never a soft default.** Muscle is armor.
3. **The app earns override authority** when "packed" becomes a habit.
4. **Phone-native.** The post-workout reflection is the product and must be thumb-accessible.
5. **Rules generate, LLM interprets.** The brain does not generate workouts.
6. **Knee rating is post-workout only** — it reports, never predicts (kills self-bargaining).
7. Mid-workout is mechanical: taps prefill the completion meter. No interpretation while working.

## Signal design

Completion% per exercise + post-workout knee (1-10) are jointly diagnostic:
low completion + good knee = too hard; low completion + bad knee = knee stopped it.
Dropped movements get a three-button reason: knee / time / too hard. Optional free-text dump at the end.

## Distinct from

- **Pulse** (C:\Pulse): same body, different job — Pulse observes, this trains. Oura meshing explicitly deferred by Eddie.
- Never brand this "Nof1" — that belongs to QR Dossier / The Unlock.

## Source of truth

- Spec source: `C:\Users\Admin\knowledge-base\raw\voice\vtb-2026-08-15-085938.md` (complete — no other handoff doc exists)
- Project page: `C:\Users\Admin\knowledge-base\wiki\projects\physical-robustness.md`
- SPEC.md here grows as decisions land; log decisions in BUILD_LOG.md (append-only).

## Style

No pink, ever. Neutral palette. Simple and minimal — when in doubt, remove it.
