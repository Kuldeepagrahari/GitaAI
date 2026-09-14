# Backend, step 1: collect all the data

This is the one-time job described in our architecture discussion: pull all
18 chapters / 700 verses from a public Gita API into your own Postgres, so
the running app never depends on that third-party API again.

## What this uses

Source: `https://vedicscriptures.github.io` — a static, no-auth mirror of
the open-source `vedicscriptures/bhagavad-gita-api` dataset (same data
`bhagavadgitaapi.in` serves). Confirmed response shapes are documented at
the top of `src/seed/fetchGita.ts`.

## 1. Get a Postgres database

Anything works for now — local, Docker, or a free-tier RDS instance. Local
via Docker if you don't have one running:

```bash
docker run --name krishna-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=krishna_app -p 5432:5432 -d postgres:16
```

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` if your `DATABASE_URL` differs from the default (it matches the
Docker command above).

## 3. Create the tables

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Note: `schema.sql` tries to enable the `pgvector` extension for the
`embedding` column, since that column will matter in the very next phase
(semantic search). If your Postgres doesn't have `pgvector` available yet
(e.g. an RDS parameter group that hasn't enabled it), comment out that line
and the `embedding` column for now — nothing in this step touches them.

## 4. Install and run

```bash
npm install
npm run seed:verses
```

This takes a few minutes (700 verses, ~120ms between requests, deliberately
throttled — it's a free, donation-funded public API, no reason to hammer it).
You'll see progress logged chapter by chapter.

**It's safe to re-run.** Every insert is an upsert keyed on `(chapter,
verse)`, so if it fails partway through (network hiccup, etc.) just run it
again — it'll skip what's already there and retry what failed.

## 5. Verify

```sql
SELECT count(*) FROM verses;              -- should be 700
SELECT count(*) FROM chapters;            -- should be 18
SELECT chapter, verse, translation
FROM verses ORDER BY random() LIMIT 5;    -- spot-check a few
```

## What's NOT done yet (on purpose)

- **`themes`** — empty array on every row. That's the next piece: tagging
  each verse with a small set of themes (fear, grief, duty, anger, etc.) so
  retrieval can filter before it ranks.
- **`embedding`** — null on every row. That's the piece after that: running
  each verse's translation through an embedding model and storing the
  vector, which is what makes semantic matching possible.
- **`/api/counsel` route** — doesn't exist yet. That's what will eventually
  replace `matchVerse()` in the frontend.

Each of those is a separate, focused piece of work — worth doing one at a
time rather than all at once, so we can sanity-check the data itself before
building retrieval logic on top of it.

## A licensing note, since this pulls someone else's dataset

The Sanskrit text itself is ancient and public domain. The seed script
defaults to Shri Purohit Swami's English translation specifically because
he died in 1941 — comfortably out of copyright everywhere. Some of the
*other* translators available in this same API's responses (Swami
Ramsukhdas, Swami Chinmayananda, etc.) are much more recent, and their
translations may still be under copyright even though the API serves them
for free. If you ever want to display more than one translator's version
side by side, check that specific translator's copyright status first
rather than assuming "the API returns it, so it's fine to use."
