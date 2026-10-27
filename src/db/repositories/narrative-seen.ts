import type Database from 'better-sqlite3';

export interface NarrativeSeenRecord {
  hash: string;
  first_seen_at: string;
  last_score: number;
}

export function hasSeenNarrative(db: Database.Database, hash: string): boolean {
  const row = db.prepare(`SELECT 1 AS seen FROM narrative_seen WHERE hash = ?`).get(hash);
  return row !== undefined;
}

export function getNarrativeSeen(
  db: Database.Database,
  hash: string
): NarrativeSeenRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM narrative_seen WHERE hash = ?`);
  return stmt.get(hash) as NarrativeSeenRecord | undefined;
}

export function insertNarrativeSeen(
  db: Database.Database,
  hash: string,
  firstSeenAt: string,
  lastScore: number
): void {
  const stmt = db.prepare(
    `INSERT INTO narrative_seen (hash, first_seen_at, last_score) VALUES (?, ?, ?)`
  );
  stmt.run(hash, firstSeenAt, lastScore);
}
