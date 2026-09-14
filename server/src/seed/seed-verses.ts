import 'dotenv/config';
import { pool } from '../db.js';
import { fetchChapters, fetchVerse } from './fetchGita.js';

const BASE = process.env.GITA_API_BASE ?? 'https://vedicscriptures.github.io';

// Be polite to a free, donation-funded public API — this is a one-time job,
// not a hot path, so there's no reason to hammer it.
const DELAY_MS = 120;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Fetching chapter list from ${BASE}/chapters ...`);
  const chapters = await fetchChapters(BASE);
  console.log(`Found ${chapters.length} chapters.`);

  for (const ch of chapters) {
    await pool.query(
      `INSERT INTO chapters (chapter_number, name_sanskrit, name_translation, name_transliteration, verses_count, summary)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (chapter_number) DO UPDATE SET
         name_sanskrit = EXCLUDED.name_sanskrit,
         name_translation = EXCLUDED.name_translation,
         name_transliteration = EXCLUDED.name_transliteration,
         verses_count = EXCLUDED.verses_count,
         summary = EXCLUDED.summary`,
      [
        ch.chapter_number,
        ch.name,
        ch.translation ?? ch.meaning?.en ?? null,
        ch.transliteration ?? null,
        ch.verses_count,
        ch.summary?.en ?? null,
      ]
    );
  }
  console.log('Chapters saved.\n');

  let inserted = 0;
  const failed: { chapter: number; verse: number; error: string }[] = [];

  for (const ch of chapters) {
    console.log(`Chapter ${ch.chapter_number}: fetching ${ch.verses_count} verses...`);

    for (let v = 1; v <= ch.verses_count; v++) {
      try {
        const raw = await fetchVerse(BASE, ch.chapter_number, v);

        // Pick ONE English translation as the primary display text.
        // Shri Purohit Swami's is used here — it's consistently present
        // across verses and its translator died in 1941, so it's clearly
        // out of copyright. Swap the fallback chain below if you'd rather
        // standardize on a different translator's voice; just do it
        // consistently across all 700 verses, not per-verse.
        const translation = raw.purohit?.et ?? raw.siva?.et ?? raw.adi?.et ?? null;
        const translationAuthor = raw.purohit?.et
          ? 'Shri Purohit Swami'
          : raw.siva?.et
            ? 'Swami Sivananda'
            : raw.adi?.et
              ? 'Swami Adidevananda'
              : 'Unknown';

        if (!translation) {
          failed.push({ chapter: ch.chapter_number, verse: v, error: 'no English translation in response' });
          await sleep(DELAY_MS);
          continue;
        }

        await pool.query(
          `INSERT INTO verses (chapter, verse, sanskrit, transliteration, translation, translation_author, source_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (chapter, verse) DO UPDATE SET
             sanskrit = EXCLUDED.sanskrit,
             transliteration = EXCLUDED.transliteration,
             translation = EXCLUDED.translation,
             translation_author = EXCLUDED.translation_author,
             source_id = EXCLUDED.source_id,
             updated_at = now()`,
          [ch.chapter_number, v, raw.slok, raw.transliteration ?? null, translation, translationAuthor, raw._id]
        );

        inserted++;
      } catch (err) {
        failed.push({ chapter: ch.chapter_number, verse: v, error: String(err) });
      }

      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone. ${inserted} verses saved.`);
  if (failed.length) {
    console.log(`${failed.length} verses failed — re-run the script to retry (it's idempotent):`);
    console.table(failed);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
