import path from 'node:path';
import { getConfig, type Config } from './config.js';
import { logger } from './logger.js';
import { closeDb, initDb } from './db/index.js';
import { getBurnerBalance, sanitizeRpcUrl } from './deploy/balance.js';
import { CoinGeckoTrendingSource } from './narrative/coingecko.js';
import { SentimentAlphaSource } from './narrative/sentimentalpha.js';
import type { NarrativeSource } from './narrative/source.interface.js';
import { runPollCycle } from './pipeline/poll-cycle.js';

const HEARTBEAT_INTERVAL_MS = 60_000;

function maskSecret(): string {
  return '••••';
}

function loadValidatedConfig(): Config {
  try {
    return getConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message }, 'invalid environment configuration; exiting');
    process.exit(1);
  }
}

function maskedConfig(config: Config): Record<string, unknown> {
  return {
    nodeEnv: config.NODE_ENV,
    dryRun: config.DRY_RUN,
    autoLaunch: config.AUTO_LAUNCH,
    botStartState: config.BOT_START_STATE,
    pollIntervalMinutes: config.POLL_INTERVAL_MINUTES,
    launchThreshold: config.LAUNCH_THRESHOLD,
    maxLaunchesPerDay: config.MAX_LAUNCHES_PER_DAY,
    maxDevBuySol: config.MAX_DEV_BUY_SOL,
    devBuySol: config.DEV_BUY_SOL,
    approvalTtlMinutes: config.APPROVAL_TTL_MINUTES,
    dedupWindowHours: config.DEDUP_WINDOW_HOURS,
    narrativeSource: config.NARRATIVE_SOURCE,
    solanaRpcUrl: sanitizeRpcUrl(config.SOLANA_RPC_URL),
    burnerWalletPublicKey: config.BURNER_WALLET_PUBLIC_KEY,
    telegramBotToken: maskSecret(),
    telegramOperatorChatId: config.TELEGRAM_OPERATOR_CHAT_ID,
    openaiApiKey: maskSecret(),
    pinataJwt: maskSecret(),
    pumpportalApiKey: maskSecret(),
    sentimentAlphaApiKey: config.SENTIMENT_ALPHA_API_KEY ? maskSecret() : undefined,
    dataDir: config.DATA_DIR,
    logLevel: config.LOG_LEVEL,
  };
}

/** `manual` intentionally returns null: no automatic polling of any kind. */
function createNarrativeSource(config: Config): NarrativeSource | null {
  switch (config.NARRATIVE_SOURCE) {
    case 'coingecko':
      return new CoinGeckoTrendingSource();
    case 'sentimentalpha':
      return new SentimentAlphaSource(config.SENTIMENT_ALPHA_API_KEY);
    case 'manual':
      return null;
  }
}

async function main(): Promise<void> {
  const config = loadValidatedConfig();
  logger.info({ config: maskedConfig(config) }, 'configuration loaded');

  const dbPath = path.join(config.DATA_DIR, 'launcher.db');
  const db = initDb(dbPath);
  logger.info({ dbPath }, 'database initialized');

  let balanceSol: number | null = null;
  let balanceKnown = false;

  try {
    balanceSol = await getBurnerBalance(config);
    balanceKnown = true;
    logger.info({ balanceSol, balanceKnown }, 'burner balance');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ error: message, balanceKnown }, 'failed to read burner balance; continuing');
  }

  logger.info(
    { dryRun: config.DRY_RUN, autoLaunch: config.AUTO_LAUNCH, balanceKnown, balanceSol },
    'bot ready (Phase 3 — dry-run pipeline)'
  );

  const source = createNarrativeSource(config);
  let pollTimer: NodeJS.Timeout | null = null;
  let pollInFlight = false;

  if (!source) {
    logger.info({ narrativeSource: config.NARRATIVE_SOURCE }, 'manual mode — no automatic polling');
  } else if (config.BOT_START_STATE === 'paused') {
    logger.info({ narrativeSource: source.name }, 'bot paused — no polling');
  } else {
    const intervalMs = config.POLL_INTERVAL_MINUTES * 60 * 1000;
    logger.info({ narrativeSource: source.name, intervalMs }, 'starting poll loop');

    pollTimer = setInterval(() => {
      if (pollInFlight) {
        logger.warn({ narrativeSource: source.name }, 'poll cycle still running; skipping tick');
        return;
      }

      pollInFlight = true;
      runPollCycle(config, db, source)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          logger.error({ error: message, narrativeSource: source.name }, 'poll cycle crashed');
        })
        .finally(() => {
          pollInFlight = false;
        });
    }, intervalMs);
  }

  const heartbeat = setInterval(() => {
    logger.info({ balanceKnown, balanceSol }, 'heartbeat (Phase 3 — dry-run pipeline)');
  }, HEARTBEAT_INTERVAL_MS);

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(heartbeat);
    if (pollTimer) clearInterval(pollTimer);
    logger.info({ signal }, 'shutting down');
    closeDb();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error({ error: message }, 'fatal startup error');
  process.exit(1);
});
