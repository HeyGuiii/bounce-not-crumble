# Make this yours — step by step

This app was built for one person, Eddie, through a conversation with Claude about what his body needed, what he loves and hates, what gear he owns, and how much time he really has. The code you are holding is the result of that conversation. It is not a template. The brain's instructions name his age, his knee, his dumbbells, his goals.

The point of giving it to you is not the code. It is the conversation. These steps get you to that conversation and then get the result onto your phone. Budget about two hours the first time. Nothing here needs you to write code.

## Before you start

You need four accounts or tools. You said you have the first three.

1. **GitHub** (github.com). Where the code lives.
2. **Vercel** (vercel.com). Where the app runs. The free plan is enough.
3. **Claude Code** on your computer. This is the tool that interviews you and rebuilds the app. If `claude` does not run in your terminal yet, install it from https://claude.com/claude-code.
4. **An Anthropic API key** for the brain. Go to https://platform.claude.com, sign in, API Keys, Create Key, name it "bounce", copy it somewhere safe. The brain reads every workout you log and adjusts the next one. Cost for one person is a few cents a day. Without the key the app still works, it just does not learn.

You also need Node.js on your computer. Open a terminal and type `node -v`. If you see a version 20 or higher, you are fine. If not, install it from https://nodejs.org (the LTS button).

## Part 1: get the code onto your computer

1. Open the email from GitHub inviting you to `HeyGuiii/bounce-not-crumble` and accept it.
2. Open https://github.com/HeyGuiii/bounce-not-crumble in your browser.
3. Click **Fork** (top right), then **Create fork**. You now have your own copy at `github.com/YOUR-USERNAME/bounce-not-crumble`.
4. Open a terminal (Terminal on Mac, PowerShell on Windows) and run these three lines, replacing YOUR-USERNAME:

```
git clone https://github.com/YOUR-USERNAME/bounce-not-crumble.git
cd bounce-not-crumble
npm install
```

5. Create the key file. Copy `.env.local.example` to a new file named `.env.local` in the same folder, open it in any text editor, and paste your API key after `ANTHROPIC_API_KEY=`. Save. This file never leaves your computer.

## Part 2: the conversation

This is the whole point. Do not rush it.

6. In the same terminal, still inside the folder, run:

```
claude
```

7. Paste this as your first message, then answer every question honestly. One topic at a time is fine. If a question does not apply, say so.

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
progress page. Then wipe the sample data, verify it works locally, and show it
to me running on my computer before we deploy.
```

8. When it says the app is running locally, open http://localhost:3000 in your browser. Look at workout one. If anything is wrong, say so in the same conversation. It will fix it. Keep going until workout one looks like something you would actually do tomorrow.

## Part 3: put it on your phone

You can do this yourself with the steps below, or paste the next message into the same Claude Code conversation and let it drive:

```
Now deploy this to Vercel for me. Walk me through each step, one at a time,
and tell me exactly what to click or type.
```

If you would rather do it by hand:

9. Install the Vercel tool and sign in:

```
npm install -g vercel
vercel login
```

10. Link the folder to a new Vercel project. Accept the defaults when it asks:

```
vercel link
```

11. In your browser, go to https://vercel.com, open the new project, click **Storage**, **Create Database**, choose **Blob**, and connect it to the project. This is where your workouts are saved. It adds the connection automatically.
12. Still in the project, click **Settings**, **Environment Variables**. Add one named `ANTHROPIC_API_KEY` with your key as the value. Save.
13. Back in the terminal:

```
vercel --prod
```

It prints a link ending in `.vercel.app`. That is your app.

14. Open the link on your phone. In Safari, tap Share, then **Add to Home Screen**. In Chrome on Android, tap the menu, then **Add to Home screen**. It now opens like an app.
15. Save your work so it is not only on your computer:

```
git add -A
git commit -m "made it mine"
git push
```

The deployed app has no login unless you set a variable named `APP_PASSPHRASE` in Vercel. Eddie chose not to. It is your health data; decide for yourself.

## Part 4: living with it

- **Daily.** Even twenty minutes. The brain decides the dose. Showing up is your job.
- **The reflect screen is the product.** Rate the joint honestly after every workout. Write the note. That is what the brain learns from.
- **Rules make the workouts, the brain only adjusts them.** Keep that split. It is what keeps the app safe on a day the brain is wrong.
- **To change anything,** open the terminal in the folder, run `claude`, and say what is wrong. It will be fixed before your next workout, then `git add -A`, `git commit -m "..."`, `git push`, and `vercel --prod`. That is how Eddie's got to where it is: feedback after workout one, feedback after workout five, a full review after forty-seven.

## If you get stuck

Paste the error into the same Claude Code conversation and say "I got this, what do I do." It will know. If it is truly stuck, text Eddie.
