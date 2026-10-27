# AGENTS.md — Rules for the Coding Agent

## Project
Narrative Launcher: a Node.js/TypeScript bot that detects crypto narratives, drafts a Pump.fun token, requests operator approval via Telegram, and deploys via PumpPortal. A Next.js dashboard provides inspection and pause/resume. Read `PROJECT_SPEC.md`, `ARCHITECTURE.md`, and `IMPLEMENTATION_PLAN.md` before writing code.

## Architecture (fixed — do not change without approval)
- Node.js >= 22.23.4 (LTS). TypeScript strict. npm with committed lockfile.
- Bot: long-running process, no inbound HTTP listener. SQLite via better-sqlite3.
- Dashboard: Next.js App Router + Tailwind in `dashboard/`. Reads a snapshot (Vercel) or SQLite (self-hosted).
- Integrations: SentimentAlpha/CoinGecko, OpenAI gpt-4o-mini, Pinata, PumpPortal Lightning API, @solana/web3.js@3 (balance/Pubkey/Keypair only), Telegram Bot API.
- Do not add: a database server, queue, Redis, Kubernetes, Prisma, a second Solana SDK, user accounts, payments, admin CRUD.

## Coding rules
1. Follow the spec. Do not invent features.
2. Do not modify files unrelated to the current phase.
3. Reuse existing components and utilities.
4. Validate all external payloads with Zod.
5. Never log secrets. Use the pino redaction config.
6. Never persist the burner wallet private key or the mint secret key.
7. Generate the mint keypair per launch; store only the public key.
8. Default `DRY_RUN=true`; live mode requires explicit operator instruction.
9. Default `AUTO_LAUNCH=false`; never enable without explicit approval.
10. Do not retry PumpPortal `create` after a response has been received.
11. Enforce idempotency with conditional status updates.
12. Run tests after every change; report actual results. Never claim success without evidence.

## Business rules (do not alter)
- Score threshold inclusive (`>=`).
- Dedup by SHA-256 of normalised narrative.
- Daily cap and dev-buy cap are hard limits.
- Approval expires after the configured TTL.
- Double approval must produce one deployment.
- Deployment is irreversible; the approval card must show the estimated cost.

## Security rules
- Operator Telegram ID is an integer allowlist; compare strictly.
- Dashboard token is server-only; never prefix with `NEXT_PUBLIC_`.
- Redact `authorization`, `apiKey`, `jwt`, `secretKey`, `privateKey`, `token` in logs.
- Treat narrative text as untrusted; validate LLM output with Zod; the LLM must not influence amounts or destinations.
- Run the adversarial checklist in Phase 9.

## Testing and git
- Vitest for unit/integration; MSW for HTTP mocks; Playwright for dashboard e2e in Phase 8.
- Small commits with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `release:`).
- One phase per commit (or a small number of commits within a phase). Do not batch phases.

## Frontend sequencing rules (mandatory)
1. In Phase 1, deploy a skeletal but navigable dashboard to Vercel and report the exact URL. It must use mock data and clearly labelled placeholders.
2. Keep the preview updated after each verified phase. Report the deployed commit and what changed.
3. Do not begin final visual design before Phase 6/7. Use a temporary neutral visual system in Phases 1–5.
4. In Phase 6, produce reference-informed mockups and **STOP for explicit operator approval**. Do not write final styling before the approval is recorded in `AI_HANDOFF.md` and `docs/DESIGN.md`.
5. In Phase 7, implement only the approved design; do not change behaviour, APIs, or schema.
6. In Phase 8, include the real Documentation (`/docs`) and GitHub links in the footer, all applicable states, responsive behaviour, accessibility, metadata/icons, and no dead links. Never fabricate URLs. If the repo is private, stop and ask the operator.

## Documentation
- `README.md`: setup, env vars, dev, test, deploy, troubleshooting.
- `docs/OPERATIONS.md`: pause, kill switch, wallet rotation, PumpPortal failure handling, backup/restore.
- `docs/SECURITY.md`: threat model summary and adversarial checklist.
- `docs/DESIGN.md`: approved references, tokens, deviations (filled in Phase 6/7).
- `docs/DECISIONS.md`: intentional omissions and their approval.
- The dashboard `/docs` page renders the relevant repo docs.

## Ambiguity and failure
- If a requirement is ambiguous, stop and ask. Do not guess.
- If a phase cannot be completed, report the blocker, what was attempted, and the safest partial state. Do not mark it complete.
- If a test fails, fix it or report it. Do not skip it.
- If an external API changes shape, stop and report the difference; do not silently adapt business logic.

## Stop rule
Implement one phase, run tests, update `AI_HANDOFF.md`, commit, and **STOP**. Do not proceed to the next phase until instructed.
Every phase commit must be pushed to origin/main before the phase is reported complete. If push fails, the phase is not complete — report the blocker and stop.