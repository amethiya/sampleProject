/**
 * The nightly lead search window. Times are UTC "HH:MM"; the default 19:30–01:30 UTC is 01:00–07:00 IST. A window may
 * cross midnight UTC. Pure: used by the Worker's cron and tested in core.
 */
export const NIGHT_START = "19:30";
export const NIGHT_END = "01:30";

function minutes(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error(`Bad time "${hhmm}", expected HH:MM (UTC)`);
  return (Number(m[1]) % 24) * 60 + Number(m[2]);
}

/** Whether `now` falls inside the window [start, end) in UTC. */
export function inWindow(now: Date, start = NIGHT_START, end = NIGHT_END): boolean {
  const t = now.getUTCHours() * 60 + now.getUTCMinutes();
  const s = minutes(start), e = minutes(end);
  return s <= e ? t >= s && t < e : t >= s || t < e;
}

/** The start of the window `now` is in, or of the most recent one (UTC). */
export function windowStart(now: Date, start = NIGHT_START, end = NIGHT_END): Date {
  const s = minutes(start);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Math.floor(s / 60), s % 60));
  if (d.getTime() > now.getTime()) d.setUTCDate(d.getUTCDate() - 1); // e.g. 00:45 belongs to yesterday's 19:30 window
  void end;
  return d;
}
