'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Search, Star, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SegmentedProgress } from '@/components/ui/progress';
import { Tabs } from '@/components/ui/tabs';
import { STATUS_META } from '@/components/word-bits';
import { DECKS, TOTAL_DECKS, TOTAL_WORDS, WORDS, getDeckWords } from '@/lib/vocab';
import { countStatuses, deckStats, type StatusCounts } from '@/lib/pools';
import { cn } from '@/lib/utils';
import { useVocabStore } from '@/store/useVocabStore';
import type { DeckMeta, MasteryStatus } from '@/types/vocab';

type DeckFilter = 'all' | 'progress' | 'completed';

const ORDER: MasteryStatus[] = ['mastered', 'reviewing', 'learning', 'unseen'];

const DECK_SEARCH_TEXT = new Map(
  DECKS.map((d) => [
    d.deckId,
    getDeckWords(d.deckId)
      .map((w) => `${w.theme} ${w.word}`)
      .join(' | ')
      .toLowerCase(),
  ]),
);

export function Dashboard() {
  const progress = useVocabStore((s) => s.progress);
  const lastActiveDeck = useVocabStore((s) => s.lastActiveDeck);
  const hasHydrated = useVocabStore((s) => s.hasHydrated);
  const [filter, setFilter] = useState<DeckFilter>('all');
  const [query, setQuery] = useState('');

  const overall = useMemo(() => countStatuses(WORDS, progress), [progress]);
  const perDeck = useMemo(() => deckStats(progress), [progress]);
  const starredCount = useMemo(() => Object.values(progress).filter((p) => p.isStarred).length, [progress]);

  const inProgressCount = DECKS.filter((d) => {
    const s = perDeck.get(d.deckId)!;
    return s.unseen < s.total && s.mastered < s.total;
  }).length;
  const completedCount = DECKS.filter((d) => perDeck.get(d.deckId)!.mastered === d.wordCount).length;

  const visibleDecks = DECKS.filter((d) => {
    const s = perDeck.get(d.deckId)!;
    if (filter === 'progress' && !(s.unseen < s.total && s.mastered < s.total)) return false;
    if (filter === 'completed' && s.mastered !== s.total) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (`deck ${d.deckId}` === q || String(d.deckId) === q) return true;
    return DECK_SEARCH_TEXT.get(d.deckId)!.includes(q);
  });

  const masteredPct = Math.round((overall.mastered / TOTAL_WORDS) * 100);
  const resumeDeck = hasHydrated ? lastActiveDeck : 1;

  return (
    <div className="bg-grid">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">GRE Verbal · {TOTAL_WORDS.toLocaleString()} words · {TOTAL_DECKS} decks</p>
          <h1 className="mt-3 font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
            Words that <span className="text-violet-600 italic dark:text-violet-400">stick</span>.
          </h1>
          <p className="mt-3 max-w-xl text-zinc-500">
            Synonym clusters grouped into high-yield decks, connotation cues on every card, and quizzes that hunt your weak spots.
          </p>
        </motion.section>

        <Card className="mt-8 overflow-hidden">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-sm font-semibold">Mastery Overview</h2>
                <span className="font-mono text-sm text-zinc-500">
                  <span className="text-foreground">{overall.mastered.toLocaleString()}</span> / {TOTAL_WORDS.toLocaleString()} ·{' '}
                  {masteredPct}%
                </span>
              </div>
              <SegmentedProgress
                className="mt-3 h-3"
                total={TOTAL_WORDS}
                segments={ORDER.filter((s) => s !== 'unseen').map((s) => ({
                  label: STATUS_META[s].label,
                  value: overall[s],
                  className: STATUS_META[s].bar,
                }))}
              />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ORDER.map((s) => (
                  <div key={s} className="rounded-xl border border-line px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_META[s].dot)} />
                      {STATUS_META[s].label}
                    </div>
                    <div className="mt-1 font-mono text-xl font-medium">{overall[s].toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:w-72">
              <Link
                href={`/learn?deck=${resumeDeck}`}
                className="group flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <BookOpen className="h-4 w-4" />
                Continue Deck {resumeDeck} in Learn Mode
                <ArrowRight className="ml-auto h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <QuickLink href="/quiz?pool=weak" icon={<Target className="h-4 w-4 text-rose-500" />} disabled={overall.learning === 0}>
                Quiz My Weak Words
                <span className="ml-auto font-mono text-xs text-zinc-400">{overall.learning}</span>
              </QuickLink>
              <QuickLink href="/quiz?pool=starred" icon={<Star className="h-4 w-4 text-amber-500" />} disabled={starredCount === 0}>
                Quiz Starred Words
                <span className="ml-auto font-mono text-xs text-zinc-400">{starredCount}</span>
              </QuickLink>
            </div>
          </div>
        </Card>

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={filter}
              onChange={setFilter}
              items={[
                { value: 'all', label: <>All Decks <Count n={TOTAL_DECKS} /></> },
                { value: 'progress', label: <>In Progress <Count n={inProgressCount} /></> },
                { value: 'completed', label: <>Completed <Count n={completedCount} /></> },
              ]}
            />
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter decks by theme…" className="pl-9" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleDecks.map((deck, i) => (
              <DeckCard key={deck.deckId} deck={deck} stats={perDeck.get(deck.deckId)!} index={i} />
            ))}
          </div>
          {visibleDecks.length === 0 && (
            <div className="mt-5 rounded-2xl border border-dashed border-line py-16 text-center text-sm text-zinc-500">
              No decks match this filter yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="font-mono text-[11px] text-zinc-400">{n}</span>;
}

function QuickLink({
  href,
  icon,
  disabled,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const className =
    'flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5';
  if (disabled) {
    return (
      <span className={cn(className, 'cursor-not-allowed opacity-50 hover:bg-transparent')} aria-disabled>
        {icon}
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className}>
      {icon}
      {children}
    </Link>
  );
}

function DeckCard({ deck, stats, index }: { deck: DeckMeta; stats: StatusCounts; index: number }) {
  const pct = Math.round((stats.mastered / stats.total) * 100);
  const complete = stats.mastered === stats.total;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.02, 0.3) }}
    >
      <Card className="group flex h-full flex-col p-5 transition hover:border-zinc-300 hover:shadow-md dark:hover:border-white/15">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl">Deck {deck.deckId}</span>
            <span className="font-mono text-xs text-zinc-400">{deck.wordCount} words</span>
          </div>
          <Badge tone={complete ? 'positive' : pct > 0 ? 'violet' : 'muted'} className="font-mono">
            {pct}%
          </Badge>
        </div>
        <div className="mt-3 flex min-h-[3.25rem] flex-wrap content-start gap-1">
          {deck.topThemes.map((t) => (
            <span
              key={t}
              title={t}
              className="max-w-full truncate rounded-md bg-zinc-500/[0.07] px-2 py-0.5 text-[11px] text-zinc-600 dark:text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
        <SegmentedProgress
          className="mt-4 h-1.5"
          total={stats.total}
          segments={(['mastered', 'reviewing', 'learning'] as const).map((s) => ({
            label: STATUS_META[s].label,
            value: stats[s],
            className: STATUS_META[s].bar,
          }))}
        />
        <div className="mt-1.5 flex gap-3 font-mono text-[10px] text-zinc-400">
          <span>{stats.mastered} mastered</span>
          <span>{stats.reviewing} reviewing</span>
          <span>{stats.learning} learning</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/learn?deck=${deck.deckId}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-zinc-900 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <BookOpen className="h-4 w-4" /> Learn
          </Link>
          <Link
            href={`/quiz?deck=${deck.deckId}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5"
          >
            <Zap className="h-4 w-4" /> Quiz
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
