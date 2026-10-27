# AI_HANDOFF — Narrative Launcher

## PROJECT
Narrative Launcher: autonomous crypto narrative detection and Pump.fun token launch bot with operator approval and a minimal dashboard.

## Current architecture
Node 22.23.4 / TypeScript / better-sqlite3 / Next.js 15 (dashboard). See ARCHITECTURE.md.

## Current phase
Phase 3 complete — narrative detection and scoring (dry-run).

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

### Phase 3 — narrative detection and scoring (dry-run)
- `src/narrative/source.interface.ts`: `NarrativeSource` / `Candidate` contract plus Zod `CandidateSchema` / `validateCandidate` (score 0–100 inclusive, non-empty `text` and `source`).
- `src/narrative/coingecko.ts`: `CoinGeckoTrendingSource` against `https://api.coingecko.com/api/v3/search/trending`; 10 s axios timeout; `User-Agent` header; Zod-validated response; documented rank→score mapping (rank 1 = 100, −10 per rank, floor 10).
- `src/narrative/scorer.ts`: `normaliseNarrative` (lowercase, strip punctuation, drop stopwords, first 10 tokens), `narrativeHash` (SHA-256 hex), and `passesGate` with the fixed rule order `below_threshold` → `duplicate` → `daily_cap`. Threshold is inclusive.
- `src/narrative/sentimentalpha.ts`: `SentimentAlphaSource`. Throws `SENTIMENTALPHA_API_KEY not configured` when the key is absent; also fails clearly when a key *is* present because no API contract is documented (see Known issues).
- `src/pipeline/poll-cycle.ts`: `runPollCycle` — validates the source payload, applies dedup (`narrative_seen` plus launches inside `DEDUP_WINDOW_HOURS`), applies the daily cap, and writes DETECTED→SCORED plus `narrative_seen` in one transaction. Writes `last_poll_at` to `bot_state`. The only external call is the narrative source.
- `src/db/repositories/narrative-seen.ts`: `hasSeenNarrative`, `getNarrativeSeen`, `insertNarrativeSeen`.
- `src/db/repositories/launches.ts`: added `countLaunchIntentsSince` (cap-consuming statuses, `COALESCE(launched_at, created_at)`) and `hasRecentLaunch` (dedup window).
- `src/config.ts`: `NARRATIVE_SOURCE` (`coingecko|sentimentalpha|manual`, default `coingecko`), `DEDUP_WINDOW_HOURS` (default 24), and `BOT_START_STATE` now accepts `running` with `active` retained as a legacy alias.
- `src/index.ts`: selects the source, starts `setInterval(runPollCycle, POLL_INTERVAL_MINUTES * 60_000)` only when the state is `running`, logs `bot paused — no polling` or `manual mode — no automatic polling`, keeps the 60 s heartbeat, and clears both timers on SIGINT/SIGTERM. No inbound listener.
- Tests: `src/__tests__/unit/scorer.test.ts` (6) and `src/__tests__/integration/poll-cycle.test.ts` (6).

#### Phase 3 decisions taken during implementation
1. `BOT_START_STATE`: Phase 2 schema was `active|paused`, Phase 3 spec requires `running`. Both are accepted; `active` normalises to `running` so existing `.env` files keep working.
2. `DEDUP_WINDOW_HOURS` did not exist in config but Phase 3 STEP 4 requires it. Added with default `24` (PROJECT_SPEC calls the dedup window configurable).
3. The spec names `SENTIMENTALPHA_API_KEY`; the existing env var is `SENTIMENT_ALPHA_API_KEY`. The variable was **not** renamed; the thrown message contains the required `SENTIMENTALPHA_API_KEY not configured` text and points at the real variable.
4. Daily cap: real launches count by `launched_at` (Phase 2 decision preserved). Dry-run SCORED rows have no `launched_at`, so `COALESCE(launched_at, created_at)` counts those by `created_at` — otherwise a SCORED row could never consume the cap.
5. `estimated_cost_sol` is stored equal to `DEV_BUY_SOL` in Phase 3. Fee estimation belongs to the Phase 4 approval card.

## Preview/staging URL
https://dashboard-five-henna-17.vercel.app

Phase 3 made no dashboard changes, so no new preview deployment was required.

## Deployed commit
Phase 1 deployment ID: `dpl_8cbreqR1bAYS8qSU35n75dsjHTKR`. Phase 2 and Phase 3 are bot-only changes.

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
  - Narrative source contract with Zod validation; live CoinGecko trending adapter.
  - Narrative normalisation, SHA-256 dedup, score threshold, dedup window, daily cap.
  - Dry-run DETECTED→SCORED persistence in one transaction, plus `last_poll_at`.
  - Poll loop gated by `BOT_START_STATE`, with `paused` and `manual` modes.
- **Placeholder / stubbed**
  - All dashboard data remains mock data in `dashboard/lib/mock-data.ts`.
  - `SentimentAlphaSource` is configuration-gated: it fails clearly instead of guessing an API contract.
  - No LLM, Pinata/IPFS, Telegram, PumpPortal, approval, or launch code yet (Phase 4+).
  - `estimated_cost_sol` equals `DEV_BUY_SOL` (no fee estimation yet).
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
 ✓ src/__tests__/integration/db.test.ts (7 tests) 3482ms
 ✓ src/__tests__/integration/poll-cycle.test.ts (6 tests) 1777ms
 ✓ src/__tests__/unit/config.test.ts (6 tests) 388ms
 ✓ src/__tests__/unit/scorer.test.ts (6 tests) 199ms
 ✓ src/__tests__/unit/logger.test.ts (2 tests) 166ms
 ✓ src/__tests__/unit/balance.test.ts (3 tests) 345ms

 Test Files  6 passed (6)
      Tests  30 passed (30)
   Start at  07:56:03
   Duration  55.26s (transform 3.48s, setup 0ms, collect 97.35s, tests 6.36s, environment 46ms, prepare 17.56s)
```

- `npm run build`: passed. `build:bot` ran `tsc` and copied `src/db/migrations.sql` to `dist/db/migrations.sql` (1025 bytes). `build:dashboard` completed Next.js 15.5.28 with 10/10 static pages.
- `npm run lint`: `✔ No ESLint warnings or errors` (Next.js reports that `next lint` is deprecated, not an error).
- Valid `.env` boot: masked secrets shown as `••••`; burner public key logged in full; balance `71.8046408` SOL; `balanceKnown=true`.
- Phase 3 live poll (`BOT_START_STATE=running`, `NARRATIVE_SOURCE=coingecko`, `DRY_RUN=true`, `POLL_INTERVAL_MINUTES=1`, 95 s): CoinGecko returned 15 real trending entries. `quack-ai` (rank 1, score 100) logged `would_draft` and persisted as `SCORED`; ranks 2–3 (90, 80) were skipped `daily_cap`; the remaining 11 were skipped `below_threshold`. Cycle summary `fetched: 15, passed: 1, skipped: 14`. `last_poll_at` written to `bot_state`.
- DB after the live poll: 1 `launches` row (`status=SCORED`, `composite_score=100`, `tx_signature=null`, `mint_public_key=null`) and 1 matching `narrative_seen` row.
- Invalid env boot (regression check, Phase 2): `LAUNCH_THRESHOLD=150` exits `1` naming the variable.
- SQLite schema verified: `launches`, `bot_state`, `narrative_seen`, plus `idx_launches_status_created_at`. The `sqlite3` CLI is unavailable on this Windows host; the project's `better-sqlite3` driver is used instead.
- No `src/llm`, `src/telegram`, `src/ipfs`, or `src/deploy/pumpportal.ts`. The only outbound HTTP in `src/` is `axios.get` to the CoinGecko trending URL.

## Known issues
- `deploy/narrative-launcher.service` is a Linux production unit and was not executable on this Windows development host. Verify it in Phase 9 on the VPS (Node path, service user, `EnvironmentFile`, `ReadWritePaths`, permissions).
- **CoinGecko trending is a weak signal** — it reflects what is already popular, not an emerging narrative. SentimentAlpha (x402) is the intended production source, but its API contract is undocumented, so `SentimentAlphaSource` currently fails loudly rather than guessing.
- `narrative_seen` is permanent: once a hash is recorded, it blocks forever. `DEDUP_WINDOW_HOURS` currently applies only to `launches` rows, not to `narrative_seen`.
- `normaliseNarrative` can return an empty string for stopword-only text; all such texts would collide on `sha256('')`. No current source produces that shape (CoinGecko text is `name symbol`).
- Daily cap uses the UTC calendar day. Dry-run `SCORED` rows consume the cap and are counted by `created_at` because `launched_at` is null.
- No retry/backoff on CoinGecko rate limiting: an HTTP error fails the whole cycle as `source_error` and the next interval simply tries again.
- Dashboard remains mock data until Phase 4.

## Deferred to later phases
- `src/db/repositories/state.ts` JSON edge cases: a string that looks like JSON changes type on read; no `deleteState`.
- Migration versioning (`schema_version` table); current migrations are idempotent `CREATE ... IF NOT EXISTS` only.
- `synchronous=FULL` vs `NORMAL` for irreversible launch state.
- Production dotenv vs systemd `EnvironmentFile` is decided and documented in `docs/DECISIONS.md` (D-001); no code change planned.
- Deeper logger wildcards for payloads such as `req.body.token`.
- Migration forward-compatibility for future launch status values. Do not add a snooze status in Phase 3.
- SentimentAlpha adapter: implement once the endpoint/request/response contract is documented (x402-paid feed).
- `narrative_seen` pruning/TTL so the dedup table does not grow unbounded.
- Fee estimation for `estimated_cost_sol` (Phase 4 approval card must show total estimated cost).
- CoinGecko caching/backoff if the free endpoint proves rate-limited in production.

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
- `BOT_START_STATE=paused` is the default; only `running` (or legacy `active`) starts the poll loop.
- `NARRATIVE_SOURCE=coingecko` is the default; `manual` disables automatic polling.
- Never commit `.env` or `data/` database files.
- Never persist the burner wallet private key or the mint secret key.
- Use Node 22.23.4 for all bot work; Node 24 changes the native ABI required by `better-sqlite3`.

## Important files
PROJECT_SPEC.md · ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · AGENTS.md · src/index.ts · src/config.ts · src/logger.ts · src/narrative/ · src/pipeline/poll-cycle.ts · src/db/ · src/deploy/balance.ts · deploy/narrative-launcher.service · scripts/copy-assets.mjs · docs/DECISIONS.md · dashboard/app/ · dashboard/middleware.ts

## Things NOT to change
Node major version; SQLite -> Postgres; adding a queue; changing the PumpPortal create flow; enabling auto-launch; adding public user accounts.

## Next task
Phase 4 — metadata, IPFS, Telegram cards, dashboard real data. **Do not start Phase 4 until instructed.**

## Blocked by
Nothing for Phase 3. For Phase 4: OpenAI key, Pinata JWT, PumpPortal API key, Telegram bot token and chat ID (all present as placeholders in `.env`; real values required for live use). SentimentAlpha remains blocked on a documented API contract.
