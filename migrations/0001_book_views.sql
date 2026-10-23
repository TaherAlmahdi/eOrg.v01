-- D1 migration: per-book view counter for the "পাঠকপ্রিয় বই" section.
-- Run once (you, not Claude): wrangler d1 execute eorg-db --remote --file=migrations/0001_book_views.sql
CREATE TABLE IF NOT EXISTS book_views (
  slug       TEXT PRIMARY KEY,           -- book folder slug, e.g. "durgeshnandini"
  views      INTEGER NOT NULL DEFAULT 0, -- all-time views (one per browser per day)
  updated_at INTEGER NOT NULL            -- unix seconds
);

CREATE INDEX IF NOT EXISTS idx_book_views_views ON book_views (views DESC);
