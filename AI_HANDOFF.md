# AI_HANDOFF — Narrative Launcher

## PROJECT
Narrative Launcher: autonomous crypto narrative detection and Pump.fun token launch bot with operator approval and a minimal dashboard.

## Current architecture
Node 22.23.4 / TypeScript / better-sqlite3 / Next.js 15 (dashboard). See ARCHITECTURE.md.

## Current phase
Phase 2 complete — bot foundation and persistence.

## Completed work

### Phase 1 (committed at `5ffe1c8`)
- Repository foundation: pinned Node `.nvmrc` (`22.23.4`), root `package.json` engine guard (`>=22.23.4`), npm workspaces.
- Skeletal Next.js 15 App Router dashboard in `dashboard/` with neutral Tailwind styling.
- Routes: `/login`, `/`, `/approvals`, `/history`, `/settings`, `/docs`, `not-found.tsx`, `error.tsx`.
- Bearer-token login (`nl_dashboard_token`, httpOnly, Secure, SameSite=Strict), middleware protection, logout endpoint.
- Mock-data approval actions, history filtering, settings kill-switch toggle.
- Vercel preview deployed: https://dashboard-five-henna-17.vercel.app

### Phase 2
- `src/config.ts`: Zod environment validation with `required_error` messages for required variables; safe defaults (`DRY_RUN=true`, `AUTO_LAUNCH=false`, `BOT_START_STATE=paused`); rejects empty numeric values instead of coercing them to `0`; integer daily cap; finite SOL amounts; base58 validation for the burner public key; `LOG_LEVEL` validation.
- `src/logger.ts`: pino logger with redaction for `authorization`, `apiKey`, `jwt`, `secretKey`, `privateKey`, and `token` (top-level and one-level wildcards). Caller options can no longer override the redaction config.
- `src/db/index.ts`: `better-sqlite3` initialization under `DATA_DIR`, WAL mode, idempotent migration runner, `600` file permissions where supported, `getDb()`/`closeDb()` lifecycle.
- `src/db/migrations.sql`: `launches`, `bot_state`, `narrative_seen`; unique narrative hash; `(status, created_at)` index.
- `src/db/repositories/launches.ts`: insert/read, narrow conditional `updateStatus` type, pending queue, hash lookup, and daily-cap counting by `launched_at`.
- `src/db/repositories/state.ts`: `bot_state` JSON get/set/upsert.
- `src/deploy/balance.ts`: Solana burner balance check using `@solana/web3.js@3`; `Lamports` bigint converted safely with `Number()`; RPC URL userinfo/query strings stripped from all error text.
- `src/index.ts`: config load with non-zero exit on invalid env; masked config log; SQLite init under `DATA_DIR`; balance check with `balanceKnown=false` on RPC failure; `bot ready (Phase 2 — no pipeline yet)`; 60-second labelled heartbeat; SIGINT/SIGTERM shutdown with `closeDb()`; no inbound listener.
- `deploy/narrative-launcher.service`: Linux systemd unit with production `EnvironmentFile`, restart policy, `UMask=0077`, and standard hardening. Not testable on Windows; verify in Phase 9.
- `scripts/copy-assets.mjs`: post-build copy of `migrations.sql` into `dist/db/`.
- `package.json`: root `build` runs both `build:bot` and `build:dashboard`; `start` added; `dev` runs the bot via `tsx`.
- `docs/DECISIONS.md`: D-001 records production configuration via systemd `EnvironmentFile` (dotenv only in development/test).
- `data/.gitkeep` added; `.gitignore` adjusted from `data/` to `data/*` so the keep-file is trackable while DB files remain ignored.

## Preview/staging URL
https://dashboard-five-henna-17.vercel.app

Phase 2 made no dashboard changes, so no new preview deployment was required.

## Deployed commit
Phase 1 deployment ID: `dpl_8cbreqR1bAYS8qSU35n75dsjHTKR`. Phase 2 is a bot-only change.

## Frontend status
Skeletal navigable shell with mock data and the temporary neutral Tailwind system. Final design work remains gated by Phase 6 operator approval.

## Functional vs Placeholder
- **Functional**
  - Environment validation and safe defaults.
  - Structured logging with secret redaction.
  - SQLite initialization, migrations, and repository round-trips.
  - Solana burner balance lookup with sanitized RPC errors.
  - Boot sequence, masked configuration log, heartbeat, and graceful shutdown.
  - Systemd unit template (not executed on Windows).
  - Dashboard auth, navigation, mock approval actions, history filtering, kill-switch toggle.
- **Placeholder / stubbed**
  - All dashboard data remains mock data in `dashboard/lib/mock-data.ts`.
  - No narrative ingestion, scoring, dedup, LLM, Pinata, Telegram, PumpPortal, or snapshot code yet.
  - Footer GitHub link remains `OPERATOR_TO_SUPPLY_GITHUB_URL`.
  - `README.md`, `docs/OPERATIONS.md`, `docs/SECURITY.md`, and `docs/DESIGN.md` remain Phase 6/8 deliverables.

## Design references / mockups / approval status
Not started. Phase 6 will collect references and produce mockups. No approval exists. Temporary neutral styling is active. Do not write final styling.

## Documentation / footer-link status
- `docs/DECISIONS.md` now records D-001 (production systemd `EnvironmentFile`).
- `README.md` is still a placeholder (Phase 8 deliverable).
- In-app docs available at `/docs`.
- Footer links: Documentation -> `/docs` (resolves); GitHub -> `OPERATOR_TO_SUPPLY_GITHUB_URL` (placeholder).

## Test evidence
- Runtime used for all verification: **Node v22.23.4** (pinned in `.nvmrc`; `engines` requires `>=22.23.4`). Use `fnm use 22.23.4` before running npm commands so the `better-sqlite3` native binary matches the runtime ABI.
- `npm test` (raw vitest summary):

```text
 Test Files  4 passed (4)
      Tests  18 passed (18)
   Start at  06:45:59
   Duration  3.44s (transform 607ms, setup 0ms, collect 4.33s, tests 600ms, environment 3ms, prepare 1.65s)
```

- `npm run build`: passed. `build:bot` ran `tsc` and copied `src/db/migrations.sql` to `dist/db/migrations.sql` (1025 bytes). `build:dashboard` completed Next.js 15.5.28 with 10/10 static pages.
- `npm run lint`: `✔ No ESLint warnings or errors` (Next.js reports that `next lint` is deprecated, not an error).
- Valid `.env` boot: masked secrets shown as `••••`; burner public key logged in full; balance `71.8046408` SOL; `balanceKnown=true`; `bot ready (Phase 2 — no pipeline yet)`.
- Invalid env boot: `LAUNCH_THRESHOLD=150` exited with code `1` and logged `LAUNCH_THRESHOLD: LAUNCH_THRESHOLD must be between 0 and 100`.
- SQLite schema verified after boot: `launches`, `bot_state`, `narrative_seen`, plus `idx_launches_status_created_at` (the `sqlite3` CLI was unavailable on this Windows host; the project's `better-sqlite3` driver was used to print `sqlite_master`).

## Known issues
- `deploy/narrative-launcher.service` is a Linux production unit and was not executable on this Windows development host. Verify it in Phase 9 on the VPS (Node path, service user, `EnvironmentFile`, `ReadWritePaths`, permissions).
- Phase 2 has no pipeline; the 60-second heartbeat is the only runtime loop.
- Dashboard remains mock data until Phase 4.

## Deferred to later phases
- `src/db/repositories/state.ts` JSON edge cases: a string that looks like JSON changes type on read; no `deleteState`.
- Migration versioning (`schema_version` table); current migrations are idempotent `CREATE ... IF NOT EXISTS` only.
- `synchronous=FULL` vs `NORMAL` for irreversible launch state.
- Production dotenv vs systemd `EnvironmentFile` is decided and documented in `docs/DECISIONS.md` (D-001); no code change planned.
- Deeper logger wildcards for payloads such as `req.body.token`.
- Migration forward-compatibility for future launch status values. Do not add a snooze status or a `narrative_seen` repository in Phase 2.

## Commands
- `npm run dev` — bot via `tsx src/index.ts`
- `npm run build` — bot + dashboard
- `npm run build:bot` — `tsc` + copy `migrations.sql` to `dist/db/`
- `npm run build:dashboard` — Next.js production build
- `npm start` — run built bot (`node dist/index.js`)
- `npm test` — Vitest
- `npm run lint` — dashboard ESLint
- `cd dashboard && npm run dev` — dashboard dev server

## Environment and safety
- `.env` is required for local development; see `.env.example`.
- In production, configuration comes from `EnvironmentFile=/opt/narrative-launcher/.env` via systemd; dotenv is not loaded when `NODE_ENV=production`.
- `DRY_RUN=true` in all development and test work.
- `AUTO_LAUNCH=false` always unless the operator explicitly requests otherwise.
- Never commit `.env` or `data/` database files.
- Never persist the burner wallet private key or the mint secret key.
- Use Node 22.23.4 for all bot work; Node 24 changes the native ABI required by `better-sqlite3`.

## Important files
PROJECT_SPEC.md · ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · AGENTS.md · src/index.ts · src/config.ts · src/logger.ts · src/db/ · src/deploy/balance.ts · deploy/narrative-launcher.service · scripts/copy-assets.mjs · docs/DECISIONS.md · dashboard/app/ · dashboard/middleware.ts

## Things NOT to change
Node major version; SQLite -> Postgres; adding a queue; changing the PumpPortal create flow; enabling auto-launch; adding public user accounts.

## Next task
Phase 3 — narrative pipeline (dry-run): source interface, scoring, dedup, daily cap, DETECTED/SCORED records. **Do not start Phase 3 until instructed.**

## Blocked by
Nothing for Phase 2. For Phase 4: OpenAI key, Pinata JWT, PumpPortal API key, Telegram bot token and chat ID.
