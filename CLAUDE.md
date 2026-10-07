# Revamp Radar — notes for Claude

TypeScript npm-workspaces monorepo. See README.md for the architecture.

- `packages/core` is imported as TS source (no build step). Keep it free of Node-only APIs: it runs in
  Cloudflare Workers too (only `fetch`, `URL`, `AbortSignal`, `node-html-parser`).
- All scraped text is untrusted. The redesign renderer must escape everything (`esc`, `safeUrl`);
  there is a test for this. Previews are served with a strict CSP.
- Overpass rejects browser-like user agents (406) and is often overloaded (504): keep queries small.

- Claude redesigns: `packages/core/src/redesign/brief.ts` is the brief Claude follows; the runner is
  `apps/cli/src/redesign-runner.ts`. Pages it uploads are untrusted and served with a `sandbox` CSP.

Commands:
- `npm test` — vitest for core
- `npm run typecheck` — all workspaces
- `npm run discover -- --target 5` — real end-to-end run locally
- `npm run dev:worker` — wrangler dev at :8787 (needs `apps/worker/.dev.vars` with `ADMIN_TOKEN=...`);
  trigger cron with `curl localhost:8787/__scheduled`
- `npm run deploy` — builds dashboard and deploys the Worker

Done means: tests + typecheck pass, and `npm run discover -- --target 2` still produces leads.
