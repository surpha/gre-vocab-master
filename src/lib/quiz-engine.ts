import type { VocabWord } from '@/types/vocab';
import { WORDS, findWordRegex } from '@/lib/vocab';
import { shuffle } from '@/lib/utils';

export type QuizFormat = 'cloze' | 'word-to-def' | 'def-to-word' | 'blitz';

export const QUIZ_FORMATS: { id: QuizFormat; title: string; description: string }[] = [
  { id: 'cloze', title: 'GRE Sentence Blank', description: 'Fill the blank in a real context sentence.' },
  { id: 'word-to-def', title: 'Word → Definition', description: 'Classic MCQ: pick the matching meaning.' },
  { id: 'def-to-word', title: 'Definition → Word', description: 'Reverse recall from meaning and theme.' },
  { id: 'blitz', title: '60-Second Blitz', description: 'Timed sprint with combo multipliers.' },
];

export type QuestionKind = Exclude<QuizFormat, 'blitz'>;

export interface QuizQuestion {
  key: string;
  kind: QuestionKind;
  target: VocabWord;
  options: VocabWord[];
  correctIndex: number;
  /** For cloze questions: sentence with the target word blanked out. */
  prompt?: string;
}

export const BLANK = '________';

export function blankSentence(word: VocabWord): string | null {
  const regex = findWordRegex(word.exampleSentence, word.word);
  if (!regex) return null;
  return word.exampleSentence.replace(regex, BLANK);
}

const normalizePos = (pos: string | null) => pos?.split(/[,\s]/)[0].replace(/\.$/, '').toLowerCase() ?? null;

/** Picks 3 distractors: never from the same theme, preferring the same part of speech. */
export function pickDistractors(target: VocabWord, pool: readonly VocabWord[] = WORDS, count = 3): VocabWord[] {
  const targetPos = normalizePos(target.partOfSpeech);
  const synonyms = new Set(target.synonyms.map((s) => s.toLowerCase()));
  const eligible = (w: VocabWord) =>
    w.id !== target.id &&
    w.theme !== target.theme &&
    !synonyms.has(w.word.toLowerCase()) &&
    w.word.toLowerCase() !== target.word.toLowerCase();

  const chosen: VocabWord[] = [];
  const used = new Set<number>();
  const take = (candidates: VocabWord[]) => {
    for (const c of shuffle(candidates)) {
      if (chosen.length >= count) return;
      if (used.has(c.id) || chosen.some((x) => x.theme === c.theme)) continue;
      chosen.push(c);
      used.add(c.id);
    }
  };

  const localPool = pool.filter(eligible);
  if (targetPos) take(localPool.filter((w) => normalizePos(w.partOfSpeech) === targetPos));
  if (chosen.length < count && targetPos) take(WORDS.filter((w) => eligible(w) && normalizePos(w.partOfSpeech) === targetPos));
  if (chosen.length < count) take(localPool);
  if (chosen.length < count) take(WORDS.filter(eligible));
  return chosen;
}

export function buildQuestion(target: VocabWord, kind: QuestionKind, pool: readonly VocabWord[]): QuizQuestion {
  let actualKind = kind;
  let prompt: string | undefined;
  if (kind === 'cloze') {
    const blanked = blankSentence(target);
    if (blanked) prompt = blanked;
    else actualKind = 'def-to-word';
  }
  const options = shuffle([target, ...pickDistractors(target, pool)]);
  return {
    key: `${target.id}-${Math.random().toString(36).slice(2, 8)}`,
    kind: actualKind,
    target,
    options,
    correctIndex: options.findIndex((o) => o.id === target.id),
    prompt,
  };
}

const RANDOM_KINDS: QuestionKind[] = ['cloze', 'word-to-def', 'def-to-word'];

export function buildQuestionForFormat(target: VocabWord, format: QuizFormat, pool: readonly VocabWord[]): QuizQuestion {
  const kind = format === 'blitz' ? RANDOM_KINDS[Math.floor(Math.random() * RANDOM_KINDS.length)] : format;
  return buildQuestion(target, kind, pool);
}

export function comboMultiplier(streak: number): number {
  if (streak >= 15) return 4;
  if (streak >= 10) return 3;
  if (streak >= 5) return 2;
  return 1;
}
