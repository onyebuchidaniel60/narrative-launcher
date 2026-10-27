import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { getBurnerBalance, sanitizeRpcUrl } from '../../deploy/balance.js';
import type { Config } from '../../config.js';

const MOCK_RPC_URL = 'http://localhost:8899';
const MOCK_PUBKEY = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';

const testConfig: Config = {
  NODE_ENV: 'test',
  DRY_RUN: true,
  AUTO_LAUNCH: false,
  BOT_START_STATE: 'paused',
  POLL_INTERVAL_MINUTES: 5,
  LAUNCH_THRESHOLD: 75,
  MAX_LAUNCHES_PER_DAY: 1,
  MAX_DEV_BUY_SOL: 0.1,
  DEV_BUY_SOL: 0.05,
  APPROVAL_TTL_MINUTES: 30,
  SOLANA_RPC_URL: MOCK_RPC_URL,
  BURNER_WALLET_PUBLIC_KEY: MOCK_PUBKEY,
  TELEGRAM_BOT_TOKEN: '123456:mock_token',
  TELEGRAM_OPERATOR_CHAT_ID: 123456789,
  OPENAI_API_KEY: 'sk-mock-key',
  PINATA_JWT: 'mock-pinata-jwt',
  PUMPPORTAL_API_KEY: 'mock-pumpportal-key',
  DATA_DIR: './data',
};

const server = setupServer(
  http.post(MOCK_RPC_URL, async ({ request }) => {
    const body = (await request.json()) as any;
    if (body?.method === 'getBalance') {
      return HttpResponse.json({
        jsonrpc: '2.0',
        result: {
          context: { slot: 100 },
          value: 1_000_000_000,
        },
        id: body.id,
      });
    }
    return HttpResponse.json({ error: 'unknown method' }, { status: 400 });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Burner Balance Checker', () => {
  it('mocked getBalance returns 1_000_000_000 lamports -> getBurnerBalance() returns 1 SOL', async () => {
    const balanceSol = await getBurnerBalance(testConfig);
    expect(balanceSol).toBe(1);
  });

  it('mocked RPC network failure/timeout -> throws a clear error (does not return 0) and never leaks URL query/userinfo', async () => {
    server.use(
      http.post(MOCK_RPC_URL, () => {
        return HttpResponse.error();
      })
    );

    await expect(getBurnerBalance(testConfig)).rejects.toThrowError(
      /Failed to fetch Solana burner balance from http:\/\/localhost:8899/
    );

    const secretConfig: Config = {
      ...testConfig,
      SOLANA_RPC_URL: 'http://user:secret@localhost:8899?api-key=TOPSECRET',
    };

    expect(sanitizeRpcUrl(secretConfig.SOLANA_RPC_URL)).toBe('http://localhost:8899');

    let thrown: Error | undefined;
    try {
      await getBurnerBalance(secretConfig);
    } catch (error) {
      thrown = error as Error;
    }

    expect(thrown).toBeDefined();
    expect(thrown?.message).not.toContain('?');
    expect(thrown?.message).not.toContain('TOPSECRET');
    expect(thrown?.message).not.toContain('user:secret');
    expect(thrown?.message).toContain('http://localhost:8899');
  });

  it('throws a clear error if BURNER_WALLET_PUBLIC_KEY is not a valid base58 address', async () => {
    const badConfig: Config = {
      ...testConfig,
      BURNER_WALLET_PUBLIC_KEY: 'not_a_valid_solana_address',
    };

    await expect(getBurnerBalance(badConfig)).rejects.toThrowError(
      /Invalid BURNER_WALLET_PUBLIC_KEY base58 format/
    );
  });
});
