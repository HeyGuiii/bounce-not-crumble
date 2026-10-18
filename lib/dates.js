// All dates in the app are Eddie's local calendar day, not UTC — Vercel
// serverless runs in UTC, which would roll the date at 5 PM Pacific and
// count evening workouts as tomorrow.
const TZ = "America/Los_Angeles";

export function localDate() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
}

export function yesterdayDate() {
  return new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: TZ });
}

export const isIsoDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
