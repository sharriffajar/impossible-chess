-- =============================================================================
-- Impossible Chess - Cloudflare D1 Database Schema
-- Table: victors (Stores Hall of Fame Permadeath records)
-- =============================================================================

CREATE TABLE IF NOT EXISTS victors (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  moves_count INTEGER NOT NULL DEFAULT 0,
  pgn TEXT NOT NULL,
  date TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT DEFAULT 'Impossible Mode',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for high performance leaderboard queries (Top Streak, Least Moves)
CREATE INDEX IF NOT EXISTS idx_victors_streak ON victors (streak DESC, moves_count ASC);
CREATE INDEX IF NOT EXISTS idx_victors_nickname ON victors (nickname);
