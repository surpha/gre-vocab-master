'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Flame, LayoutGrid, RotateCcw, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConnotationBadge } from '@/components/word-bits';
import type { QuizOutcome } from '@/components/quiz/QuizRunner';
import { TOTAL_DECKS, WORD_BY_ID } from '@/lib/vocab';
import type { PoolSpec } from '@/lib/pools';
import { useUIStore } from '@/store/useUIStore';
import type { VocabWord } from '@/types/vocab';

export function QuizResults({
  outcome,
  spec,
  onRetryMissed,
  onRestart,
  onLobby,
}: {
  outcome: QuizOutcome;
  spec: PoolSpec;
  onRetryMissed: (words: VocabWord[]) => void;
  onRestart: () => void;
  onLobby: () => void;
}) {
  const openWordDetail = useUIStore((s) => s.openWordDetail);
  const { answers, bestStreak, points, format } = outcome;
  const correct = answers.filter((a) => a.correct).length;
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0;

  const { missed, gotRight } = useMemo(() => {
    const missedIds = new Set(answers.filter((a) => !a.correct).map((a) => a.wordId));
    const rightIds = new Set(answers.filter((a) => a.correct && !missedIds.has(a.wordId)).map((a) => a.wordId));
    const toWords = (ids: Set<number>) => [...ids].map((id) => WORD_BY_ID.get(id)).filter((w): w is VocabWord => !!w);
    return { missed: toWords(missedIds), gotRight: toWords(rightIds) };
  }, [answers]);

  useEffect(() => {
    if (accuracy < 80 || answers.length === 0) return;
    let cancelled = false;
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return;
      const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
      confetti({ particleCount: 120, spread: 75, origin: { y: 0.35 }, colors, disableForReducedMotion: true });
      setTimeout(() => !cancelled && confetti({ particleCount: 60, spread: 110, origin: { y: 0.4 }, colors, disableForReducedMotion: true }), 250);
    });
    return () => {
      cancelled = true;
    };
  }, [accuracy, answers.length]);

  const nextDeck = spec.kind === 'deck' ? (spec.deckId % TOTAL_DECKS) + 1 : null;
  const missedIds = missed.map((w) => w.id).join(',');
  const ring = 2 * Math.PI * 52;
  const ringColor = accuracy >= 80 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <div>
      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
          <div className="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-zinc-200 dark:stroke-white/10" />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                stroke={ringColor}
                strokeDasharray={ring}
                initial={{ strokeDashoffset: ring }}
                animate={{ strokeDashoffset: ring * (1 - accuracy / 100) }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-medium">{accuracy}%</span>
              <span className="text-[11px] text-zinc-500">accuracy</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Quiz complete</p>
            <h2 className="mt-1 font-serif text-4xl">
              {accuracy >= 90 ? 'Outstanding.' : accuracy >= 80 ? 'Excellent work.' : accuracy >= 50 ? 'Solid progress.' : 'Keep at it.'}
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric icon={<Trophy className="h-3.5 w-3.5" />} label="Score" value={`${correct}/${answers.length}`} />
              <Metric icon={<Flame className="h-3.5 w-3.5" />} label="Best streak" value={String(bestStreak)} />
              <Metric icon={<Zap className="h-3.5 w-3.5" />} label={format === 'blitz' ? 'Points' : 'Missed'} value={format === 'blitz' ? points.toLocaleString() : String(missed.length)} />
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-2 border-t border-line pt-5">
          <Button onClick={() => onRetryMissed(missed)} disabled={missed.length === 0}>
            <RotateCcw className="h-4 w-4" /> Retry Missed Words Only
          </Button>
          {missed.length > 0 ? (
            <Link
              href={`/learn?pool=custom&ids=${missedIds}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5"
            >
              <BookOpen className="h-4 w-4" /> Study Missed in Learn Mode
            </Link>
          ) : null}
          {nextDeck ? (
            <Link
              href={`/quiz?deck=${nextDeck}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5"
            >
              <Zap className="h-4 w-4" /> Next Deck Quiz (Deck {nextDeck})
            </Link>
          ) : (
            <Button variant="outline" onClick={onRestart}>
              <Zap className="h-4 w-4" /> Quiz again
            </Button>
          )}
          <Button variant="ghost" onClick={onLobby} className="ml-auto">
            <LayoutGrid className="h-4 w-4" /> Quiz setup
          </Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <WordList title="Missed words" tone="rose" words={missed} onOpen={openWordDetail} empty="Nothing missed — flawless." />
        <WordList title="Correct words" tone="emerald" words={gotRight} onOpen={openWordDetail} empty="No correct answers yet." />
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 font-mono text-lg font-medium">{value}</div>
    </div>
  );
}

function WordList({
  title,
  tone,
  words,
  onOpen,
  empty,
}: {
  title: string;
  tone: 'rose' | 'emerald';
  words: VocabWord[];
  onOpen: (id: number) => void;
  empty: string;
}) {
  return (
    <Card className="p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <span className={tone === 'rose' ? 'h-2 w-2 rounded-full bg-rose-500' : 'h-2 w-2 rounded-full bg-emerald-500'} />
        {title}
        <span className="font-mono text-xs text-zinc-400">{words.length}</span>
      </h3>
      {words.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {words.map((w) => (
            <li key={w.id}>
              <button type="button" onClick={() => onOpen(w.id)} className="flex w-full items-start gap-3 py-2.5 text-left">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg leading-tight">{w.word}</span>
                    <ConnotationBadge connotation={w.connotation} className="scale-90 origin-left" />
                  </div>
                  <p className="truncate text-xs text-zinc-500">{w.definition}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
