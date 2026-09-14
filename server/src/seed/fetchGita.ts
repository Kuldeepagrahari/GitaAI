/**
 * Thin client for https://vedicscriptures.github.io (a static mirror of the
 * vedicscriptures/bhagavad-gita-api dataset — same data as bhagavadgitaapi.in,
 * no auth required). Confirmed response shapes as of writing:
 *
 *   GET /chapters      -> ApiChapter[]
 *   GET /slok/:ch/:sl  -> ApiVerse
 */

export type ApiChapter = {
  chapter_number: number;
  verses_count: number;
  name: string;
  translation?: string;
  transliteration?: string;
  meaning?: { en?: string; hi?: string };
  summary?: { en?: string; hi?: string };
};

export type ApiVerse = {
  _id: string; 
  chapter: number;
  verse: number;
  slok: string;
  transliteration: string;
  purohit?: { author?: string; et?: string };
  siva?: { author?: string; et?: string };
  adi?: { author?: string; et?: string };
  gambir?: { author?: string; et?: string };
  [key: string]: unknown;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return fetchJson<T>(url, attempt + 1);
    }
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchChapters(base: string): Promise<ApiChapter[]> {
  return fetchJson<ApiChapter[]>(`${base}/chapters`);
}

export function fetchVerse(base: string, chapter: number, verse: number): Promise<ApiVerse> {
  return fetchJson<ApiVerse>(`${base}/slok/${chapter}/${verse}`);
}
