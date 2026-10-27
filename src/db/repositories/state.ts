import type Database from 'better-sqlite3';

export interface BotStateRecord {
  key: string;
  value: string;
  updated_at: string;
}

export function getState<T = unknown>(db: Database.Database, key: string): T | undefined {
  const stmt = db.prepare(`SELECT value FROM bot_state WHERE key = ?`);
  const row = stmt.get(key) as { value: string } | undefined;

  if (!row) return undefined;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

export function setState<T = unknown>(db: Database.Database, key: string, value: T): void {
  const now = new Date().toISOString();
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);

  const stmt = db.prepare(`
    INSERT INTO bot_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  stmt.run(key, serialized, now);
}

export function getAllState(db: Database.Database): Record<string, unknown> {
  const stmt = db.prepare(`SELECT key, value FROM bot_state`);
  const rows = stmt.all() as { key: string; value: string }[];

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}
