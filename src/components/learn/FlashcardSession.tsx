'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, Lightbulb, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog } from '@/components/ui/dialog';
import {
  ConnotationBadge,
  HighlightedSentence,
  PosBadge,
  SpeakButton,
  StarButton,
  StatusBadge,
  ThemeTag,
} from '@/components/word-bits';
import { speakWord } from '@/lib/speech';
import { WORD_BY_ID, WORD_BY_TEXT, TOTAL_DECKS } from '@/lib/vocab';
import { poolToQuery, type PoolSpec } from '@/lib/pools';
import { cn, isTypingTarget } from '@/lib/utils';
import { getStatus, useVocabStore } from '@/store/useVocabStore';
import type { MasteryStatus, VocabWord } from '@/types/vocab';

const GRADES: { key: string; status: Exclude<MasteryStatus, 'unseen'>; label: string; variant: 'negative' | 'warning' | 'positive' }[] = [
  { key: '1', status: 'learning', label: 'Still Learning', variant: 'negative' },
  { key: '2', status: 'reviewing', label: 'Almost There', variant: 'warning' },
  { key: '3', status: 'mastered', label: 'Mastered', variant: 'positive' },
];

export function FlashcardSession({ initialQueue, spec, onRestart }: { initialQueue: number[]; spec: PoolSpec; onRestart: () => void }) {
  const progress = useVocabStore((s) => s.progress);
  const setWordStatus = useVocabStore((s) => s.setWordStatus);
  const toggleStar = useVocabStore((s) => s.toggleStar);

  const [queue, setQueue] = useState(initialQueue);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hint, setHint] = useState(false);
  const [direction, setDirection] = useState(1);
  const [graded, setGraded] = useState<Record<number, MasteryStatus>>({});
  const [compareWith, setCompareWith] = useState<VocabWord | null>(null);

  const done = index >= queue.length;
  const word = !done ? WORD_BY_ID.get(queue[index]) : undefined;

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex(Math.max(0, Math.min(next, queue.length)));
      setFlipped(false);
      setHint(false);
    },
    [index, queue.length],
  );

  const grade = useCallback(
    (status: Exclude<MasteryStatus, 'unseen'>) => {
      if (!word) return;
      setWordStatus(word.id, status);
      setGraded((g) => ({ ...g, [word.id]: status }));
      if (status === 'learning') setQueue((q) => [...q, word.id]);
      goTo(index + 1);
    },
    [word, setWordStatus, goTo, index],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (done) return;
      const k = e.key.toLowerCase();
      if (k === ' ' || k === 'enter') {
        e.preventDefault();
        if (e.target instanceof HTMLButtonElement) e.target.blur();
        setFlipped((f) => !f);
      } else if (k === 'arrowright') goTo(index + 1);
      else if (k === 'arrowleft') goTo(index - 1);
      else if (k === 'h') setHint((h) => !h);
      else if (k === 's' && word) toggleStar(word.id);
      else if (k === 'p' && word) speakWord(word.word);
      else {
        const g = GRADES.find((x) => x.key === k);
        if (g) grade(g.status);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, goTo, grade, index, toggleStar, word]);

  if (done) {
    return <SessionComplete graded={graded} spec={spec} onRestart={onRestart} total={initialQueue.length} />;
  }
  if (!word) return null;

  const status = getStatus(progress, word.id);
  const starred = !!progress[word.id]?.isStarred;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <Progress value={(index / queue.length) * 100} className="h-1" barClassName="bg-violet-500 dark:bg-violet-400" />
        <span className="shrink-0 font-mono text-xs text-zinc-500">
          {index + 1}/{queue.length}
        </span>
      </div>

      <div className="[perspective:1600px]">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={`${word.id}-${index}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              role="button"
              tabIndex={0}
              aria-label={flipped ? 'Show word' : 'Reveal definition'}
              onClick={() => setFlipped((f) => !f)}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="preserve-3d grid cursor-pointer [grid-template-areas:'stack'] focus:outline-none"
            >
              {/* Front */}
              <div className="backface-hidden flex min-h-[26rem] flex-col rounded-3xl border border-line bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] [grid-area:stack] sm:p-7">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-400">
                    Card {index + 1} of {queue.length}
                  </span>
                  <StatusBadge status={status} />
                  <div className="ml-auto flex items-center">
                    <StarButton starred={starred} onToggle={() => toggleStar(word.id)} />
                    <SpeakButton text={word.word} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                  <h2 className="font-serif text-5xl leading-none tracking-tight break-words md:text-6xl">{word.word}</h2>
                  <div className="mt-6 h-16">
                    <AnimatePresence mode="wait">
                      {hint ? (
                        <motion.div
                          key="hint"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-wrap items-center justify-center gap-1.5"
                        >
                          <ConnotationBadge connotation={word.connotation} />
                          <ThemeTag theme={word.theme} />
                        </motion.div>
                      ) : (
                        <motion.button
                          key="hint-btn"
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setHint(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-zinc-500 transition hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300"
                        >
                          <Lightbulb className="h-3.5 w-3.5" /> Reveal hint <Kbd>H</Kbd>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <p className="text-center text-xs text-zinc-400">
                  Click card or press <Kbd>Space</Kbd> to flip
                </p>
              </div>

              {/* Back */}
              <div className="backface-hidden flex min-h-[26rem] flex-col rounded-3xl border border-line bg-surface p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)] [grid-area:stack] [transform:rotateY(180deg)] sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-3xl leading-none tracking-tight">{word.word}</h2>
                  <SpeakButton text={word.word} size="sm" />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ConnotationBadge connotation={word.connotation} />
                    <PosBadge pos={word.partOfSpeech} />
                    <ThemeTag theme={word.theme} />
                  </div>
                  <StarButton starred={starred} onToggle={() => toggleStar(word.id)} className="ml-auto" />
                </div>
                <p className="mt-6 text-xl leading-snug font-medium md:text-2xl">{word.definition}</p>
                <div className="mt-5 rounded-2xl border border-violet-500/15 bg-violet-500/[0.05] p-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                  <span className="mb-1 block font-mono text-[10px] tracking-widest text-violet-500 uppercase">In context</span>
                  <HighlightedSentence sentence={word.exampleSentence} word={word.word} />
                </div>
                {word.synonyms.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                      Related synonyms in this theme
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {word.synonyms.map((syn) => (
                        <button
                          key={syn}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = WORD_BY_TEXT.get(syn.toLowerCase());
                            if (target) setCompareWith(target);
                          }}
                          className="rounded-full border border-line px-2.5 py-0.5 text-sm transition hover:border-violet-500/40 hover:bg-violet-500/5"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Previous card">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="grid flex-1 grid-cols-3 gap-2">
          {GRADES.map((g) => (
            <Button key={g.key} variant={g.variant} size="lg" onClick={() => grade(g.status)} className="px-2">
              <Kbd className="hidden border-current/20 bg-transparent text-current sm:inline-flex">{g.key}</Kbd>
              <span className="truncate">{g.label}</span>
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" onClick={() => goTo(index + 1)} aria-label="Next card">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-4 hidden items-center justify-center gap-3 text-[11px] text-zinc-400 sm:flex">
        <span><Kbd>←</Kbd> <Kbd>→</Kbd> navigate</span>
        <span><Kbd>S</Kbd> star</span>
        <span><Kbd>P</Kbd> pronounce</span>
        <span><Kbd>H</Kbd> hint</span>
      </p>

      <SynonymCompare base={word} other={compareWith} onClose={() => setCompareWith(null)} />
    </div>
  );
}

function SynonymCompare({ base, other, onClose }: { base: VocabWord; other: VocabWord | null; onClose: () => void }) {
  return (
    <Dialog open={!!other} onClose={onClose} label="Compare synonyms" className="max-w-3xl">
      {other && (
        <div className="overflow-y-auto p-6">
          <p className="font-mono text-[11px] tracking-widest text-zinc-500 uppercase">Compare · {base.theme}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[base, other].map((w) => (
              <div key={w.id} className="rounded-2xl border border-line p-5">
                <div className="flex items-center gap-1">
                  <h3 className="font-serif text-3xl">{w.word}</h3>
                  <SpeakButton text={w.word} size="sm" />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <ConnotationBadge connotation={w.connotation} />
                  <PosBadge pos={w.partOfSpeech} />
                </div>
                <p className="mt-3 font-medium">{w.definition}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 italic">
                  “<HighlightedSentence sentence={w.exampleSentence} word={w.word} />”
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
}

function SessionComplete({
  graded,
  spec,
  total,
  onRestart,
}: {
  graded: Record<number, MasteryStatus>;
  spec: PoolSpec;
  total: number;
  onRestart: () => void;
}) {
  const counts = useMemo(() => {
    const c = { learning: 0, reviewing: 0, mastered: 0 };
    for (const s of Object.values(graded)) if (s !== 'unseen') c[s]++;
    return c;
  }, [graded]);
  const nextDeck = spec.kind === 'deck' && spec.deckId < TOTAL_DECKS ? spec.deckId + 1 : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 text-center"
    >
      <Sparkles className="mx-auto h-8 w-8 text-violet-500" />
      <h2 className="mt-4 font-serif text-4xl">Session complete</h2>
      <p className="mt-2 text-sm text-zinc-500">
        You reviewed {total} card{total === 1 ? '' : 's'}. Lock it in with a quiz.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Mastered" value={counts.mastered} className="text-emerald-600 dark:text-emerald-400" />
        <Stat label="Almost" value={counts.reviewing} className="text-amber-600 dark:text-amber-400" />
        <Stat label="Learning" value={counts.learning} className="text-rose-600 dark:text-rose-400" />
      </div>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href={`/quiz?${poolToQuery(spec)}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          <Zap className="h-4 w-4" /> Quiz these words
        </Link>
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> Study again
        </Button>
        {nextDeck && (
          <Link
            href={`/learn?deck=${nextDeck}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-white/5"
          >
            <Eye className="h-4 w-4" /> Deck {nextDeck}
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-xl border border-line py-3">
      <div className={cn('font-mono text-2xl font-medium', className)}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
