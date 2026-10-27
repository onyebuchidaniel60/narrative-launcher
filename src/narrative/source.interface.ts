import { z } from 'zod';

/**
 * A single narrative candidate as produced by a source adapter.
 * `score` is the source's own 0-100 confidence/heat score; the launch gate
 * compares it against LAUNCH_THRESHOLD.
 */
export interface Candidate {
  narrativeId: string;
  text: string;
  score: number;
  source: string;
  fetchedAt: string;
}

export interface NarrativeSource {
  name: string;
  fetchCandidates(): Promise<Candidate[]>;
}

/**
 * External payloads are untrusted, so every candidate is validated before it
 * reaches scoring or persistence. score is inclusive 0-100.
 */
export const CandidateSchema = z.object({
  narrativeId: z.string().min(1, { message: 'narrativeId must be a non-empty string' }),
  text: z.string().min(1, { message: 'text must be a non-empty string' }),
  score: z
    .number({ invalid_type_error: 'score must be a number' })
    .min(0, { message: 'score must be between 0 and 100' })
    .max(100, { message: 'score must be between 0 and 100' }),
  source: z.string().min(1, { message: 'source must be a non-empty string' }),
  fetchedAt: z.string().min(1, { message: 'fetchedAt must be a non-empty string' }),
});

export function validateCandidate(value: unknown): Candidate {
  const result = CandidateSchema.safeParse(value);

  if (!result.success) {
    const details = result.error.errors
      .map((err) => `${err.path.join('.') || 'candidate'}: ${err.message}`)
      .join('; ');
    throw new Error(`Invalid narrative candidate: ${details}`);
  }

  return result.data;
}
