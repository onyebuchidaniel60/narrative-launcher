# ARCHITECTURE — Narrative Launcher

## Overview
Two processes on one VPS (plus a Vercel dashboard preview):
1. `bot` — a Node.js/TypeScript long-running process (poll → score → draft → Telegram → deploy).
2. `dashboard` — a Next.js app that reads a bot-generated snapshot (Vercel mode) or the SQLite file (self-hosted mode).

The only shared state is `data/launcher.db` and `data/dashboard-snapshot.json`.

## Stack
Node 22.23.4 LTS (pinned) · TypeScript strict · better-sqlite3 · axios · node-telegram-bot-api v2 · Zod · pino · OpenAI gpt-4o-mini · Pinata · PumpPortal Lightning API · @solana/web3.js@3 (balance + Pubkey + Keypair only) · Next.js 15 + Tailwind · Vercel (preview) · Hetzner VPS + systemd.

## Data model
- `launches` (id, narrative_text, narrative_hash UNIQUE, source, composite_score, token_name, token_symbol, token_description, metadata_uri, image_uri, mint_public_key, tx_signature, dev_buy_sol, estimated_cost_sol, status, error_code, error_message, created_at, updated_at, approved_at, launched_at)
- `bot_state` (key PRIMARY KEY, value JSON, updated_at)
- `narrative_seen` (hash PRIMARY KEY, first_seen_at, last_score)

Indexes: `(status, created_at)` on `launches`; `narrative_hash` unique on `launches`.

SQLite, WAL mode, synchronous writes, file permissions `600`.

## Pipeline
Poller (every `POLL_INTERVAL_MINUTES`) → source → scorer/dedup → LLM → Pinata → Telegram card + SQLite `PENDING_APPROVAL` → operator callback → status guard → balance guard → PumpPortal create → `LAUNCHED`/`FAILED` → snapshot write.

## Concurrency
Single bot process. SQLite transitions use conditional `UPDATE ... WHERE status = ?` to enforce idempotency. Dashboard writes only `bot_state`; the bot is the sole writer of launch status. Bot polls `bot_state` every 10 seconds.

## Security boundaries
- No inbound listener on the bot.
- Dashboard auth via bearer cookie.
- Telegram integer allowlist.
- No funding private key held by the bot; mint keypair generated per launch and discarded.
- Secrets in `.env`, redacted in pino logs.

## Deployment
- Bot: `deploy/narrative-launcher.service` on the VPS; `npm ci && npm run build && npm start`.
- Dashboard: Vercel preview for inspection; production can be the same Next.js app self-hosted on the VPS. The footer links to the real repo and `/docs`.
- SQLite backup: nightly `cp data/launcher.db data/backups/launcher-$(date +%F).db` via cron; documented in `docs/OPERATIONS.md`.

## Key decisions
- PumpPortal over raw SDK: lower integration risk, documented create endpoint, no transaction signing plumbing.
- SQLite over Postgres: single writer, tiny data, zero operations.
- Snapshot over live DB on Vercel: Vercel cannot reach the VPS filesystem.
- No queue/microservices: volume is a few launches per day.
- Manual approval default: the single most important product decision.
- Bot never holds the funding wallet private key.

## Non-goals
Multi-chain, multi-user, public API, end-user payments, social automation, admin CRUD.