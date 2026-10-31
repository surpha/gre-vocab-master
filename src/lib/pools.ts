import type { MasteryStatus, UserWordProgress, VocabWord } from '@/types/vocab';
import { DECKS, TOTAL_DECKS, WORDS, WORD_BY_ID, getDeckWords } from '@/lib/vocab';

export type PoolSpec =
  | { kind: 'deck'; deckId: number }
  | { kind: 'decks'; deckIds: number[] }
  | { kind: 'weak' }
  | { kind: 'starred' }
  | { kind: 'all' }
  | { kind: 'custom'; ids: number[] };

const MAX_CUSTOM_IDS = 500;

export function parsePool(params: URLSearchParams, fallbackDeck = 1): PoolSpec {
  const pool = params.get('pool');
  if (pool === 'weak' || pool === 'starred' || pool === 'all') return { kind: pool };
  if (pool === 'decks') {
    const deckIds = [...new Set((params.get('decks') ?? '')
      .split(',')
      .map(Number)
      .filter((id) => Number.isInteger(id) && id >= 1 && id <= TOTAL_DECKS))].sort((a, b) => a - b);
    if (deckIds.length > 0) return { kind: 'decks', deckIds };
  }
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
    case 'decks':
      return `pool=decks&decks=${spec.deckIds.join(',')}`;
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
    case 'decks':
      return spec.deckIds.length <= 4 ? `Decks ${spec.deckIds.join(', ')}` : `${spec.deckIds.length} Decks`;
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
    case 'decks': {
      const selected = new Set(spec.deckIds);
      return WORDS.filter((w) => selected.has(w.deckId));
    }
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
