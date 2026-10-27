import { createHash } from 'node:crypto';
import type { Config } from '../config.js';
import type { Candidate } from './source.interface.js';

/**
 * Words that carry no narrative signal. Kept intentionally small: the goal is
 * to make near-identical headlines hash together, not to build a stemmer.
 */
const STOPWORDS = new Set([
  'a', 'about', 'after', 'all', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'been', 'before', 'being', 'but', 'by', 'can', 'could', 'did', 'do',
  'does', 'for', 'from', 'had', 'has', 'have', 'he', 'her', 'here', 'his',
  'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'more',
  'most', 'my', 'new', 'no', 'not', 'of', 'on', 'or', 'our', 'out', 'over',
  'she', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'those', 'to', 'up', 'via', 'was', 'we',
  'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with',
  'would', 'you', 'your',
]);

/**
 * Normalises narrative text for dedup:
 *   1. lowercase
 *   2. strip punctuation (anything that is not a-z, 0-9 or whitespace)
 *   3. drop stopwords
 *   4. keep the first 10 significant tokens
 *
 * The token cap keeps hashes stable when a headline gains a trailing clause.
 */
export function normaliseNarrative(text: string): string {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));

  return tokens.slice(0, 10).join(' ');
}

/** SHA-256 hex of the normalised narrative (dedup key). */
export function narrativeHash(text: string): string {
  return createHash('sha256').update(normaliseNarrative(text), 'utf8').digest('hex');
}

export type GateReason = 'passed' | 'below_threshold' | 'duplicate' | 'daily_cap';

export interface GateResult {
  passed: boolean;
  reason: GateReason;
}

/**
 * Launch gate. Rules are evaluated in a fixed order so a rejected candidate
 * always reports the first reason it failed:
 *   1. score < LAUNCH_THRESHOLD  -> below_threshold (threshold is inclusive)
 *   2. hash in dedupSet          -> duplicate
 *   3. launchesToday >= cap      -> daily_cap
 *   4. otherwise                 -> passed
 */
export function passesGate(
  candidate: Candidate,
  config: Pick<Config, 'LAUNCH_THRESHOLD' | 'MAX_LAUNCHES_PER_DAY'>,
  dedupSet: Set<string>,
  launchesToday: number
): GateResult {
  if (candidate.score < config.LAUNCH_THRESHOLD) {
    return { passed: false, reason: 'below_threshold' };
  }

  if (dedupSet.has(narrativeHash(candidate.text))) {
    return { passed: false, reason: 'duplicate' };
  }

  if (launchesToday >= config.MAX_LAUNCHES_PER_DAY) {
    return { passed: false, reason: 'daily_cap' };
  }

  return { passed: true, reason: 'passed' };
}
