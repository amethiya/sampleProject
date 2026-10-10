/**
 * Email + password sign-in with a signed, HttpOnly session cookie.
 *
 * Secrets:
 *   ADMIN_EMAIL          - the account's email
 *   ADMIN_PASSWORD_HASH  - "pbkdf2$<iterations>$<saltHex>$<hashHex>" (generate with `npm run hash-password -w @rr/worker`)
 *   SESSION_SECRET       - random string used to sign session cookies
 * ADMIN_TOKEN (bearer) keeps working for the CLI and automation.
 * RUNNER_TOKEN (bearer) is a limited key for redesign runners and Claude cloud sessions: it can only add
 * websites and work on redesign jobs (see RUNNER_PATHS).
 */

export interface AuthEnv {
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD_HASH?: string;
  SESSION_SECRET?: string;
  ADMIN_TOKEN?: string;
  RUNNER_TOKEN?: string;
}

const COOKIE = "rr_session";
const SESSION_DAYS = 7;
const enc = new TextEncoder();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => new Uint8Array(s.match(/../g)!.map((h) => parseInt(h, 16)));
const b64url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function hashPassword(password: string, saltHex: string, iterations = 100_000): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(saltHex), iterations }, key, 256);
  return `pbkdf2$${iterations}$${saltHex}$${hex(bits)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iter, salt] = stored.split("$");
  if (scheme !== "pbkdf2" || !iter || !salt) return false;
  return safeEqual(await hashPassword(password, salt, Number(iter)), stored);
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function readCookie(req: Request, name: string): string | undefined {
  return (req.headers.get("cookie") ?? "")
    .split(/;\s*/)
    .map((c) => c.split("="))
    .find(([k]) => k === name)?.[1];
}

// Runners may claim jobs and report on them, but not approve, reject, cancel, list or batch-queue them.
const RUNNER_PATHS = [/^\/api\/redesign-jobs\/next$/, /^\/api\/redesign-jobs\/\d+\/(progress|complete|fail)$/, /^\/api\/leads\/add$/, /^\/api\/leads\/[^/]+\/(redesign|crawl)$/];

/** Returns the signed-in email, "token" for the admin token, "runner" for the runner token, or null. */
export async function currentUser(req: Request, env: AuthEnv): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (env.ADMIN_TOKEN && safeEqual(auth, `Bearer ${env.ADMIN_TOKEN}`)) return "token";
  if (env.RUNNER_TOKEN && safeEqual(auth, `Bearer ${env.RUNNER_TOKEN}`)) {
    return RUNNER_PATHS.some((re) => re.test(new URL(req.url).pathname.replace(/\/+$/, ""))) ? "runner" : null;
  }
  const raw = readCookie(req, COOKIE);
  if (!raw || !env.SESSION_SECRET) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig || !safeEqual(await sign(payload, env.SESSION_SECRET), sig)) return null;
  try {
    const { e, x } = JSON.parse(unb64url(payload)) as { e: string; x: number };
    return x > Date.now() && e === env.ADMIN_EMAIL?.toLowerCase() ? e : null;
  } catch {
    return null;
  }
}

export async function login(req: Request, env: AuthEnv): Promise<Response> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    return json({ error: "Sign-in isn't configured on the server yet." }, 503);
  }
  const { email = "", password = "" } = ((await req.json().catch(() => ({}))) ?? {}) as { email?: string; password?: string };
  const ok = safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.toLowerCase()) && (await verifyPassword(password, env.ADMIN_PASSWORD_HASH));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return json({ error: "That email and password don't match." }, 401);
  }
  const payload = b64url(JSON.stringify({ e: env.ADMIN_EMAIL.toLowerCase(), x: Date.now() + SESSION_DAYS * 864e5 }));
  const value = `${payload}.${await sign(payload, env.SESSION_SECRET)}`;
  return json({ email: env.ADMIN_EMAIL }, 200, {
    "set-cookie": `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`,
  });
}

export function logout(): Response {
  return json({ ok: true }, 200, { "set-cookie": `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });
}
