# AI_HANDOFF — Narrative Launcher

## PROJECT
Narrative Launcher: autonomous crypto narrative detection and Pump.fun token launch bot with operator approval and a minimal dashboard.

## Current architecture
Node 22.23.4 / TypeScript / better-sqlite3 / Next.js 15 (dashboard). See ARCHITECTURE.md.

## Current phase
Phase 1 complete — repository foundation and skeletal dashboard preview deployed.

## Completed work
- Repository foundation configured with pinned Node version `.nvmrc` (`22.23.4`), root `package.json` with engine guard (`>=22.23.4`), and npm workspaces.
- Skeletal Next.js 15 App Router dashboard built in `dashboard/` with neutral Tailwind styling.
- Routes implemented and verified:
  - `/login`: Single-tenant bearer token authentication setting httpOnly Secure SameSite=Strict cookie (`nl_dashboard_token`). Token field starts empty on load without autofill.
  - `/`: System runtime status, SOL burner balance, daily cap tracker, and pipeline metrics.
  - `/approvals`: Approval card queue with token metadata, mint public key, cost estimation, and simulated Approve/Reject/Snooze actions.
  - `/history`: Historical launch table with status tags, dev buy amounts, Solscan link placeholders, and search/filter.
  - `/settings`: Bot safety limits, kill switch emergency pause toggle, and security boundaries.
  - `/docs`: In-app operator documentation covering architecture, safety rails, commands, and failure recovery.
  - `not-found.tsx`: Styled 404 page with return link.
  - `error.tsx`: Client error boundary with retry capability.
- Route middleware (`dashboard/middleware.ts`) enforcing authenticated access across all routes except `/login` and static assets.
- Footer with real Documentation link (`/docs`) and literal placeholder for GitHub (`OPERATOR_TO_SUPPLY_GITHUB_URL`).
- Deployed live to Vercel preview.

## Preview/staging URL
https://dashboard-five-henna-17.vercel.app
(Deployment target: https://dashboard-7gacvuhbo-uhhh2.vercel.app, Inspector: https://vercel.com/uhhh2/dashboard/8cbreqR1bAYS8qSU35n75dsjHTKR)

## Deployed commit
Deployment ID: `dpl_8cbreqR1bAYS8qSU35n75dsjHTKR`.

## Frontend status
Skeletal navigable shell deployed with mock data. Temporary neutral Tailwind style (grays + emerald/amber accents). All routes functional and verified from global navigation and direct URLs. Token field on /login is unpopulated on load.

## Functional vs Placeholder
- **Functional**:
  - Global navigation and responsive mobile drawer menu.
  - Token authentication flow: `/login` form (empty by default), `POST /api/auth` setting Secure, SameSite=Strict, httpOnly cookie, `DELETE /api/auth` logout.
  - Edge middleware protecting all dashboard routes against unauthenticated requests with redirect to `/login`.
  - Interactive mock actions on `/approvals` (Approve/Reject/Snooze simulated status transitions).
  - Emergency kill switch pause toggle on `/settings`.
  - Search and status filtering on `/history`.
- **Placeholder**:
  - All token data, balances, and launch records are mock structures (`dashboard/lib/mock-data.ts`).
  - Footer GitHub link points to literal string `"OPERATOR_TO_SUPPLY_GITHUB_URL"`.
  - Real SQLite persistence and bot background poller will be attached in Phases 2–4.

## Design references / mockups / approval status
Not started. Phase 6 will collect references and produce mockups. No approval exists. Temporary neutral styling is active. Do not write final styling.

## Documentation / footer-link status
- `README.md` is present as a placeholder (Phase 8 deliverable; not modified in Phase 1).
- In-app docs available at `/docs`.
- Footer links: Documentation -> `/docs` (resolves); GitHub -> `"OPERATOR_TO_SUPPLY_GITHUB_URL"` (placeholder).

## Test evidence
- `node -v`: `v22.23.4` (verified active runtime satisfies pinned specification `>=22.23.4` for CVE-2026-111497 mitigation).
- `npm run build` in `dashboard/`:
  - Compiled and built successfully under Node v22.23.4.
  - 10/10 static pages compiled successfully.
  - Edge middleware bundled at 34.1 kB.
  - All routes (`/`, `/_not-found`, `/api/auth`, `/approvals`, `/docs`, `/history`, `/login`, `/settings`) generated with zero errors.
- `npm run lint` in `dashboard/`:
  - `✔ No ESLint warnings or errors`.
- Remote Route Smoke Test (`https://dashboard-five-henna-17.vercel.app`):
  - Unauthenticated `GET /` -> 307 Redirect to `/login` (Verified).
  - `GET /login` -> 200 OK (Contains "Operator Authentication", "Dashboard Bearer Token"; no autofill) (Verified).
  - `POST /api/auth` -> 200 OK with `Set-Cookie: nl_dashboard_token=...; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=strict` (Verified).
  - Authenticated `GET /` -> 200 OK (Contains "System Status") (Verified).
  - Authenticated `GET /approvals` -> 200 OK (Contains "Pending Approvals") (Verified).
  - Authenticated `GET /history` -> 200 OK (Contains "Launch History") (Verified).
  - Authenticated `GET /settings` -> 200 OK (Contains "Fixed Safety Limits", "Emergency Pause") (Verified).
  - Authenticated `GET /docs` -> 200 OK (Contains "Operator Documentation") (Verified).
  - Authenticated `GET /unknown-route-test-404` -> 404 Not Found (Renders 404 layout) (Verified).
  - `DELETE /api/auth` -> 200 OK (Clears auth cookie) (Verified).

## Known issues
None.

## Commands
- `npm run dev` (root: starts dashboard dev)
- `npm run build` (root: builds dashboard)
- `npm run lint` (root: lints dashboard)
- `cd dashboard && npm run dev`
- `cd dashboard && npm run build`
- `cd dashboard && npm run lint`

## Environment and safety
- `.env` required; see `.env.example`.
- `DRY_RUN=true` in all development and test work.
- `AUTO_LAUNCH=false` always unless the operator explicitly requests otherwise.
- Never commit `.env` or `data/`.

## Important files
PROJECT_SPEC.md · ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · AGENTS.md · dashboard/app/ · dashboard/middleware.ts · dashboard/lib/

## Things NOT to change
Node major version; SQLite -> Postgres; adding a queue; changing the PumpPortal create flow; enabling auto-launch; adding public user accounts.

## Next task
Implement **Phase 2 only** as defined in IMPLEMENTATION_PLAN.md:
1. Bot foundation: configuration validation with Zod.
2. Structured Pino logging with strict secret redaction.
3. SQLite database initialization and migrations (`better-sqlite3`).
4. Solana burner balance checker (@solana/web3.js@3).
5. Systemd service unit template in `deploy/`.
6. STOP. Do not start Phase 3.

## Blocked by
Nothing for Phase 2. For Phase 4: OpenAI key, Pinata JWT, PumpPortal API key, Telegram bot token and chat ID.
