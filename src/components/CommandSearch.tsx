'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/badge';
import { ConnotationBadge } from '@/components/word-bits';
import { WORDS, TOTAL_WORDS } from '@/lib/vocab';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import type { VocabWord } from '@/types/vocab';

const INDEX = WORDS.map((w) => ({
  word: w,
  w: w.word.toLowerCase(),
  d: w.definition.toLowerCase(),
  t: w.theme.toLowerCase(),
}));

export function searchWords(query: string, limit = 40): VocabWord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored: { word: VocabWord; score: number }[] = [];
  for (const item of INDEX) {
    let score = 0;
    if (item.w === q) score = 100;
    else if (item.w.startsWith(q)) score = 80 - item.w.length * 0.1;
    else if (item.w.includes(q)) score = 60;
    else if (item.t.includes(q)) score = 40;
    else if (item.d.includes(q)) score = 20;
    if (score) scored.push({ word: item.word, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.word.word.localeCompare(b.word.word))
    .slice(0, limit)
    .map((s) => s.word);
}

export function CommandSearch() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const openWordDetail = useUIStore((s) => s.openWordDetail);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const deferred = useDeferredValue(query);
  const results = useMemo(() => searchWords(deferred), [deferred]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUIStore.getState().searchOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = () => {
    setOpen(false);
    setQuery('');
    setActive(0);
  };

  const select = (w: VocabWord) => {
    setQuery('');
    setActive(0);
    openWordDetail(w.id);
  };

  return (
    <Dialog open={open} onClose={close} label="Search words" position="top" showClose={false} className="max-w-2xl">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && results[active]) {
              e.preventDefault();
              select(results[active]);
            }
          }}
          placeholder={`Search ${TOTAL_WORDS.toLocaleString()} words, meanings, or themes…`}
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-zinc-400"
          aria-label="Search words"
        />
        <Kbd>esc</Kbd>
      </div>
      <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
        {!query.trim() && (
          <div className="px-3 py-10 text-center text-sm text-zinc-500">
            Try <span className="font-serif text-base text-foreground italic">“laconic”</span>,{' '}
            <span className="font-serif text-base text-foreground italic">“praise”</span>, or{' '}
            <span className="font-serif text-base text-foreground italic">“deceptive”</span>
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div className="px-3 py-10 text-center text-sm text-zinc-500">No words match “{query}”.</div>
        )}
        {results.map((w, i) => (
          <button
            key={w.id}
            type="button"
            data-index={i}
            onMouseMove={() => setActive(i)}
            onClick={() => select(w)}
            className={cn(
              'flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
              i === active ? 'bg-zinc-100 dark:bg-white/[0.06]' : '',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl leading-tight">{w.word}</span>
                <ConnotationBadge connotation={w.connotation} className="scale-90" />
              </div>
              <p className="mt-0.5 truncate text-sm text-zinc-500">{w.definition}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 pt-1">
              <span className="font-mono text-[10px] text-zinc-400">DECK {w.deckId}</span>
              {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-zinc-400" />}
            </div>
          </button>
        ))}
      </div>
    </Dialog>
  );
}
