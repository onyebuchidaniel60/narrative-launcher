# PROJECT_SPEC — Narrative Launcher

## 1. Product overview
An autonomous bot that detects emerging crypto narratives, generates a token identity from them, and launches the token on Pump.fun. It is operated by a single human via Telegram and a minimal read-mostly dashboard. It is self-hosted and funded by the operator's own SOL.

## 2. Users
One operator. No public users, no accounts, no roles beyond "operator" and "system".

## 3. Core user flows
A. Detect → score → generate metadata → IPFS → Telegram approval card → approve → PumpPortal create → confirmation.
B. Manual `/launch <narrative>` from Telegram.
C. Pause/resume via Telegram or dashboard.
D. Alert-only / dry-run mode.
E. Dashboard inspection (status, approvals, history, settings).

## 4. Features (MVP must-have)
1. Narrative ingestion from one primary source + one fallback.
2. Composite scoring gate with configurable threshold and dedup window.
3. LLM metadata generation (name, symbol, description, optional social links).
4. Pinata IPFS upload (default image + metadata JSON).
5. Telegram approval cards with inline Approve/Reject/Snooze; operator allowlist.
6. PumpPortal Lightning API token creation with dev buy.
7. SQLite persistence of launches and bot state.
8. Minimal dashboard: status, approvals, history, settings, docs, login, 404, error.
9. Safety rails: dev-buy cap, daily launch cap, balance guard, manual approval default, kill switch.
10. Repository documentation.

## 5. Business rules
- Score threshold inclusive (`>=`).
- Dedup by SHA-256 of normalised narrative within a configurable window.
- Max 3 launches/day (default env `MAX_LAUNCHES_PER_DAY=1` in example; production set by operator).
- Max 0.1 SOL dev buy (default `MAX_DEV_BUY_SOL`); balance must cover estimated cost.
- Approval expires after 30 minutes (default).
- Double approval is idempotent (conditional UPDATE).
- Deployment is irreversible; no automatic retry after a PumpPortal response has been received.

## 6. Data model
Tables: `launches`, `bot_state`, `narrative_seen`. Full columns in ARCHITECTURE.md §Data model.

## 7. Authentication
Telegram operator allowlist (integer ID) + dashboard bearer token (≥32 bytes, httpOnly Secure SameSite=Strict cookie). No user accounts.

## 8. API requirements
Consumes: SentimentAlpha or CoinGecko, OpenAI, Pinata, PumpPortal, Solana RPC, Telegram Bot API. No public API is exposed. Dashboard reads SQLite (self-hosted) or a snapshot file (Vercel).

## 9. UI requirements and route inventory
`/login`, `/`, `/approvals`, `/history`, `/settings`, `/docs`, `not-found`, `error`. Global nav + footer. Responsive at 375/768/1280. Accessible basics.

## 10. Early skeletal frontend and deployment plan
Phase 1 deploys a navigable shell to Vercel with mock data. The operator receives the exact URL. The preview is updated after each verified phase.

## 11. End-to-end functionality completion gate
Phase 5 must pass: detection → card → approval → dry-run record; dashboard parity; pause/resume; restart recovery; all failure states.

## 12. Design-reference, mockup, and operator-approval gate
Phase 6 produces reference-informed mockups. Phase 7 cannot start without written operator approval recorded in `AI_HANDOFF.md` and `docs/DESIGN.md`. The coding agent must not choose a final aesthetic unilaterally.

## 13. Final frontend completeness
Footer with real Documentation (`/docs`) and GitHub links; all applicable states; metadata/icons; no dead links; accessibility basics; responsive behaviour.

## 14. Security requirements
Node >=22.23.4; burner funding key never held by the bot; mint secret never persisted; secrets redacted in logs; prompt-injection defences; idempotent approvals; `.env` validation on boot; adversarial audit in Phase 9.

## 15. Out-of-scope
Copy-trading, multi-chain, user accounts, end-user payments, social auto-posting, mobile app, public discovery feed, admin CRUD, analytics/consent/legal pages (approved omission; recorded in `docs/DECISIONS.md`).

## 16. Acceptance criteria
The MVP is done when a real token can be created with operator approval; the dashboard is navigable and authenticated; the daily cap works; restart preserves state; documentation is complete; no dead links; footer links resolve.