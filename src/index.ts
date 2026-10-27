import path from 'node:path';
import { getConfig, type Config } from './config.js';
import { logger } from './logger.js';
import { closeDb, initDb } from './db/index.js';
import { getBurnerBalance, sanitizeRpcUrl } from './deploy/balance.js';

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

async function main(): Promise<void> {
  const config = loadValidatedConfig();
  logger.info({ config: maskedConfig(config) }, 'configuration loaded');

  const dbPath = path.join(config.DATA_DIR, 'launcher.db');
  initDb(dbPath);
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
    'bot ready (Phase 2 — no pipeline yet)'
  );

  const heartbeat = setInterval(() => {
    logger.info({ balanceKnown, balanceSol }, 'heartbeat (Phase 2 — no pipeline yet)');
  }, HEARTBEAT_INTERVAL_MS);

  let shuttingDown = false;
  const shutdown = (signal: NodeJS.Signals): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(heartbeat);
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
