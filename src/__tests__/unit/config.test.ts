import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../config.js';

const VALID_ENV = {
  NODE_ENV: 'test',
  DRY_RUN: 'true',
  AUTO_LAUNCH: 'false',
  BOT_START_STATE: 'paused',
  POLL_INTERVAL_MINUTES: '5',
  LAUNCH_THRESHOLD: '75',
  MAX_LAUNCHES_PER_DAY: '1',
  MAX_DEV_BUY_SOL: '0.1',
  DEV_BUY_SOL: '0.05',
  APPROVAL_TTL_MINUTES: '30',
  SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  BURNER_WALLET_PUBLIC_KEY: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  TELEGRAM_BOT_TOKEN: '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ',
  TELEGRAM_OPERATOR_CHAT_ID: '123456789',
  OPENAI_API_KEY: 'sk-mock-key',
  PINATA_JWT: 'mock-pinata-jwt',
  PUMPPORTAL_API_KEY: 'mock-pumpportal-key',
  DATA_DIR: './data',
};

describe('Config Loader (Zod)', () => {
  it('parses a valid env fixture successfully', () => {
    const config = loadConfig(VALID_ENV);
    expect(config.LAUNCH_THRESHOLD).toBe(75);
    expect(config.DEV_BUY_SOL).toBe(0.05);
    expect(config.MAX_DEV_BUY_SOL).toBe(0.1);
    expect(config.DRY_RUN).toBe(true);
    expect(config.AUTO_LAUNCH).toBe(false);
    expect(config.BOT_START_STATE).toBe('paused');
    expect(config.TELEGRAM_OPERATOR_CHAT_ID).toBe(123456789);
  });

  it('throws and names the missing variable when TELEGRAM_BOT_TOKEN is missing', () => {
    const invalidEnv = { ...VALID_ENV };
    delete (invalidEnv as Record<string, string | undefined>).TELEGRAM_BOT_TOKEN;

    expect(() => loadConfig(invalidEnv)).toThrowError(/TELEGRAM_BOT_TOKEN: TELEGRAM_BOT_TOKEN is required/);
  });

  it('throws when LAUNCH_THRESHOLD is 150 (outside 0-100 range)', () => {
    const invalidEnv = {
      ...VALID_ENV,
      LAUNCH_THRESHOLD: '150',
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/LAUNCH_THRESHOLD: LAUNCH_THRESHOLD must be between 0 and 100/);
  });

  it('throws when DEV_BUY_SOL > MAX_DEV_BUY_SOL', () => {
    const invalidEnv = {
      ...VALID_ENV,
      DEV_BUY_SOL: '0.2',
      MAX_DEV_BUY_SOL: '0.1',
    };

    expect(() => loadConfig(invalidEnv)).toThrowError(/DEV_BUY_SOL: DEV_BUY_SOL cannot exceed MAX_DEV_BUY_SOL/);
  });

  it('defaults DRY_RUN to true when unset', () => {
    const envWithoutDryRun = { ...VALID_ENV };
    delete (envWithoutDryRun as Record<string, string | undefined>).DRY_RUN;

    const config = loadConfig(envWithoutDryRun);
    expect(config.DRY_RUN).toBe(true);
  });

  it('lists all invalid variables in a single error message', () => {
    const emptyEnv = {};
    expect(() => loadConfig(emptyEnv)).toThrowError(/POLL_INTERVAL_MINUTES/);
    try {
      loadConfig(emptyEnv);
    } catch (e: any) {
      expect(e.message).toContain('SOLANA_RPC_URL');
      expect(e.message).toContain('TELEGRAM_BOT_TOKEN');
      expect(e.message).toContain('OPENAI_API_KEY');
    }
  });
});
