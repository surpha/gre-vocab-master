'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EyeOff, Layers, RotateCcw, Shuffle, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { PoolSelect } from '@/components/PoolSelect';
import { FlashcardSession } from '@/components/learn/FlashcardSession';
import { CramTable } from '@/components/learn/CramTable';
import { parsePool, poolKey, poolLabel, poolToQuery, resolvePool, type PoolSpec } from '@/lib/pools';
import { shuffle as shuffleArray } from '@/lib/utils';
import { useVocabStore } from '@/store/useVocabStore';

type Mode = 'cards' | 'table';

export function LearnView() {
  const params = useSearchParams();
  const router = useRouter();
  const progress = useVocabStore((s) => s.progress);
  const hasHydrated = useVocabStore((s) => s.hasHydrated);
  const lastActiveDeck = useVocabStore((s) => s.lastActiveDeck);
  const setLastActiveDeck = useVocabStore((s) => s.setLastActiveDeck);

  const [mode, setMode] = useState<Mode>('cards');
  const [shuffled, setShuffled] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);
  const [nonce, setNonce] = useState(0);

  const paramString = params.toString();
  const spec = useMemo(
    () => parsePool(new URLSearchParams(paramString), hasHydrated ? lastActiveDeck : 1),
    [paramString, hasHydrated, lastActiveDeck],
  );

  useEffect(() => {
    if (spec.kind === 'deck' && hasHydrated) setLastActiveDeck(spec.deckId);
  }, [spec, hasHydrated, setLastActiveDeck]);

  const counts = useMemo(() => {
    let weak = 0;
    let starred = 0;
    for (const p of Object.values(progress)) {
      if (p.status === 'learning') weak++;
      if (p.isStarred) starred++;
    }
    return { weak, starred };
  }, [progress]);

  const navigate = (next: PoolSpec) => router.replace(`/learn?${poolToQuery(next)}`, { scroll: false });

  const sessionKey = `${poolKey(spec)}|${shuffled}|${hideMastered}|${nonce}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <h1 className="font-serif text-3xl tracking-tight">Learn</h1>
          <PoolSelect spec={spec} onChange={navigate} counts={counts} className="w-64" />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Button size="sm" variant={shuffled ? 'primary' : 'outline'} onClick={() => setShuffled((s) => !s)} aria-pressed={shuffled}>
            <Shuffle className="h-3.5 w-3.5" /> Shuffle
          </Button>
          <Button
            size="sm"
            variant={hideMastered ? 'primary' : 'outline'}
            onClick={() => setHideMastered((s) => !s)}
            aria-pressed={hideMastered}
          >
            <EyeOff className="h-3.5 w-3.5" /> Hide mastered
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNonce((n) => n + 1)}>
            <RotateCcw className="h-3.5 w-3.5" /> Restart
          </Button>
          <Tabs
            size="sm"
            value={mode}
            onChange={setMode}
            items={[
              { value: 'cards', label: <><Layers className="h-3.5 w-3.5" /> Flashcards</> },
              { value: 'table', label: <><Table2 className="h-3.5 w-3.5" /> Cram Table</> },
            ]}
          />
        </div>
      </div>

      {!hasHydrated ? (
        <div className="mx-auto h-[26rem] max-w-3xl animate-pulse rounded-3xl border border-line bg-surface" />
      ) : (
        <LearnSession
          key={sessionKey}
          spec={spec}
          mode={mode}
          shuffled={shuffled}
          hideMastered={hideMastered}
          onRestart={() => setNonce((n) => n + 1)}
        />
      )}
    </div>
  );
}

/** Snapshot of the pool taken on mount so grading doesn't reshuffle the active session. */
function LearnSession({
  spec,
  mode,
  shuffled,
  hideMastered,
  onRestart,
}: {
  spec: PoolSpec;
  mode: Mode;
  shuffled: boolean;
  hideMastered: boolean;
  onRestart: () => void;
}) {
  const [words] = useState(() => {
    const progress = useVocabStore.getState().progress;
    const pool = resolvePool(spec, progress).filter((w) => !hideMastered || progress[w.id]?.status !== 'mastered');
    return shuffled ? shuffleArray(pool) : pool;
  });
  const [queue] = useState(() => words.map((w) => w.id));

  if (words.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-line px-6 py-16 text-center">
        <h2 className="font-serif text-3xl">Nothing to study here</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {spec.kind === 'starred'
            ? 'Star words with [S] while studying to build a custom list.'
            : spec.kind === 'weak'
              ? 'No words marked “Still Learning” — nice work.'
              : hideMastered
                ? `Every word in ${poolLabel(spec)} is mastered.`
                : 'This pool is empty.'}
        </p>
        <Link
          href="/learn?deck=1"
          className="mt-6 inline-flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Study Deck 1
        </Link>
      </div>
    );
  }

  return mode === 'cards' ? (
    <FlashcardSession initialQueue={queue} spec={spec} onRestart={onRestart} />
  ) : (
    <CramTable words={words} />
  );
}
