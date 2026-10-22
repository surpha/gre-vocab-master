'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowDownAZ, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { ConnotationBadge, SpeakButton, StarButton, StatusBadge } from '@/components/word-bits';
import { CONNOTATIONS, DECKS, TOTAL_WORDS, WORDS } from '@/lib/vocab';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { getStatus, useVocabStore } from '@/store/useVocabStore';
import type { Connotation, MasteryStatus } from '@/types/vocab';

type SortKey = 'deck' | 'az' | 'za' | 'connotation' | 'recent';
const PAGE = 100;
const STATUS_OPTIONS: { value: MasteryStatus; label: string }[] = [
  { value: 'unseen', label: 'Unseen' },
  { value: 'learning', label: 'Learning' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'mastered', label: 'Mastered' },
];

export function WordBank() {
  const progress = useVocabStore((s) => s.progress);
  const toggleStar = useVocabStore((s) => s.toggleStar);
  const openWordDetail = useUIStore((s) => s.openWordDetail);

  const [query, setQuery] = useState('');
  const [deck, setDeck] = useState<string>('all');
  const [connotation, setConnotation] = useState<'all' | Connotation>('all');
  const [status, setStatus] = useState<'all' | MasteryStatus>('all');
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('deck');
  const [limit, setLimit] = useState(PAGE);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const list = WORDS.filter((w) => {
      if (deck !== 'all' && w.deckId !== Number(deck)) return false;
      if (connotation !== 'all' && w.connotation !== connotation) return false;
      if (status !== 'all' && getStatus(progress, w.id) !== status) return false;
      if (starredOnly && !progress[w.id]?.isStarred) return false;
      if (q && !w.word.toLowerCase().includes(q) && !w.definition.toLowerCase().includes(q) && !w.theme.toLowerCase().includes(q))
        return false;
      return true;
    });
    const sorted = [...list];
    if (sort === 'az') sorted.sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === 'za') sorted.sort((a, b) => b.word.localeCompare(a.word));
    else if (sort === 'connotation') sorted.sort((a, b) => a.connotation.localeCompare(b.connotation) || a.word.localeCompare(b.word));
    else if (sort === 'recent')
      sorted.sort((a, b) => (progress[b.id]?.lastReviewedAt ?? '').localeCompare(progress[a.id]?.lastReviewedAt ?? ''));
    return sorted;
  }, [deferredQuery, deck, connotation, status, starredOnly, sort, progress]);

  const resetLimit = () => setLimit(PAGE);
  const activeFilters = deck !== 'all' || connotation !== 'all' || status !== 'all' || starredOnly || query;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">Word Bank</p>
        <h1 className="font-serif text-5xl tracking-tight">All {TOTAL_WORDS.toLocaleString()} words.</h1>
      </div>

      <div className="sticky top-14 z-30 -mx-4 mt-6 border-b border-line bg-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                resetLimit();
              }}
              placeholder="Search words, definitions, themes…"
              className="pl-9"
              aria-label="Search the word bank"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select value={deck} onChange={(e) => { setDeck(e.target.value); resetLimit(); }} aria-label="Filter by deck">
              <option value="all">All decks</option>
              {DECKS.map((d) => (
                <option key={d.deckId} value={d.deckId}>
                  Deck {d.deckId}
                </option>
              ))}
            </Select>
            <Select
              value={connotation}
              onChange={(e) => { setConnotation(e.target.value as typeof connotation); resetLimit(); }}
              aria-label="Filter by connotation"
            >
              <option value="all">Any connotation</option>
              {CONNOTATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); resetLimit(); }} aria-label="Filter by status">
              <option value="all">Any status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
              <option value="deck">Deck order</option>
              <option value="az">A → Z</option>
              <option value="za">Z → A</option>
              <option value="connotation">Connotation</option>
              <option value="recent">Recently reviewed</option>
            </Select>
            <Button
              variant={starredOnly ? 'warning' : 'outline'}
              onClick={() => { setStarredOnly((s) => !s); resetLimit(); }}
              aria-pressed={starredOnly}
              className="col-span-2 sm:col-span-1"
            >
              <Star className={cn('h-4 w-4', starredOnly && 'fill-current')} /> Starred
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-[11px] text-zinc-500">
          <ArrowDownAZ className="h-3.5 w-3.5" />
          {filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}
          {activeFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDeck('all');
                setConnotation('all');
                setStatus('all');
                setStarredOnly(false);
                resetLimit();
              }}
              className="ml-2 text-violet-600 hover:underline dark:text-violet-400"
            >
              clear filters
            </button>
          )}
        </div>
      </div>

      <ul className="mt-4 grid gap-2 md:grid-cols-2">
        {filtered.slice(0, limit).map((w) => (
          <li key={w.id}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => openWordDetail(w.id)}
              onKeyDown={(e) => e.key === 'Enter' && openWordDetail(w.id)}
              className="group flex h-full cursor-pointer gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-zinc-300 hover:shadow-sm dark:hover:border-white/15"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-serif text-2xl leading-tight">{w.word}</span>
                  <ConnotationBadge connotation={w.connotation} className="scale-90 origin-left" />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{w.definition}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] text-zinc-400">DECK {w.deckId}</span>
                  <span className="max-w-[14rem] truncate text-[11px] text-zinc-500">· {w.theme}</span>
                  <StatusBadge status={getStatus(progress, w.id)} className="ml-auto scale-90 origin-right" />
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <StarButton starred={!!progress[w.id]?.isStarred} onToggle={() => toggleStar(w.id)} className="h-8 w-8" />
                <SpeakButton text={w.word} size="sm" />
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-16 text-center text-sm text-zinc-500">
          No words match these filters.
        </div>
      )}
      {filtered.length > limit && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE * 2)}>
            Show more ({(filtered.length - limit).toLocaleString()} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
