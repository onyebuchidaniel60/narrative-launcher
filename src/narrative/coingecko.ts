import axios from 'axios';
import { z } from 'zod';
import { validateCandidate, type Candidate, type NarrativeSource } from './source.interface.js';

export const COINGECKO_TRENDING_URL = 'https://api.coingecko.com/api/v3/search/trending';
export const COINGECKO_TIMEOUT_MS = 10_000;

/**
 * CoinGecko trending rank -> score.
 *
 *   rank 1 -> 100
 *   rank 2 ->  90
 *   rank 3 ->  80
 *   ...     (-10 per rank)
 *   rank 10+ -> 10 (floor)
 *
 * The mapping is deliberately linear and documented here so the threshold has
 * a predictable meaning: a coin must be in the top 8 trending entries to clear
 * the default LAUNCH_THRESHOLD=75.
 */
export function rankToScore(rank: number): number {
  return Math.max(100 - (rank - 1) * 10, 10);
}

const TrendingItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
});

const TrendingResponseSchema = z.object({
  coins: z.array(z.object({ item: TrendingItemSchema })),
});

/**
 * Primary Phase 3 source: the public CoinGecko trending endpoint.
 * No API key is required, so this is safe to enable by default.
 */
export class CoinGeckoTrendingSource implements NarrativeSource {
  readonly name = 'coingecko';

  async fetchCandidates(): Promise<Candidate[]> {
    let payload: unknown;

    try {
      const response = await axios.get(COINGECKO_TRENDING_URL, {
        timeout: COINGECKO_TIMEOUT_MS,
        headers: {
          'User-Agent': 'narrative-launcher/0.1.0 (+https://github.com/onyebuchidaniel60/narrative-launcher)',
          Accept: 'application/json',
        },
      });
      payload = response.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`CoinGecko trending request failed: ${message}`);
    }

    const parsed = TrendingResponseSchema.safeParse(payload);

    if (!parsed.success) {
      const details = parsed.error.errors
        .map((err) => `${err.path.join('.') || 'response'}: ${err.message}`)
        .join('; ');
      throw new Error(`CoinGecko trending response malformed: ${details}`);
    }

    const fetchedAt = new Date().toISOString();

    return parsed.data.coins.map((entry, index) =>
      validateCandidate({
        narrativeId: entry.item.id,
        text: `${entry.item.name} ${entry.item.symbol}`,
        score: rankToScore(index + 1),
        source: 'coingecko',
        fetchedAt,
      })
    );
  }
}
