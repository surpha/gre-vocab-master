import vocabData from '@/data/vocab.json';
import decksData from '@/data/decks.json';
import type { Connotation, DeckMeta, VocabWord } from '@/types/vocab';

export const WORDS = vocabData as VocabWord[];
export const DECKS = decksData as DeckMeta[];
export const TOTAL_WORDS = WORDS.length;
export const TOTAL_DECKS = DECKS.length;

export const WORD_BY_ID = new Map<number, VocabWord>(WORDS.map((w) => [w.id, w]));
export const WORD_BY_TEXT = new Map<string, VocabWord>(WORDS.map((w) => [w.word.toLowerCase(), w]));

export const WORDS_BY_DECK = new Map<number, VocabWord[]>();
for (const w of WORDS) {
  if (!WORDS_BY_DECK.has(w.deckId)) WORDS_BY_DECK.set(w.deckId, []);
  WORDS_BY_DECK.get(w.deckId)!.push(w);
}

export function getDeckWords(deckId: number): VocabWord[] {
  return WORDS_BY_DECK.get(deckId) ?? [];
}

export const CONNOTATIONS: Connotation[] = ['Positive', 'Negative', 'Neutral'];

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finds a case-insensitive regex matching the word (or an inflected form) inside the sentence,
 * shrinking the stem down to 5 chars (4 for short words) until something matches.
 */
export function findWordRegex(sentence: string, word: string): RegExp | null {
  const clean = word.trim();
  const parts = clean.split(/\s+/);
  const first = parts[0];
  const rest = parts.slice(1).map(escapeRegex).join('\\s+');
  const minLen = Math.min(first.length, first.length >= 6 ? 5 : 4);
  for (let len = first.length; len >= minLen; len--) {
    const stem = escapeRegex(first.slice(0, len));
    const source = rest ? `\\b${stem}[\\w-]*\\s+${rest}\\b` : `\\b${stem}[\\w-]*`;
    const regex = new RegExp(source, 'gi');
    if (regex.test(sentence)) {
      regex.lastIndex = 0;
      return regex;
    }
  }
  return null;
}

/** Splits a sentence into segments, marking the ones that match the target word. */
export function splitOnWord(sentence: string, word: string): { text: string; match: boolean }[] {
  const regex = findWordRegex(sentence, word);
  if (!regex) return [{ text: sentence, match: false }];
  const out: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const m of sentence.matchAll(regex)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ text: sentence.slice(last, idx), match: false });
    out.push({ text: m[0], match: true });
    last = idx + m[0].length;
  }
  if (last < sentence.length) out.push({ text: sentence.slice(last), match: false });
  return out;
}
