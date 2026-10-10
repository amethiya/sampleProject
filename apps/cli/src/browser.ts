/**
 * A headless browser for research and QA, with the network locked to the public internet.
 *
 * Origins we trust explicitly (the local QA server, the Revamp Radar Worker in RR_URL, which serves the image proxy)
 * may be passed as allowOrigins. Lead websites are untrusted: before visiting one we resolve its host and refuse private, loopback, link-local and
 * cloud-metadata addresses (SSRF), and every request the page makes goes through the same check. Downloads,
 * service workers and permissions are off. Uses Google Chrome when installed (no download needed), else RR_CHROMIUM,
 * else a Chromium from the Playwright cache.
 */
import { lookup } from "node:dns/promises";
import { existsSync, readdirSync } from "node:fs";
import { isIP } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type BrowserContext, type BrowserContextOptions } from "playwright-core";

export class UnsafeUrlError extends Error {}

let shared: Promise<Browser> | null = null;

/** One browser for the whole runner process; jobs get their own contexts. */
export function browser(): Promise<Browser> {
  shared ??= launch().catch((e) => { shared = null; throw e; });
  return shared;
}

export async function closeBrowser() {
  const b = shared;
  shared = null;
  await (await b?.catch(() => null))?.close().catch(() => {});
}

async function launch(): Promise<Browser> {
  const args = ["--disable-dev-shm-usage", "--no-first-run", "--mute-audio"];
  if (process.env.RR_CHROMIUM) return chromium.launch({ executablePath: process.env.RR_CHROMIUM, headless: true, args });
  try {
    return await chromium.launch({ channel: "chrome", headless: true, args });
  } catch (first) {
    const cached = cachedChromium();
    if (cached) return chromium.launch({ executablePath: cached, headless: true, args });
    throw new Error(`No browser for research/QA: install Google Chrome or set RR_CHROMIUM to a Chromium binary (${(first as Error).message.split("\n")[0]})`);
  }
}

function cachedChromium(): string | null {
  const roots = [join(homedir(), "Library/Caches/ms-playwright"), join(homedir(), ".cache/ms-playwright")];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      for (const rel of [
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-linux/chrome", "chrome-linux64/chrome",
      ]) if (existsSync(join(root, dir, rel))) return join(root, dir, rel);
    }
  }
  return null;
}

/** True for addresses a lead website must never make us reach: private, loopback, link-local, CGNAT, metadata, multicast. */
export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19));
  }
  const v6 = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (v6 === "::" || v6 === "::1") return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateAddress(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
}

const BLOCKED_NAMES = /(^|\.)(localhost|local|internal|lan|home|corp|intranet|localdomain)$|^metadata(\.google\.internal)?$/i;
const resolved = new Map<string, Promise<boolean>>();

/** Whether a host resolves only to public addresses (cached per host for the life of the process). */
export function isPublicHost(host: string): Promise<boolean> {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!h || BLOCKED_NAMES.test(h)) return Promise.resolve(false);
  if (isIP(h)) return Promise.resolve(!isPrivateAddress(h));
  let p = resolved.get(h);
  if (!p) {
    p = lookup(h, { all: true }).then((addrs) => addrs.length > 0 && addrs.every((a) => !isPrivateAddress(a.address))).catch(() => false);
    resolved.set(h, p);
  }
  return p;
}

/** Throws UnsafeUrlError unless the URL is http(s) on a standard port and its host is public. */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let u: URL;
  try { u = new URL(raw); } catch { throw new UnsafeUrlError(`Not a valid URL: ${raw}`); }
  if (!/^https?:$/.test(u.protocol)) throw new UnsafeUrlError(`Only http(s) websites can be inspected (${u.protocol}).`);
  if (u.username || u.password) throw new UnsafeUrlError("URLs with credentials are not inspected.");
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) throw new UnsafeUrlError(`Non-standard port ${u.port} is not inspected.`);
  if (!(await isPublicHost(u.hostname))) throw new UnsafeUrlError(`${u.hostname} does not resolve to a public address.`);
  return u;
}

/** A locked-down context: every request is checked; anything not public http(s) (or data:/blob:) is aborted. */
export async function safeContext(opts: BrowserContextOptions & { allowOrigins?: string[] } = {}): Promise<BrowserContext> {
  const { allowOrigins = [], ...rest } = opts;
  const ctx = await (await browser()).newContext({ acceptDownloads: false, serviceWorkers: "block", ignoreHTTPSErrors: true, ...rest });
  // tsx (esbuild keepNames) wraps functions passed to page.evaluate in __name(); give the page a no-op.
  await ctx.addInitScript("globalThis.__name = globalThis.__name || function (f) { return f; };");
  await ctx.route("**/*", async (route) => {
    const url = route.request().url();
    if (/^(data|blob):/i.test(url)) return route.continue();
    try {
      const u = new URL(url);
      if (allowOrigins.includes(u.origin)) return route.continue();
      if (/^https?:$/.test(u.protocol) && (await isPublicHost(u.hostname))) return route.continue();
    } catch { /* fall through */ }
    return route.abort("blockedbyclient");
  });
  return ctx;
}
