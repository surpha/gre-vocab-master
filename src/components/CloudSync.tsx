'use client';

import { useEffect, useRef } from 'react';
import {
  fetchRemoteProgress,
  fetchRemoteStats,
  getSupabase,
  isSupabaseConfigured,
  pushProgress,
  pushStats,
} from '@/lib/supabase';
import { useUIStore } from '@/store/useUIStore';
import { useVocabStore } from '@/store/useVocabStore';
import type { UserWordProgress } from '@/types/vocab';

const PUSH_DEBOUNCE_MS = 1500;

/** Background sync between the local Zustand store and Supabase. No-op without env vars. */
export function CloudSync() {
  const hasHydrated = useVocabStore((s) => s.hasHydrated);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !hasHydrated) return;
    const sb = getSupabase();
    if (!sb) return;
    const { setUserEmail, setSyncState } = useUIStore.getState();
    setSyncState('idle');

    let unsubStore: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const dirty = new Set<number>();
    let statsDirty = false;

    const flush = async () => {
      const userId = userIdRef.current;
      if (!userId) return;
      const { progress, dailyStreak, lastStudyDate, totalQuizzesTaken, lastActiveDeck } = useVocabStore.getState();
      const records = [...dirty].map((id) => progress[id]).filter(Boolean) as UserWordProgress[];
      dirty.clear();
      const sendStats = statsDirty;
      statsDirty = false;
      try {
        setSyncState('syncing');
        await pushProgress(userId, records);
        if (sendStats) await pushStats(userId, { dailyStreak, lastStudyDate, totalQuizzesTaken, lastActiveDeck });
        setSyncState('synced');
      } catch {
        records.forEach((r) => dirty.add(r.wordId));
        statsDirty = statsDirty || sendStats;
        setSyncState('error');
      }
    };

    const startSession = async (userId: string) => {
      userIdRef.current = userId;
      setSyncState('syncing');
      try {
        const [remote, stats] = await Promise.all([fetchRemoteProgress(userId), fetchRemoteStats(userId)]);
        useVocabStore.getState().mergeProgress(remote);
        if (stats) {
          useVocabStore.setState((s) => ({
            totalQuizzesTaken: Math.max(s.totalQuizzesTaken, stats.totalQuizzesTaken),
            dailyStreak:
              (stats.lastStudyDate ?? '') > (s.lastStudyDate ?? '') ? stats.dailyStreak : s.dailyStreak,
            lastStudyDate:
              (stats.lastStudyDate ?? '') > (s.lastStudyDate ?? '') ? stats.lastStudyDate : s.lastStudyDate,
          }));
        }
        const merged = useVocabStore.getState();
        await pushProgress(userId, Object.values(merged.progress));
        await pushStats(userId, {
          dailyStreak: merged.dailyStreak,
          lastStudyDate: merged.lastStudyDate,
          totalQuizzesTaken: merged.totalQuizzesTaken,
          lastActiveDeck: merged.lastActiveDeck,
        });
        setSyncState('synced');
      } catch {
        setSyncState('error');
      }

      unsubStore?.();
      unsubStore = useVocabStore.subscribe((state, prev) => {
        if (state.progress !== prev.progress) {
          for (const [id, rec] of Object.entries(state.progress)) {
            if (prev.progress[Number(id)] !== rec) dirty.add(Number(id));
          }
        }
        if (
          state.dailyStreak !== prev.dailyStreak ||
          state.totalQuizzesTaken !== prev.totalQuizzesTaken ||
          state.lastActiveDeck !== prev.lastActiveDeck
        ) {
          statsDirty = true;
        }
        if (dirty.size || statsDirty) {
          if (timer) clearTimeout(timer);
          timer = setTimeout(flush, PUSH_DEBOUNCE_MS);
        }
      });
    };

    const endSession = () => {
      userIdRef.current = null;
      unsubStore?.();
      unsubStore = null;
      dirty.clear();
      statsDirty = false;
      if (timer) clearTimeout(timer);
      // Progress lives in the account now; clearing prevents it merging into the next user's account.
      useVocabStore.getState().clearLocalData();
      setUserEmail(null);
      setSyncState('idle');
    };

    sb.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (user && userIdRef.current !== user.id) {
        setUserEmail(user.email ?? 'Signed in');
        void startSession(user.id);
      }
    });

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      if (event === 'SIGNED_IN' && user && userIdRef.current !== user.id) {
        setUserEmail(user.email ?? 'Signed in');
        void startSession(user.id);
      } else if (event === 'SIGNED_OUT') {
        endSession();
      }
    });

    const onUnload = () => {
      if (dirty.size || statsDirty) void flush();
    };
    window.addEventListener('pagehide', onUnload);

    return () => {
      sub.subscription.unsubscribe();
      unsubStore?.();
      if (timer) clearTimeout(timer);
      window.removeEventListener('pagehide', onUnload);
    };
  }, [hasHydrated]);

  return null;
}
