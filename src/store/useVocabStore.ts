import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MasteryStatus, UserWordProgress } from '@/types/vocab';
import { WORD_BY_ID, getDeckWords } from '@/lib/vocab';
import { todayKey } from '@/lib/utils';

const STATUSES: MasteryStatus[] = ['unseen', 'learning', 'reviewing', 'mastered'];

export interface VocabState {
  progress: Record<number, UserWordProgress>;
  dailyStreak: number;
  lastStudyDate: string | null;
  totalQuizzesTaken: number;
  lastActiveDeck: number;
  hasHydrated: boolean;

  setWordStatus: (wordId: number, status: MasteryStatus) => void;
  recordQuizResult: (wordId: number, isCorrect: boolean) => void;
  toggleStar: (wordId: number) => void;
  resetDeckProgress: (deckId: number) => void;
  setLastActiveDeck: (deckId: number) => void;
  incrementQuizzesTaken: () => void;
  exportProgressJson: () => string;
  importProgressJson: (json: string) => { ok: true; count: number } | { ok: false; error: string };
  mergeProgress: (incoming: UserWordProgress[]) => void;
  clearLocalData: () => void;
}

export const emptyProgress = (wordId: number): UserWordProgress => ({
  wordId,
  status: 'unseen',
  isStarred: false,
  correctStreak: 0,
  correctCount: 0,
  incorrectCount: 0,
  lastReviewedAt: null,
  updatedAt: null,
});

function nextStreak(lastStudyDate: string | null, dailyStreak: number) {
  const today = todayKey();
  if (lastStudyDate === today) return { dailyStreak, lastStudyDate };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = lastStudyDate === todayKey(yesterday);
  return { dailyStreak: continued ? dailyStreak + 1 : 1, lastStudyDate: today };
}

function sanitizeProgress(raw: unknown): UserWordProgress | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<UserWordProgress>;
  const wordId = Number(r.wordId);
  if (!Number.isInteger(wordId) || !WORD_BY_ID.has(wordId)) return null;
  const toCount = (v: unknown) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : 0);
  const toDate = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null);
  return {
    wordId,
    status: STATUSES.includes(r.status as MasteryStatus) ? (r.status as MasteryStatus) : 'unseen',
    isStarred: Boolean(r.isStarred),
    correctStreak: toCount(r.correctStreak),
    correctCount: toCount(r.correctCount),
    incorrectCount: toCount(r.incorrectCount),
    lastReviewedAt: toDate(r.lastReviewedAt),
    updatedAt: toDate(r.updatedAt),
  };
}

const changedAt = (p: UserWordProgress | undefined) => {
  const t = p?.updatedAt ?? p?.lastReviewedAt;
  return t ? Date.parse(t) : 0;
};

export const useVocabStore = create<VocabState>()(
  persist(
    (set, get) => ({
      progress: {},
      dailyStreak: 0,
      lastStudyDate: null,
      totalQuizzesTaken: 0,
      lastActiveDeck: 1,
      hasHydrated: false,

      setWordStatus: (wordId, status) =>
        set((s) => {
          const prev = s.progress[wordId] ?? emptyProgress(wordId);
          const now = new Date().toISOString();
          return {
            ...nextStreak(s.lastStudyDate, s.dailyStreak),
            progress: {
              ...s.progress,
              [wordId]: {
                ...prev,
                status,
                correctStreak: status === 'learning' ? 0 : prev.correctStreak,
                lastReviewedAt: now,
                updatedAt: now,
              },
            },
          };
        }),

      recordQuizResult: (wordId, isCorrect) =>
        set((s) => {
          const prev = s.progress[wordId] ?? emptyProgress(wordId);
          const correctStreak = isCorrect ? prev.correctStreak + 1 : 0;
          const status: MasteryStatus = !isCorrect ? 'learning' : correctStreak >= 2 ? 'mastered' : 'reviewing';
          const now = new Date().toISOString();
          return {
            ...nextStreak(s.lastStudyDate, s.dailyStreak),
            progress: {
              ...s.progress,
              [wordId]: {
                ...prev,
                status,
                correctStreak,
                correctCount: prev.correctCount + (isCorrect ? 1 : 0),
                incorrectCount: prev.incorrectCount + (isCorrect ? 0 : 1),
                lastReviewedAt: now,
                updatedAt: now,
              },
            },
          };
        }),

      toggleStar: (wordId) =>
        set((s) => {
          const prev = s.progress[wordId] ?? emptyProgress(wordId);
          return {
            progress: {
              ...s.progress,
              [wordId]: { ...prev, isStarred: !prev.isStarred, updatedAt: new Date().toISOString() },
            },
          };
        }),

      resetDeckProgress: (deckId) =>
        set((s) => {
          const progress = { ...s.progress };
          const now = new Date().toISOString();
          for (const w of getDeckWords(deckId)) {
            const prev = progress[w.id];
            if (!prev) continue;
            progress[w.id] = { ...emptyProgress(w.id), isStarred: prev.isStarred, updatedAt: now };
          }
          return { progress };
        }),

      setLastActiveDeck: (deckId) => set({ lastActiveDeck: deckId }),

      incrementQuizzesTaken: () => set((s) => ({ totalQuizzesTaken: s.totalQuizzesTaken + 1 })),

      exportProgressJson: () => {
        const { progress, dailyStreak, lastStudyDate, totalQuizzesTaken, lastActiveDeck } = get();
        return JSON.stringify(
          {
            app: 'gre-lexicon',
            version: 1,
            exportedAt: new Date().toISOString(),
            dailyStreak,
            lastStudyDate,
            totalQuizzesTaken,
            lastActiveDeck,
            progress: Object.values(progress),
          },
          null,
          2,
        );
      },

      importProgressJson: (json) => {
        try {
          const data = JSON.parse(json) as Record<string, unknown>;
          const list = Array.isArray(data.progress)
            ? data.progress
            : data.progress && typeof data.progress === 'object'
              ? Object.values(data.progress)
              : null;
          if (!list) return { ok: false, error: 'No progress data found in file.' };
          const progress: Record<number, UserWordProgress> = {};
          for (const item of list) {
            const p = sanitizeProgress(item);
            if (p) progress[p.wordId] = p;
          }
          const num = (v: unknown, fallback: number) =>
            Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.floor(Number(v)) : fallback;
          set((s) => ({
            progress,
            dailyStreak: num(data.dailyStreak, s.dailyStreak),
            lastStudyDate: typeof data.lastStudyDate === 'string' ? data.lastStudyDate : s.lastStudyDate,
            totalQuizzesTaken: num(data.totalQuizzesTaken, s.totalQuizzesTaken),
            lastActiveDeck: num(data.lastActiveDeck, s.lastActiveDeck) || 1,
          }));
          return { ok: true, count: Object.keys(progress).length };
        } catch {
          return { ok: false, error: 'File is not valid JSON.' };
        }
      },

      mergeProgress: (incoming) =>
        set((s) => {
          const progress = { ...s.progress };
          for (const item of incoming) {
            const remote = sanitizeProgress(item);
            if (!remote) continue;
            const local = progress[remote.wordId];
            if (!local || changedAt(remote) > changedAt(local)) progress[remote.wordId] = remote;
          }
          return { progress };
        }),

      clearLocalData: () =>
        set({ progress: {}, dailyStreak: 0, lastStudyDate: null, totalQuizzesTaken: 0, lastActiveDeck: 1 }),
    }),
    {
      name: 'gre-lexicon-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        progress: s.progress,
        dailyStreak: s.dailyStreak,
        lastStudyDate: s.lastStudyDate,
        totalQuizzesTaken: s.totalQuizzesTaken,
        lastActiveDeck: s.lastActiveDeck,
      }),
      onRehydrateStorage: () => () => {
        useVocabStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export function getStatus(progress: Record<number, UserWordProgress>, wordId: number): MasteryStatus {
  return progress[wordId]?.status ?? 'unseen';
}

/** Streak to display — collapses to 0 if the user missed more than a day. */
export function effectiveStreak(dailyStreak: number, lastStudyDate: string | null): number {
  if (!lastStudyDate) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return lastStudyDate === todayKey() || lastStudyDate === todayKey(yesterday) ? dailyStreak : 0;
}
