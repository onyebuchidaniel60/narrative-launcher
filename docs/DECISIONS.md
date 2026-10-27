# DECISIONS — Narrative Launcher

## D-001: Production configuration comes from the systemd unit, not dotenv

- **Date:** 2026-10-27
- **Status:** Accepted
- **Phase:** 2

### Decision
`src/config.ts` loads `.env` with `dotenv` only when `NODE_ENV` is neither
`production` nor `test`. In production, configuration is supplied by
`deploy/narrative-launcher.service` through `Environment=NODE_ENV=production`
and `EnvironmentFile=/opt/narrative-launcher/.env`.

### Rationale
The bot runs as a systemd service on a single VPS. Using systemd for the
production environment keeps the source of truth in one place, avoids a second
configuration loader at runtime, and allows the unit to fail fast when the
environment file is missing or unreadable. Local development and tests keep
using `.env`.

### Consequences
- The production `.env` must exist at `/opt/narrative-launcher/.env`, be owned
  by the service user, and have restrictive permissions (for example `600`).
- Running `NODE_ENV=production node dist/index.js` manually requires the
  environment to be exported by the caller; dotenv will not read `.env`.
- `.env` and `.env.*` remain gitignored; `.env.example` is the committed
  template.
