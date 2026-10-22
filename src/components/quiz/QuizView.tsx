'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlignLeft, BookA, Play, Timer, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PoolSelect } from '@/components/PoolSelect';
import { QuizRunner, type QuizOutcome } from '@/components/quiz/QuizRunner';
import { QuizResults } from '@/components/quiz/QuizResults';
import { QUIZ_FORMATS, type QuizFormat } from '@/lib/quiz-engine';
import { parsePool, poolLabel, poolToQuery, resolvePool } from '@/lib/pools';
import { cn, shuffle } from '@/lib/utils';
import { useVocabStore } from '@/store/useVocabStore';
import type { VocabWord } from '@/types/vocab';

export type QuizLength = 10 | 25 | 50 | 'endless';

const LENGTHS: { value: QuizLength; label: string }[] = [
  { value: 10, label: '10 Questions' },
  { value: 25, label: '25 Questions' },
  { value: 50, label: 'Full Deck (50)' },
  { value: 'endless', label: 'Endless' },
];

const FORMAT_ICONS: Record<QuizFormat, React.ReactNode> = {
  cloze: <AlignLeft className="h-5 w-5" />,
  'word-to-def': <BookA className="h-5 w-5" />,
  'def-to-word': <Type className="h-5 w-5" />,
  blitz: <Timer className="h-5 w-5" />,
};

export function QuizView() {
  const params = useSearchParams();
  const paramString = params.toString();
  const [format, setFormat] = useState<QuizFormat>('cloze');
  const [length, setLength] = useState<QuizLength>(10);
  return (
    <QuizController
      key={paramString}
      paramString={paramString}
      format={format}
      setFormat={setFormat}
      length={length}
      setLength={setLength}
    />
  );
}

type Phase =
  | { name: 'lobby' }
  | { name: 'running'; words: VocabWord[]; format: QuizFormat; length: QuizLength; runId: number }
  | { name: 'results'; outcome: QuizOutcome; format: QuizFormat; length: QuizLength };

function QuizController({
  paramString,
  format,
  setFormat,
  length,
  setLength,
}: {
  paramString: string;
  format: QuizFormat;
  setFormat: (f: QuizFormat) => void;
  length: QuizLength;
  setLength: (l: QuizLength) => void;
}) {
  const router = useRouter();
  const progress = useVocabStore((s) => s.progress);
  const hasHydrated = useVocabStore((s) => s.hasHydrated);
  const lastActiveDeck = useVocabStore((s) => s.lastActiveDeck);
  const incrementQuizzesTaken = useVocabStore((s) => s.incrementQuizzesTaken);

  const spec = useMemo(
    () => parsePool(new URLSearchParams(paramString), hasHydrated ? lastActiveDeck : 1),
    [paramString, hasHydrated, lastActiveDeck],
  );
  const [phase, setPhase] = useState<Phase>({ name: 'lobby' });

  const poolWords = useMemo(() => resolvePool(spec, progress), [spec, progress]);
  const counts = useMemo(() => {
    let weak = 0;
    let starred = 0;
    for (const p of Object.values(progress)) {
      if (p.status === 'learning') weak++;
      if (p.isStarred) starred++;
    }
    return { weak, starred };
  }, [progress]);

  const start = (words: VocabWord[], f = format, l = length) => {
    if (!words.length) return;
    setPhase({ name: 'running', words: shuffle(words), format: f, length: l, runId: Date.now() });
  };

  if (phase.name === 'running') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <QuizRunner
          key={phase.runId}
          words={phase.words}
          format={phase.format}
          length={phase.length}
          onQuit={() => setPhase({ name: 'lobby' })}
          onFinish={(outcome) => {
            incrementQuizzesTaken();
            setPhase({ name: 'results', outcome, format: phase.format, length: phase.length });
          }}
        />
      </div>
    );
  }

  if (phase.name === 'results') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <QuizResults
          outcome={phase.outcome}
          spec={spec}
          onRetryMissed={(words) => start(words, phase.format === 'blitz' ? 'cloze' : phase.format, 50)}
          onRestart={() => start(poolWords, phase.format, phase.length)}
          onLobby={() => setPhase({ name: 'lobby' })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">Quiz Mode</p>
        <h1 className="mt-2 font-serif text-5xl tracking-tight">Test yourself.</h1>
        <p className="mt-2 text-zinc-500">Distractors never come from the same synonym cluster — every question has exactly one right answer.</p>
      </motion.div>

      <Card className="mt-8 p-5 sm:p-6">
        <Section step="1" title="Word pool">
          <div className="flex flex-wrap items-center gap-3">
            <PoolSelect
              spec={spec}
              includeAll
              counts={counts}
              onChange={(next) => router.replace(`/quiz?${poolToQuery(next)}`, { scroll: false })}
              className="w-full sm:w-80"
            />
            <span className="font-mono text-xs text-zinc-500">
              {hasHydrated ? poolWords.length.toLocaleString() : '—'} words in {poolLabel(spec)}
            </span>
          </div>
        </Section>

        <Section step="2" title="Format">
          <div className="grid gap-2 sm:grid-cols-2">
            {QUIZ_FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                aria-pressed={format === f.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-4 text-left transition',
                  format === f.id
                    ? 'border-violet-500/50 bg-violet-500/[0.06] ring-1 ring-violet-500/30'
                    : 'border-line hover:border-zinc-300 dark:hover:border-white/15',
                )}
              >
                <span className={cn('mt-0.5', format === f.id ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400')}>
                  {FORMAT_ICONS[f.id]}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{f.title}</span>
                  <span className="mt-0.5 block text-xs text-zinc-500">{f.description}</span>
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section step="3" title="Length" last>
          <div className={cn('flex flex-wrap gap-2', format === 'blitz' && 'pointer-events-none opacity-40')}>
            {LENGTHS.map((l) => (
              <button
                key={String(l.value)}
                type="button"
                onClick={() => setLength(l.value)}
                aria-pressed={length === l.value}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition',
                  length === l.value
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-line hover:bg-zinc-50 dark:hover:bg-white/5',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          {format === 'blitz' && <p className="mt-2 text-xs text-zinc-500">Blitz runs for 60 seconds — answer as many as you can.</p>}
        </Section>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-xs text-zinc-500">
            Keys: <span className="font-mono">1–4</span> answer · <span className="font-mono">Enter</span> next
          </p>
          <Button size="lg" onClick={() => start(poolWords)} disabled={!hasHydrated || poolWords.length === 0}>
            <Play className="h-4 w-4" /> Start Quiz
          </Button>
        </div>
        {hasHydrated && poolWords.length === 0 && (
          <p className="mt-3 text-right text-xs text-rose-500">This pool is empty — pick a deck instead.</p>
        )}
      </Card>
    </div>
  );
}

function Section({ step, title, children, last }: { step: string; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section className={cn('pb-6', !last && 'mb-6 border-b border-line')}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900/[0.06] font-mono text-[10px] dark:bg-white/10">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
