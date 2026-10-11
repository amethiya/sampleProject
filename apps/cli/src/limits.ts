/**
 * Claude subscription usage limits. When Claude Code stops with "You've hit your session limit · resets 12:10am
 * (Asia/Calcutta)", the job is fine and nothing is broken: the runner waits for the reset instead of failing the job
 * (which used to burn all of its attempts within minutes).
 */

const LIMIT = /hit your (?:session|usage|weekly|daily|\d+-hour) limit|usage limit (?:reached|exceeded)|(?:session|weekly) limit reached/i;

export class UsageLimit extends Error {
  constructor(message: string, readonly resetAt: number) {
    super(message);
  }
}

export function isUsageLimit(text: string): boolean {
  return LIMIT.test(text);
}

/** Wall-clock hour and minute right now in a time zone (falls back to the machine's zone). */
function wallClock(now: Date, timeZone?: string): { h: number; m: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    return { h: Number(parts.find((p) => p.type === "hour")?.value), m: Number(parts.find((p) => p.type === "minute")?.value) };
  } catch {
    return { h: now.getHours(), m: now.getMinutes() };
  }
}

/**
 * When the limit lifts, as epoch ms (plus a minute of slack), from "resets 12:10am (Asia/Calcutta)" or "resets 5pm".
 * Unparseable messages wait 30 minutes and try again.
 */
export function resetTime(text: string, now = new Date()): number {
  const m = text.match(/resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s*\(([^)]+)\))?/i);
  if (!m) return now.getTime() + 30 * 60_000;
  let h = Number(m[1]) % 12;
  if (!m[3]) h = Number(m[1]) % 24;
  else if (m[3].toLowerCase() === "pm") h += 12;
  const target = h * 60 + Number(m[2] ?? 0);
  const cur = wallClock(now, m[4]);
  let diff = target - (cur.h * 60 + cur.m);
  if (diff <= 0) diff += 24 * 60;
  return now.getTime() + (diff + 1) * 60_000;
}

export function limitError(text: string, now = new Date()): UsageLimit {
  const line = (text.match(LIMIT) ? text.split("\n").find((l) => LIMIT.test(l)) ?? text : text).trim().slice(0, 200);
  return new UsageLimit(line, resetTime(text, now));
}
