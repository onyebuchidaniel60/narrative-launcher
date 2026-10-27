import type { Candidate, NarrativeSource } from './source.interface.js';

/**
 * SentimentAlpha is the intended production source (x402-paid narrative feed),
 * but neither PROJECT_SPEC.md nor ARCHITECTURE.md documents its endpoint,
 * request shape, or response schema. Guessing a contract here would silently
 * encode a wrong integration, so the adapter validates configuration and then
 * fails loudly until the contract is confirmed.
 *
 * Selected at boot with NARRATIVE_SOURCE=sentimentalpha.
 */
export class SentimentAlphaSource implements NarrativeSource {
  readonly name = 'sentimentalpha';

  constructor(private readonly apiKey: string | undefined) {}

  async fetchCandidates(): Promise<Candidate[]> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      // Message intentionally matches the operator-facing variable name used
      // in the Phase 3 spec; the configured variable is SENTIMENT_ALPHA_API_KEY.
      throw new Error(
        'SENTIMENTALPHA_API_KEY not configured — set SENTIMENT_ALPHA_API_KEY in the environment'
      );
    }

    throw new Error(
      'SentimentAlpha adapter not implemented: no API contract is documented in PROJECT_SPEC.md/ARCHITECTURE.md. Use NARRATIVE_SOURCE=coingecko.'
    );
  }
}
