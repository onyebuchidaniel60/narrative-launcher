# IMPLEMENTATION_PLAN — Narrative Launcher

Phases are executed one at a time. After each phase: test → inspect → commit → update AI_HANDOFF.md → STOP. Do not batch phases.

## Phase 1 — Repository foundation + skeletal dashboard preview
Goal: monorepo, Node 22.23.4 pinned, Next.js shell on Vercel.
Deliverables: `package.json` with engines, `.nvmrc`, `dashboard/` routes (`/login`, `/`, `/approvals`, `/history`, `/settings`, `/docs`, `not-found.tsx`, `error.tsx`), mock data, Vercel URL.
Tests: `node -v` >= 22.23.4, `npm run build`, `npm run lint` in `dashboard/`, route smoke.
Acceptance: preview URL loads; nav works; login sets cookie; AI_HANDOFF records URL, commit SHA, and "skeletal, mock data".
Commit: `feat: phase 1 — repository foundation and skeletal dashboard preview`.

## Phase 2 — Bot foundation
Goal: config validation, pino, SQLite migrations, balance check, systemd unit.
Tests: config rejects bad env; migrations create 3 tables; balance mock returns number.
Acceptance: bot starts and logs balance; invalid `.env` exits non-zero.
Commit: `feat: phase 2 — bot foundation and persistence`.

## Phase 3 — Narrative pipeline (dry-run)
Goal: source interface, scoring, dedup, daily cap, DETECTED/SCORED records.
Tests: threshold boundary (>=), dedup hash, malformed response skipped.
Acceptance: score 85 → SCORED; score 50 → nothing; duplicate → nothing.
Commit: `feat: phase 3 — narrative detection and scoring (dry-run)`.

## Phase 4 — Metadata, IPFS, Telegram cards, dashboard real data
Goal: LLM + Zod, Pinata, Telegram inline cards, snapshot, dashboard auth + read paths, pause/resume.
Tests: LLM invalid → template fallback; Pinata CID; non-operator callback ignored; dashboard unauth redirect; dry-run approval writes `would_launch`.
Acceptance: real Telegram card + dashboard pending item; pause stops polling within 15s.
Commit: `feat: phase 4 — metadata, IPFS, Telegram approvals, dashboard integration`.

## Phase 5 — Functional completion (dry-run)
Goal: all status transitions, double-approval guard, TTL sweep, balance guard, restart recovery, `/history`, `/settings`, `/docs`.
Tests: edge-case matrix rows for approval, expiry, cap, restart.
Acceptance: every failure state behaves as specified; no dead links; e2e dry-run passes.
Commit: `feat: phase 5 — functional completion and failure states (dry-run)`.

## Phase 6 — Design references and mockups (HARD STOP)
Goal: references, mockups for `/`, `/approvals`, `/history` at desktop/mobile; `docs/DESIGN.md` draft.
Acceptance: mockups exist; operator feedback captured; **no styling code written**.
Commit: `docs: phase 6 — design references and mockups (awaiting approval)`.
**STOP.** Wait for explicit operator approval recorded in `AI_HANDOFF.md` and `docs/DESIGN.md`.

## Phase 7 — Approved final UI
Goal: apply approved design to working screens without behaviour changes.
Tests: build, Playwright smoke, contrast check.
Acceptance: visual match to approved mockups; Phase 5 tests still pass.
Commit: `feat: phase 7 — approved final UI`.

## Phase 8 — Frontend and documentation completeness
Goal: footer Docs (`/docs`) + GitHub links, all states, metadata/icons, responsive, accessibility, `README.md` + `docs/`.
Tests: Playwright footer link resolution, axe scan, grep for `href="#"`.
Acceptance: no dead links; docs readable via `/docs` and in-repo; operator confirms GitHub URL (or approved alternative for private repo).
Commit: `feat: phase 8 — frontend and documentation completeness`.

## Phase 9 — Security audit, live smoke test, production
Goal: adversarial checklist, `npm audit`, one real minimal launch, production deploy, monitoring.
Tests: full acceptance list; Solscan confirmation.
Acceptance: one real token created and visible; no secrets in logs; production URL confirmed.
Commit: `release: phase 9 — production smoke test and deployment`.

## Global rules
- Do not start a phase without the previous phase's commit and updated `AI_HANDOFF.md`.
- Do not skip the Phase 6 approval gate.
- Do not change architecture without operator approval.
- Run tests before claiming completion; report actual results.