import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getConfig } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: Database.Database | null = null;

export function runMigrations(db: Database.Database): void {
  const migrationsPath = path.join(__dirname, 'migrations.sql');
  const migrationSql = fs.readFileSync(migrationsPath, 'utf8');
  db.exec(migrationSql);
}

function defaultDbPath(): string {
  return path.join(getConfig().DATA_DIR, 'launcher.db');
}

export function initDb(dbPath?: string): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = dbPath ?? defaultDbPath();

  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    }
  }

  const db = new Database(resolvedPath);

  // Set permissions on file if not in-memory
  if (resolvedPath !== ':memory:' && fs.existsSync(resolvedPath)) {
    try {
      fs.chmodSync(resolvedPath, 0o600);
    } catch {
      // Best effort on platforms like Windows where chmod 600 has limited semantics
    }
  }

  // SQLite pragmas for performance and data integrity
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // Idempotent migration
  runMigrations(db);

  dbInstance = db;
  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    return initDb();
  }
  return dbInstance;
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
