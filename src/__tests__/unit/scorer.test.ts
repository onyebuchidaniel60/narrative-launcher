import { describe, it, expect } from 'vitest';
import { narrativeHash, passesGate } from '../../narrative/scorer.js';
import type { Candidate } from '../../narrative/source.interface.js';

const CONFIG = { LAUNCH_THRESHOLD: 70, MAX_LAUNCHES_PER_DAY: 1 };

function candidate(text: string, score: number): Candidate {
  return {
    narrativeId: 'narrative-1',
    text,
    score,
    source: 'test',
    fetchedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('Narrative scorer and launch gate', () => {
  it('score 85 with threshold 70 -> passed (threshold is inclusive)', () => {
    const result = passesGate(candidate('solana ai agents', 85), CONFIG, new Set(), 0);
    expect(result).toEqual({ passed: true, reason: 'passed' });

    // Boundary: the rule is `>=`, so exactly at threshold still passes.
    const boundary = passesGate(candidate('solana ai agents', 70), CONFIG, new Set(), 0);
    expect(boundary).toEqual({ passed: true, reason: 'passed' });
  });

  it('score 50 with threshold 70 -> below_threshold', () => {
    const result = passesGate(candidate('solana ai agents', 50), CONFIG, new Set(), 0);
    expect(result).toEqual({ passed: false, reason: 'below_threshold' });
  });

  it('hash already in the dedup set -> duplicate', () => {
    const text = 'solana ai agents';
    const dedupSet = new Set([narrativeHash(text)]);

    const result = passesGate(candidate(text, 90), CONFIG, dedupSet, 0);
    expect(result).toEqual({ passed: false, reason: 'duplicate' });
  });

  it('daily cap reached -> daily_cap', () => {
    const result = passesGate(candidate('solana ai agents', 90), CONFIG, new Set(), 1);
    expect(result).toEqual({ passed: false, reason: 'daily_cap' });
  });

  it('narrativeHash is case- and punctuation-insensitive', () => {
    expect(narrativeHash('Hello, World!')).toBe(narrativeHash('hello world'));
  });

  it('two different narratives produce different hashes', () => {
    expect(narrativeHash('solana ai agents')).not.toBe(narrativeHash('bitcoin etf inflows'));
  });
});
