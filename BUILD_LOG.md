# Build Log — append only

## 2026-08-15
- Project registered (`physical-robustness`) after two voice packets; Eddie named it Bounce not Crumble.
- Decisions: daily cadence; PWA-on-Vercel vehicle; brain = dose free / rules approved.
- Eddie confirmed no separate handoff doc — the 08-15 voice packet is the complete spec source.
- SPEC.md v0 written; build started in this folder.

- v0 built and verified locally: 26-movement post-ACL library, deterministic engine (knee gate: no high-knee-load until 3 sessions averaging 7+), packed/full + mobility block, tap-set UI, post-workout reflection (knee 1-10, three-button reasons, dump), brain endpoint (claude-opus-5, structured outputs, dose-free/rules-approved enforced in code), 3-packed-day override rule, run/tennis one-tap context log, passphrase gate, PWA manifest + icons.
- Verified: serve/save loop, local-date bug found and fixed (UTC rolled dates at 5 PM Pacific), graceful brain fallback without API key, override rule fires after 3 packed days.
- PENDING (Eddie): ANTHROPIC_API_KEY + APP_PASSPHRASE into .env.local (copy .env.local.example), then Vercel deploy + Postgres.
