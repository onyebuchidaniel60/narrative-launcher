# AI_HANDOFF — Narrative Launcher

## PROJECT
Narrative Launcher: autonomous crypto narrative detection and Pump.fun token launch bot with operator approval and a minimal dashboard.

## Current architecture
Node 22.23.4 / TypeScript / better-sqlite3 / Next.js 15 (dashboard). See ARCHITECTURE.md.

## Current phase
Phase 0 — blueprint complete, implementation not started.

## Completed work
- Product definition, MVP scope, business logic, data model, architecture, stack, API spec, security design, UX structure, testing strategy, repo structure, env vars, phased plan.
- 5 source documents present: PROJECT_SPEC.md, ARCHITECTURE.md, IMPLEMENTATION_PLAN.md, AGENTS.md, AI_HANDOFF.md
- README.md present (placeholder / Phase 8 deliverable)
- No scaffolding yet: package.json, .nvmrc, tsconfig.json, vitest.config.ts, .gitignore, .env.example, deploy/, src/, dashboard/, docs/ do not exist — these are created in Phase 1, Phase 2, and Phase 8 as specified.

## Preview/staging URL
Not yet deployed. Phase 1 will record the exact Vercel URL here.

## Deployed commit
None.

## Frontend status
Not started. Phase 1 will create a skeletal navigable shell with mock data.

## Design references / mockups / approval status
Not started. Phase 6 will collect references and produce mockups. No approval exists. Do not write final styling.

## Documentation / footer-link status
Docs scaffolded in-repo. Phase 8 will add footer Docs (`/docs`) and GitHub links. GitHub URL must be supplied by the operator; if private, record the approved alternative.

## Test evidence
None yet.

## Known issues
None.

## Commands
- `npm run dev` (bot, dry-run)
- `npm run build`
- `npm test`
- `cd dashboard && npm run dev`
- `node -v` must be >= 22.23.4

## Environment and safety
- `.env` required; see `.env.example`.
- `DRY_RUN=true` in all development and test work.
- `AUTO_LAUNCH=false` always unless the operator explicitly requests otherwise.
- Never commit `.env` or `data/`.

## Important files
PROJECT_SPEC.md · ARCHITECTURE.md · IMPLEMENTATION_PLAN.md · AGENTS.md · src/config.ts · src/pipeline/poll-cycle.ts · src/deploy/pumpportal.ts · dashboard/app/

## Things NOT to change
Node major version; SQLite → Postgres; adding a queue; changing the PumpPortal create flow; enabling auto-launch; adding public user accounts.

## Next task
Implement **Phase 1 only** as defined in IMPLEMENTATION_PLAN.md:
1. Initialise the repo with the pinned Node version and lockfile.
2. Create the Next.js dashboard shell with `/login`, `/`, `/approvals`, `/history`, `/settings`, `/docs`, 404, and error routes.
3. Use mock data and a temporary neutral Tailwind style.
4. Deploy to Vercel.
5. Update this file with the exact preview URL, the deployed commit, what is functional vs placeholder, and test evidence.
6. Commit: `feat: phase 1 — repository foundation and skeletal dashboard preview`.
7. **STOP.** Do not start Phase 2.

## Blocked by
Nothing. Operator must provide: a Vercel project, a test Telegram bot token and chat ID, and (for Phase 4) an OpenAI key, Pinata JWT, and PumpPortal API key. Phase 1 only requires the Vercel project.