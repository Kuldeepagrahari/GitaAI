-- Run once against your database:  psql "$DATABASE_URL" -f db/schema.sql
--
-- The `embedding` column is created now but left unused until the next
-- phase (semantic search). It needs the pgvector extension — if that
-- extension isn't available yet on your Postgres instance, comment out
-- the CREATE EXTENSION line and the embedding column below; we can add
-- both later with a follow-up migration without touching existing rows.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS chapters (
  chapter_number        INT PRIMARY KEY,
  name_sanskrit          TEXT,
  name_translation       TEXT,
  name_transliteration   TEXT,
  verses_count            INT NOT NULL,
  summary                 TEXT
);

CREATE TABLE IF NOT EXISTS verses (
  id                   SERIAL PRIMARY KEY,
  chapter              INT NOT NULL REFERENCES chapters (chapter_number),
  verse                INT NOT NULL,
  sanskrit             TEXT NOT NULL,
  transliteration      TEXT,
  translation          TEXT NOT NULL,
  translation_author   TEXT NOT NULL,
  themes               TEXT[] NOT NULL DEFAULT '{}',   -- filled in the tagging phase, not this one
  embedding            VECTOR(1536),                    -- filled in the embedding phase, not this one
  source_id            TEXT UNIQUE,                     -- e.g. "BG2.47", from the source API — lets re-seeding be idempotent
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chapter, verse)
);

CREATE INDEX IF NOT EXISTS verses_chapter_idx ON verses (chapter);
