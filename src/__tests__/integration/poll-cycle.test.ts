import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runMigrations } from '../../db/index.js';
import { loadConfig, type Config } from '../../config.js';
import { runPollCycle } from '../../pipeline/poll-cycle.js';
import type { Candidate, NarrativeSource } from '../../narrative/source.interface.js';

const BASE_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  DRY_RUN: 'true',
  AUTO_LAUNCH: 'false',
  BOT_START_STATE: 'paused',
  POLL_INTERVAL_MINUTES: '5',
  LAUNCH_THRESHOLD: '70',
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

function makeConfig(overrides: Record<string, string> = {}): Config {
  return loadConfig({ ...BASE_ENV, ...overrides });
}

function candidate(text: string, score: number): Candidate {
  return {
    narrativeId: `id-${text}`,
    text,
    score,
    source: 'test',
    fetchedAt: '2026-01-01T00:00:00.000Z',
  };
}

class MockNarrativeSource implements NarrativeSource {
  readonly name = 'mock';
  calls = 0;

  constructor(private readonly handler: () => Promise<Candidate[]>) {}

  async fetchCandidates(): Promise<Candidate[]> {
    this.calls += 1;
    return this.handler();
  }
}

describe('Poll cycle integration', () => {
  let tempDir: string;
  let db: Database.Database;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launcher-poll-test-'));
    db = new Database(path.join(tempDir, 'test.db'));
    runMigrations(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const countLaunches = (): number =>
    (db.prepare('SELECT COUNT(*) AS count FROM launches').get() as { count: number }).count;

  const countSeen = (): number =>
    (db.prepare('SELECT COUNT(*) AS count FROM narrative_seen').get() as { count: number }).count;

  it('one candidate at score 85 -> one SCORED launch and one narrative_seen row', async () => {
    const config = makeConfig();
    const source = new MockNarrativeSource(async () => [candidate('solana ai agents', 85)]);

    const result = await runPollCycle(config, db, source);

    expect(result).toEqual({ ok: true, fetched: 1, passed: 1, skipped: 0 });
    expect(countLaunches()).toBe(1);
    expect(countSeen()).toBe(1);

    const row = db.prepare('SELECT status, composite_score FROM launches').get() as {
      status: string;
      composite_score: number;
    };
    expect(row.status).toBe('SCORED');
    expect(row.composite_score).toBe(85);

    const lastPoll = db.prepare(`SELECT value FROM bot_state WHERE key = 'last_poll_at'`).get() as
      | { value: string }
      | undefined;
    expect(lastPoll).toBeDefined();
  });

  it('one candidate at score 50 -> nothing persisted', async () => {
    const config = makeConfig();
    const source = new MockNarrativeSource(async () => [candidate('solana ai agents', 50)]);

    const result = await runPollCycle(config, db, source);

    expect(result).toEqual({ ok: true, fetched: 1, passed: 0, skipped: 1 });
    expect(countLaunches()).toBe(0);
    expect(countSeen()).toBe(0);
  });

  it('same candidate in two cycles -> second cycle reports duplicate and writes nothing', async () => {
    const config = makeConfig();
    const source = new MockNarrativeSource(async () => [candidate('solana ai agents', 85)]);

    const first = await runPollCycle(config, db, source);
    const second = await runPollCycle(config, db, source);

    expect(first).toEqual({ ok: true, fetched: 1, passed: 1, skipped: 0 });
    expect(second).toEqual({ ok: true, fetched: 1, passed: 0, skipped: 1 });
    expect(countLaunches()).toBe(1);
    expect(countSeen()).toBe(1);
  });

  it('MAX_LAUNCHES_PER_DAY=1 with an existing SCORED row -> next candidate is daily_cap', async () => {
    const config = makeConfig({ MAX_LAUNCHES_PER_DAY: '1' });

    const firstSource = new MockNarrativeSource(async () => [candidate('solana ai agents', 85)]);
    const secondSource = new MockNarrativeSource(async () => [candidate('bitcoin etf inflows', 85)]);

    const first = await runPollCycle(config, db, firstSource);
    const second = await runPollCycle(config, db, secondSource);

    expect(first).toEqual({ ok: true, fetched: 1, passed: 1, skipped: 0 });
    expect(second).toEqual({ ok: true, fetched: 1, passed: 0, skipped: 1 });
    expect(countLaunches()).toBe(1);
    expect(countSeen()).toBe(1);
  });

  it('source throwing -> ok:false with source_error and no rows', async () => {
    const config = makeConfig();
    const source = new MockNarrativeSource(async () => {
      throw new Error('upstream unavailable');
    });

    const result = await runPollCycle(config, db, source);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('source_error');
      expect(result.error).toContain('upstream unavailable');
    }
    expect(countLaunches()).toBe(0);
    expect(countSeen()).toBe(0);
  });

  it('malformed source response -> ok:false and no rows', async () => {
    const config = makeConfig();
    const source = new MockNarrativeSource(
      async () => [{ ...candidate('solana ai agents', 500) }] // score outside 0-100
    );

    const result = await runPollCycle(config, db, source);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('source_error');
      expect(result.error).toContain('Invalid narrative candidate');
    }
    expect(countLaunches()).toBe(0);
    expect(countSeen()).toBe(0);
  });
});
