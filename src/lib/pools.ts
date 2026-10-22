import type { MasteryStatus, UserWordProgress, VocabWord } from '@/types/vocab';
import { DECKS, TOTAL_DECKS, WORDS, WORD_BY_ID, getDeckWords } from '@/lib/vocab';

export type PoolSpec =
  | { kind: 'deck'; deckId: number }
  | { kind: 'weak' }
  | { kind: 'starred' }
  | { kind: 'all' }
  | { kind: 'custom'; ids: number[] };

const MAX_CUSTOM_IDS = 500;

export function parsePool(params: URLSearchParams, fallbackDeck = 1): PoolSpec {
  const pool = params.get('pool');
  if (pool === 'weak' || pool === 'starred' || pool === 'all') return { kind: pool };
  if (pool === 'custom') {
    const ids = (params.get('ids') ?? '')
      .split(',')
      .slice(0, MAX_CUSTOM_IDS)
      .map(Number)
      .filter((n) => Number.isInteger(n) && WORD_BY_ID.has(n));
    if (ids.length) return { kind: 'custom', ids: [...new Set(ids)] };
  }
  const deck = Number(params.get('deck'));
  if (Number.isInteger(deck) && deck >= 1 && deck <= TOTAL_DECKS) return { kind: 'deck', deckId: deck };
  return { kind: 'deck', deckId: Math.min(Math.max(fallbackDeck, 1), TOTAL_DECKS) };
}

export function poolToQuery(spec: PoolSpec): string {
  switch (spec.kind) {
    case 'deck':
      return `deck=${spec.deckId}`;
    case 'custom':
      return `pool=custom&ids=${spec.ids.join(',')}`;
    default:
      return `pool=${spec.kind}`;
  }
}

export function poolKey(spec: PoolSpec): string {
  return poolToQuery(spec);
}

export function poolLabel(spec: PoolSpec): string {
  switch (spec.kind) {
    case 'deck':
      return `Deck ${spec.deckId}`;
    case 'weak':
      return 'Still Learning';
    case 'starred':
      return 'Starred Words';
    case 'all':
      return `All ${WORDS.length.toLocaleString()} Words`;
    case 'custom':
      return `${spec.ids.length} Selected Words`;
  }
}

export function resolvePool(spec: PoolSpec, progress: Record<number, UserWordProgress>): VocabWord[] {
  switch (spec.kind) {
    case 'deck':
      return getDeckWords(spec.deckId);
    case 'weak':
      return WORDS.filter((w) => progress[w.id]?.status === 'learning');
    case 'starred':
      return WORDS.filter((w) => progress[w.id]?.isStarred);
    case 'all':
      return WORDS;
    case 'custom':
      return spec.ids.map((id) => WORD_BY_ID.get(id)).filter((w): w is VocabWord => !!w);
  }
}

export type StatusCounts = Record<MasteryStatus, number> & { total: number };

export function countStatuses(words: readonly VocabWord[], progress: Record<number, UserWordProgress>): StatusCounts {
  const counts: StatusCounts = { unseen: 0, learning: 0, reviewing: 0, mastered: 0, total: words.length };
  for (const w of words) counts[progress[w.id]?.status ?? 'unseen']++;
  return counts;
}

export function deckStats(progress: Record<number, UserWordProgress>): Map<number, StatusCounts> {
  return new Map(DECKS.map((d) => [d.deckId, countStatuses(getDeckWords(d.deckId), progress)]));
}
