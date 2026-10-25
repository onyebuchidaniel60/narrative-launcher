# Narrative Launcher

An autonomous bot that detects emerging crypto narratives, drafts a token identity from them, and launches the token on **Pump.fun** — with operator approval and hard safety rails.

The bot is self-hosted, single-operator, and defaults to **manual approval** with `DRY_RUN=true`. No funding private key is ever held by the bot.

## Requirements

- **Node.js >= 22.23.4** (pinned via `.nvmrc`; the 22.x line below 22.23.4 is affected by CVE-2026-111497 / Node2Shell)
- npm with committed `package-lock.json`
- A funded Solana burner wallet (**public key only** — the bot never stores the funding secret)
- Accounts/keys: OpenAI, Pinata, PumpPortal, and a Telegram bot token
- Optional: SentimentAlpha x402 token (otherwise CoinGecko trending is used as a fallback source)

## Quick start (dry-run)

```bash
nvm use
npm ci
cp .env.example .env
# fill in .env — keep DRY_RUN=true and AUTO_LAUNCH=false
npm run dev