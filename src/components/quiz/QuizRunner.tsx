'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Flame, Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ConnotationBadge,
  HighlightedSentence,
  PosBadge,
  SpeakButton,
  ThemeTag,
} from '@/components/word-bits';
import { BLANK, buildQuestionForFormat, comboMultiplier, type QuizFormat, type QuizQuestion } from '@/lib/quiz-engine';
import { cn, isTypingTarget, shuffle } from '@/lib/utils';
import { useVocabStore } from '@/store/useVocabStore';
import type { VocabWord } from '@/types/vocab';
import type { QuizLength } from '@/components/quiz/QuizView';

const BLITZ_MS = 60_000;

export interface AnswerRecord {
  wordId: number;
  correct: boolean;
}

export interface QuizOutcome {
  answers: AnswerRecord[];
  bestStreak: number;
  points: number;
  format: QuizFormat;
}

export function QuizRunner({
  words,
  format,
  length,
  onFinish,
  onQuit,
}: {
  words: VocabWord[];
  format: QuizFormat;
  length: QuizLength;
  onFinish: (outcome: QuizOutcome) => void;
  onQuit: () => void;
}) {
  const recordQuizResult = useVocabStore((s) => s.recordQuizResult);
  const isBlitz = format === 'blitz';
  const total = isBlitz || length === 'endless' ? null : Math.min(length, words.length);

  const [order, setOrder] = useState(words);
  const [cursor, setCursor] = useState(0);
  const [question, setQuestion] = useState<QuizQuestion>(() => buildQuestionForFormat(words[0], format, words));
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [endAt] = useState(() => Date.now() + BLITZ_MS);
  const [now, setNow] = useState(() => Date.now());
  const finishedRef = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(
    (finalAnswers: AnswerRecord[], finalBest: number, finalPoints: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      onFinish({ answers: finalAnswers, bestStreak: finalBest, points: finalPoints, format });
    },
    [onFinish, format],
  );

  const next = useCallback(() => {
    if (finishedRef.current) return;
    if (total !== null && answers.length >= total) {
      finish(answers, bestStreak, points);
      return;
    }
    let nextOrder = order;
    let nextCursor = cursor + 1;
    if (nextCursor >= order.length) {
      nextOrder = shuffle(order);
      if (nextOrder.length > 1 && nextOrder[0].id === order[cursor].id) nextOrder.push(nextOrder.shift()!);
      nextCursor = 0;
      setOrder(nextOrder);
    }
    setCursor(nextCursor);
    setQuestion(buildQuestionForFormat(nextOrder[nextCursor], format, words));
    setSelected(null);
    setShowHint(false);
  }, [answers, bestStreak, cursor, finish, format, order, points, total, words]);

  const choose = useCallback(
    (i: number) => {
      if (selected !== null || finishedRef.current || i >= question.options.length) return;
      const correct = i === question.correctIndex;
      setSelected(i);
      recordQuizResult(question.target.id, correct);
      const newStreak = correct ? streak + 1 : 0;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      if (correct) setPoints((p) => p + 100 * comboMultiplier(newStreak));
      setAnswers((a) => [...a, { wordId: question.target.id, correct }]);
    },
    [question, recordQuizResult, selected, streak],
  );

  // Blitz auto-advance keeps the sprint moving.
  useEffect(() => {
    if (!isBlitz || selected === null) return;
    advanceTimer.current = setTimeout(next, selected === question.correctIndex ? 450 : 1100);
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [isBlitz, selected, question.correctIndex, next]);

  const latestRef = useRef({ answers, bestStreak, points });
  useEffect(() => {
    latestRef.current = { answers, bestStreak, points };
  }, [answers, bestStreak, points]);

  useEffect(() => {
    if (!isBlitz) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endAt) {
        clearInterval(id);
        const l = latestRef.current;
        finish(l.answers, l.bestStreak, l.points);
      }
    }, 200);
    return () => clearInterval(id);
  }, [isBlitz, endAt, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        choose(Number(e.key) - 1);
      } else if ((e.key === 'Enter' || e.key === ' ') && selected !== null) {
        e.preventDefault();
        if (e.target instanceof HTMLButtonElement) e.target.blur();
        next();
      } else if (e.key.toLowerCase() === 'h' && question.kind === 'word-to-def') {
        setShowHint((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choose, next, selected, question.kind]);

  const answered = selected !== null;
  const timeLeft = Math.max(0, endAt - now);
  const target = question.target;
  const showsWords = question.kind !== 'word-to-def';
  const multiplier = comboMultiplier(streak);
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (answers.length ? finish(answers, bestStreak, points) : onQuit())}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
        >
          <X className="h-3.5 w-3.5" /> {answers.length ? 'End' : 'Quit'}
        </button>
        {isBlitz ? (
          <Progress
            value={(timeLeft / BLITZ_MS) * 100}
            className="h-1.5"
            barClassName={cn('transition-none', timeLeft < 10_000 ? 'bg-rose-500' : 'bg-violet-500')}
          />
        ) : (
          <Progress
            value={total ? (answers.length / total) * 100 : 0}
            className={cn('h-1.5', !total && 'opacity-0')}
            barClassName="bg-violet-500 dark:bg-violet-400"
          />
        )}
        <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
          {isBlitz ? (
            <span className={cn('tabular-nums', timeLeft < 10_000 ? 'text-rose-500' : 'text-zinc-500')}>
              {Math.ceil(timeLeft / 1000)}s
            </span>
          ) : (
            <span className="text-zinc-500">
              {Math.min(answers.length + 1, total ?? Infinity)}
              {total ? `/${total}` : ''}
            </span>
          )}
          <span className={cn('inline-flex items-center gap-1', streak > 0 ? 'text-orange-500' : 'text-zinc-400')}>
            <Flame className="h-3.5 w-3.5" />
            {streak}
          </span>
          {isBlitz && (
            <span className="text-violet-600 dark:text-violet-400">
              {points.toLocaleString()}
              {multiplier > 1 && <span className="ml-1 rounded bg-violet-500/10 px-1">×{multiplier}</span>}
            </span>
          )}
          {!isBlitz && length === 'endless' && <span className="text-emerald-600">{correctCount}✓</span>}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
            <PromptHeader question={question} showHint={showHint} onHint={() => setShowHint(true)} />
          </div>

          <div className="mt-4 grid gap-2">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correctIndex;
              const isPicked = i === selected;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => choose(i)}
                  disabled={answered}
                  className={cn(
                    'group flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all',
                    !answered && 'border-line bg-surface hover:-translate-y-px hover:border-zinc-300 hover:shadow-sm dark:hover:border-white/20',
                    answered && isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                    answered && isPicked && !isCorrect && 'border-rose-500/50 bg-rose-500/10',
                    answered && !isCorrect && !isPicked && 'border-line bg-surface opacity-70',
                  )}
                >
                  <Kbd className="mt-0.5 shrink-0">{i + 1}</Kbd>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block', showsWords ? 'font-serif text-xl leading-tight' : 'text-[15px] leading-snug font-medium')}>
                      {showsWords ? opt.word : opt.definition}
                    </span>
                    {answered && !isBlitz && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-1 block truncate text-xs text-zinc-500"
                      >
                        {showsWords ? opt.definition : <span className="font-serif text-sm italic">{opt.word}</span>}
                      </motion.span>
                    )}
                  </span>
                  {answered && isCorrect && <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />}
                  {answered && isPicked && !isCorrect && <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
                </button>
              );
            })}
          </div>

          {answered && !isBlitz && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'mt-4 rounded-2xl border p-5',
                selected === question.correctIndex ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-rose-500/25 bg-rose-500/[0.04]',
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    selected === question.correctIndex ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                  )}
                >
                  {selected === question.correctIndex ? 'Correct' : 'Not quite'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-serif text-2xl">{target.word}</span>
                <SpeakButton text={target.word} size="sm" />
                <ConnotationBadge connotation={target.connotation} />
                <PosBadge pos={target.partOfSpeech} />
                <ThemeTag theme={target.theme} />
              </div>
              <p className="mt-3 font-medium">{target.definition}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 italic dark:text-zinc-300">
                “<HighlightedSentence sentence={target.exampleSentence} word={target.word} />”
              </p>
              <div className="mt-4 flex justify-end">
                <Button onClick={next}>
                  {total !== null && answers.length >= total ? 'See results' : 'Next'} <ArrowRight className="h-4 w-4" />
                  <Kbd className="border-white/20 bg-white/10 text-current dark:border-black/10 dark:bg-black/5">↵</Kbd>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PromptHeader({ question, showHint, onHint }: { question: QuizQuestion; showHint: boolean; onHint: () => void }) {
  const { target } = question;
  if (question.kind === 'cloze' && question.prompt) {
    const parts = question.prompt.split(BLANK);
    return (
      <>
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Complete the sentence</p>
        <p className="mt-4 font-serif text-2xl leading-snug sm:text-3xl">
          {parts.map((p, i) => (
            <span key={i}>
              {p}
              {i < parts.length - 1 && (
                <span className="mx-1 inline-block min-w-24 border-b-2 border-violet-500/70 align-baseline">&nbsp;</span>
              )}
            </span>
          ))}
        </p>
      </>
    );
  }
  if (question.kind === 'word-to-def') {
    return (
      <div className="text-center">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Choose the definition</p>
        <div className="mt-4 flex items-center justify-center gap-1">
          <h2 className="font-serif text-5xl tracking-tight sm:text-6xl">{target.word}</h2>
          <SpeakButton text={target.word} />
        </div>
        <div className="mt-4 flex h-7 items-center justify-center">
          {showHint ? (
            <ConnotationBadge connotation={target.connotation} />
          ) : (
            <button
              type="button"
              onClick={onHint}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-violet-500"
            >
              <Lightbulb className="h-3.5 w-3.5" /> Connotation hint <Kbd>H</Kbd>
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">Which word means…</p>
        <ThemeTag theme={target.theme} className="ml-auto" />
      </div>
      <p className="mt-4 text-2xl leading-snug font-medium sm:text-[1.7rem]">{target.definition}</p>
    </>
  );
}
