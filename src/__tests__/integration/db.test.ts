import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runMigrations } from '../../db/index.js';
import {
  insertLaunch,
  updateStatus,
  getById,
  getByHash,
  getPending,
  countLaunchesSince,
  InsertLaunchInput,
} from '../../db/repositories/launches.js';
import { getState, setState } from '../../db/repositories/state.js';

describe('Database & Migrations Integration', () => {
  let tempDir: string;
  let tempDbPath: string;
  let db: Database.Database;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'launcher-test-'));
    tempDbPath = path.join(tempDir, 'test.db');
    db = new Database(tempDbPath);
    runMigrations(db);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('fresh DB -> 3 tables exist (launches, bot_state, narrative_seen)', () => {
    const tables = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name);
    expect(tableNames).toContain('launches');
    expect(tableNames).toContain('bot_state');
    expect(tableNames).toContain('narrative_seen');
  });

  it('insert + read a launch round-trips with exact values', () => {
    const launchData: InsertLaunchInput = {
      id: 'lnch_test_001',
      narrative_text: 'Decentralized compute agents on Solana',
      narrative_hash: 'hash_abc_123',
      source: 'SentimentAlpha',
      composite_score: 87.5,
      token_name: 'ComputeAI',
      token_symbol: 'COMPUTE',
      token_description: 'Decentralized compute liquidity agent',
      metadata_uri: 'ipfs://bafkreitestmeta',
      image_uri: 'ipfs://bafkreitestimage',
      mint_public_key: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      tx_signature: null,
      dev_buy_sol: 0.05,
      estimated_cost_sol: 0.075,
      status: 'PENDING_APPROVAL',
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString(),
      approved_at: null,
      launched_at: null,
    };

    insertLaunch(db, launchData);

    const retrieved = getById(db, 'lnch_test_001');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('lnch_test_001');
    expect(retrieved?.narrative_text).toBe('Decentralized compute agents on Solana');
    expect(retrieved?.composite_score).toBe(87.5);
    expect(retrieved?.status).toBe('PENDING_APPROVAL');

    const byHash = getByHash(db, 'hash_abc_123');
    expect(byHash?.id).toBe('lnch_test_001');

    const pending = getPending(db);
    expect(pending.length).toBe(1);
    expect(pending[0].id).toBe('lnch_test_001');
  });

  it('duplicate narrative_hash -> UNIQUE constraint throws', () => {
    const launch1: InsertLaunchInput = {
      id: 'lnch_1',
      narrative_text: 'Duplicate narrative test',
      narrative_hash: 'dup_hash_999',
      source: 'CoinGecko',
      composite_score: 80,
      token_name: 'Token1',
      token_symbol: 'TK1',
      token_description: null,
      metadata_uri: null,
      image_uri: null,
      mint_public_key: null,
      tx_signature: null,
      dev_buy_sol: 0.05,
      estimated_cost_sol: 0.07,
      status: 'DETECTED',
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString(),
      approved_at: null,
      launched_at: null,
    };

    insertLaunch(db, launch1);

    const launch2: InsertLaunchInput = {
      ...launch1,
      id: 'lnch_2',
    };

    expect(() => insertLaunch(db, launch2)).toThrowError(/UNIQUE constraint failed: launches\.narrative_hash/);
  });

  it('invalid status value -> CHECK constraint throws', () => {
    const launchInvalidStatus: InsertLaunchInput = {
      id: 'lnch_invalid',
      narrative_text: 'Invalid status test',
      narrative_hash: 'hash_invalid_status',
      source: 'CoinGecko',
      composite_score: 80,
      token_name: null,
      token_symbol: null,
      token_description: null,
      metadata_uri: null,
      image_uri: null,
      mint_public_key: null,
      tx_signature: null,
      dev_buy_sol: 0.05,
      estimated_cost_sol: 0.07,
      status: 'INVALID_STATUS' as any,
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString(),
      approved_at: null,
      launched_at: null,
    };

    expect(() => insertLaunch(db, launchInvalidStatus)).toThrowError(/CHECK constraint failed/);
  });

  it('conditional update: UPDATE ... WHERE status = "PENDING_APPROVAL" on a row in "LAUNCHED" -> 0 rows affected', () => {
    const launch: InsertLaunchInput = {
      id: 'lnch_conditional_test',
      narrative_text: 'Conditional transition test',
      narrative_hash: 'hash_cond_test',
      source: 'SentimentAlpha',
      composite_score: 85,
      token_name: 'CondToken',
      token_symbol: 'COND',
      token_description: 'Conditional test',
      metadata_uri: null,
      image_uri: null,
      mint_public_key: null,
      tx_signature: 'sig123',
      dev_buy_sol: 0.05,
      estimated_cost_sol: 0.07,
      status: 'LAUNCHED',
      error_code: null,
      error_message: null,
      created_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
      launched_at: new Date().toISOString(),
    };

    insertLaunch(db, launch);

    // Attempt conditional transition expecting PENDING_APPROVAL
    const result = updateStatus(db, 'lnch_conditional_test', 'PENDING_APPROVAL', 'LAUNCHED');
    expect(result.changes).toBe(0);

    // Row remains unchanged
    const current = getById(db, 'lnch_conditional_test');
    expect(current?.status).toBe('LAUNCHED');
  });

  it('bot_state get/set round-trips correctly', () => {
    setState(db, 'paused', { isPaused: true, reason: 'operator manual toggle' });

    const retrieved = getState<{ isPaused: boolean; reason: string }>(db, 'paused');
    expect(retrieved).toEqual({ isPaused: true, reason: 'operator manual toggle' });

    // Update state on conflict
    setState(db, 'paused', { isPaused: false });
    const updated = getState<{ isPaused: boolean }>(db, 'paused');
    expect(updated).toEqual({ isPaused: false });
  });

  it('countLaunchesSince counts by launched_at, not created_at', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
    const threeHoursAgo = new Date(now.getTime() - 180 * 60 * 1000).toISOString();

    const launch = (id: string, hash: string, createdAt: string, launchedAt: string): void => {
      insertLaunch(db, {
        id,
        narrative_text: `Launch ${id}`,
        narrative_hash: hash,
        source: 'src',
        composite_score: 80,
        token_name: 'T',
        token_symbol: 'T',
        token_description: null,
        metadata_uri: null,
        image_uri: null,
        mint_public_key: null,
        tx_signature: `sig-${id}`,
        dev_buy_sol: 0.05,
        estimated_cost_sol: 0.07,
        status: 'LAUNCHED',
        error_code: null,
        error_message: null,
        created_at: createdAt,
        approved_at: createdAt,
        launched_at: launchedAt,
      });
    };

    launch('l1', 'h1', now.toISOString(), now.toISOString());
    launch('l2', 'h2', twoHoursAgo, now.toISOString());
    launch('l3', 'h3', now.toISOString(), threeHoursAgo);

    expect(countLaunchesSince(db, oneHourAgo)).toBe(2);
    expect(countLaunchesSince(db, twoHoursAgo)).toBe(2);
    expect(countLaunchesSince(db, threeHoursAgo)).toBe(3);

    const futureTime = new Date(now.getTime() + 60 * 1000).toISOString();
    expect(countLaunchesSince(db, futureTime)).toBe(0);
  });
});
