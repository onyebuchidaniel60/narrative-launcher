import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import { z } from 'zod';

// Load .env only in development/local environments. Production uses the
// systemd EnvironmentFile (see deploy/narrative-launcher.service and
// docs/DECISIONS.md).
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

function parseBoolean(val: unknown, defaultVal: boolean): boolean {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return defaultVal;
}

/**
 * Numbers arrive as strings from process.env. Empty strings must not coerce to
 * 0 (which would silently make LAUNCH_THRESHOLD permissive or set an operator
 * id of 0), so they are converted to undefined and reported as required.
 */
function requiredNumber(
  name: string,
  configure: (schema: z.ZodNumber) => z.ZodNumber = (schema) => schema
): z.ZodEffects<z.ZodNumber, number, unknown> {
  const schema = configure(
    z.number({
      required_error: `${name} is required`,
      invalid_type_error: `${name} must be a number`,
    })
  );

  return z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed === '') return undefined;
      return Number(trimmed);
    }
    return typeof val === 'number' ? val : Number(val);
  }, schema);
}

export const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DRY_RUN: z.preprocess((val) => parseBoolean(val, true), z.boolean()),
    AUTO_LAUNCH: z.preprocess((val) => parseBoolean(val, false), z.boolean()),
    BOT_START_STATE: z.enum(['active', 'paused']).default('paused'),

    POLL_INTERVAL_MINUTES: requiredNumber('POLL_INTERVAL_MINUTES', (schema) =>
      schema.positive({ message: 'POLL_INTERVAL_MINUTES must be greater than 0' })
    ),
    LAUNCH_THRESHOLD: requiredNumber('LAUNCH_THRESHOLD', (schema) =>
      schema
        .min(0, { message: 'LAUNCH_THRESHOLD must be between 0 and 100' })
        .max(100, { message: 'LAUNCH_THRESHOLD must be between 0 and 100' })
    ),
    MAX_LAUNCHES_PER_DAY: requiredNumber('MAX_LAUNCHES_PER_DAY', (schema) =>
      schema
        .int({ message: 'MAX_LAUNCHES_PER_DAY must be an integer' })
        .positive({ message: 'MAX_LAUNCHES_PER_DAY must be greater than 0' })
    ),
    MAX_DEV_BUY_SOL: requiredNumber('MAX_DEV_BUY_SOL', (schema) =>
      schema
        .finite({ message: 'MAX_DEV_BUY_SOL must be a finite number' })
        .positive({ message: 'MAX_DEV_BUY_SOL must be greater than 0' })
    ),
    DEV_BUY_SOL: requiredNumber('DEV_BUY_SOL', (schema) =>
      schema
        .finite({ message: 'DEV_BUY_SOL must be a finite number' })
        .positive({ message: 'DEV_BUY_SOL must be greater than 0' })
    ),
    APPROVAL_TTL_MINUTES: requiredNumber('APPROVAL_TTL_MINUTES', (schema) =>
      schema.positive({ message: 'APPROVAL_TTL_MINUTES must be greater than 0' })
    ),

    SOLANA_RPC_URL: z
      .string({ required_error: 'SOLANA_RPC_URL is required' })
      .min(1, { message: 'SOLANA_RPC_URL is required' })
      .url({ message: 'SOLANA_RPC_URL must be a valid URL' }),
    BURNER_WALLET_PUBLIC_KEY: z
      .string({ required_error: 'BURNER_WALLET_PUBLIC_KEY is required' })
      .min(1, { message: 'BURNER_WALLET_PUBLIC_KEY is required' })
      .refine(
        (value) => {
          try {
            new PublicKey(value);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'BURNER_WALLET_PUBLIC_KEY must be a valid base58 Solana public key' }
      ),

    TELEGRAM_BOT_TOKEN: z
      .string({ required_error: 'TELEGRAM_BOT_TOKEN is required' })
      .min(1, { message: 'TELEGRAM_BOT_TOKEN is required' }),
    TELEGRAM_OPERATOR_CHAT_ID: requiredNumber('TELEGRAM_OPERATOR_CHAT_ID', (schema) =>
      schema.int({ message: 'TELEGRAM_OPERATOR_CHAT_ID must be a valid integer' })
    ),

    OPENAI_API_KEY: z
      .string({ required_error: 'OPENAI_API_KEY is required' })
      .min(1, { message: 'OPENAI_API_KEY is required' }),
    PINATA_JWT: z
      .string({ required_error: 'PINATA_JWT is required' })
      .min(1, { message: 'PINATA_JWT is required' }),
    PUMPPORTAL_API_KEY: z
      .string({ required_error: 'PUMPPORTAL_API_KEY is required' })
      .min(1, { message: 'PUMPPORTAL_API_KEY is required' }),
    SENTIMENT_ALPHA_API_KEY: z.string().optional(),

    DATA_DIR: z.string().default('./data'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
  })
  .refine((data) => data.DEV_BUY_SOL <= data.MAX_DEV_BUY_SOL, {
    message: 'DEV_BUY_SOL cannot exceed MAX_DEV_BUY_SOL',
    path: ['DEV_BUY_SOL'],
  });

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(rawEnv: Record<string, string | undefined> = process.env): Config {
  const result = ConfigSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.errors.map((err) => {
      const field = err.path.join('.') || 'configuration';
      return `${field}: ${err.message}`;
    });

    throw new Error(`Invalid environment configuration:\n- ${errorDetails.join('\n- ')}`);
  }

  return result.data;
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function resetConfigForTest(newConfig?: Config): void {
  cachedConfig = newConfig ?? null;
}
