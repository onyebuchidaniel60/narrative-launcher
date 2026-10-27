import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import type { Config } from '../config.js';
import { logger } from '../logger.js';
import {
  countLaunchIntentsSince,
  hasRecentLaunch,
  insertLaunch,
  updateStatus,
  type InsertLaunchInput,
} from '../db/repositories/launches.js';
import { hasSeenNarrative, insertNarrativeSeen } from '../db/repositories/narrative-seen.js';
import { setState } from '../db/repositories/state.js';
import { narrativeHash, passesGate } from '../narrative/scorer.js';
import { validateCandidate, type Candidate, type NarrativeSource } from '../narrative/source.interface.js';

export type CycleResult =
  | { ok: true; fetched: number; passed: number; skipped: number }
  | { ok: false; reason: 'source_error'; error: string };

function startOfUtcDay(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString();
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  const code = (error as { code: unknown }).code;
  return typeof code === 'string' && code.startsWith('SQLITE_CONSTRAINT');
}

/**
 * One detection cycle: source -> validate -> dedup -> gate -> persist.
 *
 * Phase 3 is dry-run only. A passing candidate is written as DETECTED then
 * immediately transitioned to SCORED, which is the record Phase 4 will turn
 * into an approval card. Nothing here contacts Telegram, PumpPortal, OpenAI,
 * Pinata or the dashboard.
 */
export async function runPollCycle(
  config: Config,
  db: Database.Database,
  source: NarrativeSource
): Promise<CycleResult> {
  const cycleStartedAt = new Date();

  let candidates: Candidate[];
  try {
    const fetched = await source.fetchCandidates();
    // Source payloads are untrusted: validate every candidate before use.
    candidates = fetched.map((candidate) => validateCandidate(candidate));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error({ source: source.name, error: message }, 'poll cycle failed: source_error');
    return { ok: false, reason: 'source_error', error: message };
  }

  const dedupWindowStart = new Date(
    cycleStartedAt.getTime() - config.DEDUP_WINDOW_HOURS * 60 * 60 * 1000
  ).toISOString();
  const dayStart = startOfUtcDay(cycleStartedAt);

  let launchesToday = countLaunchIntentsSince(db, dayStart);
  let passed = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    const hash = narrativeHash(candidate.text);

    const dedupSet = new Set<string>();
    if (hasSeenNarrative(db, hash) || hasRecentLaunch(db, hash, dedupWindowStart)) {
      dedupSet.add(hash);
    }

    const gate = passesGate(candidate, config, dedupSet, launchesToday);

    if (!gate.passed) {
      skipped += 1;
      logger.debug(
        { narrativeId: candidate.narrativeId, source: candidate.source, score: candidate.score, reason: gate.reason },
        'candidate skipped'
      );
      continue;
    }

    const launchId = randomUUID();
    const now = new Date().toISOString();

    const record: InsertLaunchInput = {
      id: launchId,
      narrative_text: candidate.text,
      narrative_hash: hash,
      source: candidate.source,
      composite_score: candidate.score,
      token_name: null,
      token_symbol: null,
      token_description: null,
      metadata_uri: null,
      image_uri: null,
      mint_public_key: null,
      tx_signature: null,
      dev_buy_sol: config.DEV_BUY_SOL,
      // Phase 3 stores only the dev buy. Fee estimation for the approval card
      // (which must show total estimated cost) is a Phase 4 deliverable.
      estimated_cost_sol: config.DEV_BUY_SOL,
      status: 'DETECTED',
      error_code: null,
      error_message: null,
      created_at: now,
      approved_at: null,
      launched_at: null,
    };

    const persist = db.transaction(() => {
      insertLaunch(db, record);
      updateStatus(db, launchId, 'DETECTED', 'SCORED');
      insertNarrativeSeen(db, hash, now, candidate.score);
    });

    try {
      persist();
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        skipped += 1;
        logger.debug(
          { narrativeId: candidate.narrativeId, source: candidate.source, reason: 'duplicate' },
          'candidate skipped (constraint)'
        );
        continue;
      }
      throw error;
    }

    launchesToday += 1;
    passed += 1;

    logger.info(
      {
        launchId,
        narrativeId: candidate.narrativeId,
        source: candidate.source,
        score: candidate.score,
        hash,
        status: 'SCORED',
        dryRun: config.DRY_RUN,
      },
      'would_draft'
    );
  }

  setState(db, 'last_poll_at', new Date().toISOString());

  logger.info(
    { source: source.name, fetched: candidates.length, passed, skipped },
    'poll cycle complete'
  );

  return { ok: true, fetched: candidates.length, passed, skipped };
}
