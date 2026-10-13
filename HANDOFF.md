# Make this yours

This app was built for one person, Eddie, through a conversation with Claude: what his body needed, what he loves and hates, what gear he owns, how much time he really has. The code you are holding is the result of that conversation. It is not a template. The brain's instructions name his age, his knee, his dumbbells, his goals.

The point of giving it to you is not the code. It is the conversation. Have the same one.

## What you need

- Claude Code (you have it)
- A GitHub account (you have it)
- A Vercel account (you have it)
- An Anthropic API key for the brain: https://platform.claude.com. The brain reads every workout you log and adjusts the next one. Without the key the app still serves workouts and saves sessions, it just doesn't learn. Cost for one person is a few cents a day.

## Step one: get the code

Fork this repo on GitHub, or download it as a zip. Open the folder in Claude Code.

## Step two: have the conversation

Paste this as your first message in Claude Code, then answer honestly. The questions are the product.

```
This app was built for someone else (Eddie). Read CLAUDE.md, SPEC.md, BUILD_LOG.md,
lib/brain.js, lib/library.js, lib/inventory.js and lib/blocks.js so you understand
what it is and how it was designed for him.

Then interview me the way you interviewed him, one topic at a time, before you
change a single line: who I am and what I do with my body (sport, work, age),
injuries and anything a physical therapist would want protected, what I love and
hate doing, every piece of equipment I actually own, how many minutes a day I
will honestly give this, how many days a week, my goals in order, and what
"success in a year" looks like to me.

When you have what you need, rebuild the app for me: rewrite the brain's
instructions, replace his inventory with mine, replace his protected-joint rules
with mine, pick the movement library and blocks that fit me, and strip every
reference to him. Keep the daily-serve loop, the reflect screen, the brain, the
progress page. Then wipe the sample data, verify it works locally, and tell me
exactly what to do in Vercel to deploy it.
```

That conversation takes about an hour. Do not skip the questions to get to the app faster. The app is only as good as the answers.

## Step three: deploy

Claude Code will walk you through it, but the shape is:

1. `vercel link` in the project folder, create a new project.
2. In the Vercel dashboard, Storage, create a Blob store and connect it to the project. That adds `BLOB_READ_WRITE_TOKEN` automatically.
3. Add `ANTHROPIC_API_KEY` under Settings, Environment Variables.
4. `vercel --prod`.
5. Open the link on your phone, add it to the home screen. Do workout one.

The deployed app has no login unless you set `APP_PASSPHRASE`. Eddie chose not to. Decide for yourself; it is your health data.

## What to keep in mind

- Rules generate the workouts. The brain only reads and adjusts. Keep that split; it is what keeps the app safe when the brain has a bad day.
- Daily, even twenty minutes. The brain decides the dose. Showing up is yours.
- The post-workout reflect screen is the product. Rate the joint honestly. Write the note. That is what the brain learns from.
- Change it whenever you want. Open Claude Code, say what is wrong, and it will be fixed by the next workout. That is how Eddie's got to where it is: feedback after workout one, feedback after workout five, a full review after forty-seven.
