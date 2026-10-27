import type Database from 'better-sqlite3';

export type LaunchStatus =
  | 'DETECTED'
  | 'SCORED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'LAUNCHED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FAILED';

export interface LaunchRecord {
  id: string;
  narrative_text: string;
  narrative_hash: string;
  source: string;
  composite_score: number;
  token_name: string | null;
  token_symbol: string | null;
  token_description: string | null;
  metadata_uri: string | null;
  image_uri: string | null;
  mint_public_key: string | null;
  tx_signature: string | null;
  dev_buy_sol: number;
  estimated_cost_sol: number;
  status: LaunchStatus;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  launched_at: string | null;
}

export type InsertLaunchInput = Omit<LaunchRecord, 'updated_at'> & { updated_at?: string };

export function insertLaunch(db: Database.Database, input: InsertLaunchInput): LaunchRecord {
  const now = new Date().toISOString();
  const record: LaunchRecord = {
    ...input,
    updated_at: input.updated_at || now,
  };

  const stmt = db.prepare(`
    INSERT INTO launches (
      id, narrative_text, narrative_hash, source, composite_score,
      token_name, token_symbol, token_description, metadata_uri, image_uri,
      mint_public_key, tx_signature, dev_buy_sol, estimated_cost_sol, status,
      error_code, error_message, created_at, updated_at, approved_at, launched_at
    ) VALUES (
      @id, @narrative_text, @narrative_hash, @source, @composite_score,
      @token_name, @token_symbol, @token_description, @metadata_uri, @image_uri,
      @mint_public_key, @tx_signature, @dev_buy_sol, @estimated_cost_sol, @status,
      @error_code, @error_message, @created_at, @updated_at, @approved_at, @launched_at
    )
  `);

  stmt.run(record);
  return record;
}

export type LaunchStatusUpdate = Partial<
  Pick<LaunchRecord, 'tx_signature' | 'approved_at' | 'launched_at' | 'error_code' | 'error_message'>
>;

export function updateStatus(
  db: Database.Database,
  id: string,
  fromStatus: LaunchStatus,
  toStatus: LaunchStatus,
  updates: LaunchStatusUpdate = {}
): { changes: number } {
  const now = new Date().toISOString();

  const setClauses = ['status = ?', 'updated_at = ?'];
  const values: unknown[] = [toStatus, now];

  if (updates.tx_signature !== undefined) {
    setClauses.push('tx_signature = ?');
    values.push(updates.tx_signature);
  }
  if (updates.approved_at !== undefined) {
    setClauses.push('approved_at = ?');
    values.push(updates.approved_at);
  }
  if (updates.launched_at !== undefined) {
    setClauses.push('launched_at = ?');
    values.push(updates.launched_at);
  }
  if (updates.error_code !== undefined) {
    setClauses.push('error_code = ?');
    values.push(updates.error_code);
  }
  if (updates.error_message !== undefined) {
    setClauses.push('error_message = ?');
    values.push(updates.error_message);
  }

  values.push(id, fromStatus);

  const sql = `UPDATE launches SET ${setClauses.join(', ')} WHERE id = ? AND status = ?`;
  const result = db.prepare(sql).run(...values);

  return { changes: result.changes };
}

export function getPending(db: Database.Database): LaunchRecord[] {
  const stmt = db.prepare(
    `SELECT * FROM launches WHERE status = 'PENDING_APPROVAL' ORDER BY created_at ASC`
  );
  return stmt.all() as LaunchRecord[];
}

export function getByHash(db: Database.Database, narrativeHash: string): LaunchRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM launches WHERE narrative_hash = ?`);
  return stmt.get(narrativeHash) as LaunchRecord | undefined;
}

export function getById(db: Database.Database, id: string): LaunchRecord | undefined {
  const stmt = db.prepare(`SELECT * FROM launches WHERE id = ?`);
  return stmt.get(id) as LaunchRecord | undefined;
}

export function countLaunchesSince(db: Database.Database, sinceIsoString: string): number {
  const stmt = db.prepare(
    `SELECT COUNT(*) as count FROM launches WHERE status = 'LAUNCHED' AND launched_at >= ?`
  );
  const row = stmt.get(sinceIsoString) as { count: number };
  return row.count;
}
