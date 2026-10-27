CREATE TABLE IF NOT EXISTS launches (
  id TEXT PRIMARY KEY,
  narrative_text TEXT NOT NULL,
  narrative_hash TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  composite_score REAL NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  token_description TEXT,
  metadata_uri TEXT,
  image_uri TEXT,
  mint_public_key TEXT,
  tx_signature TEXT,
  dev_buy_sol REAL NOT NULL,
  estimated_cost_sol REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DETECTED', 'SCORED', 'PENDING_APPROVAL', 'APPROVED', 'LAUNCHED', 'REJECTED', 'EXPIRED', 'FAILED')),
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  launched_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_launches_status_created_at ON launches(status, created_at);

CREATE TABLE IF NOT EXISTS bot_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS narrative_seen (
  hash TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_score REAL NOT NULL
);
