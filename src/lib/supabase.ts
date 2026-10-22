import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MasteryStatus, UserWordProgress } from '@/types/vocab';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Returns a browser Supabase client, or null when env vars are missing (local-first mode). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === 'undefined') return null;
  if (!client) {
    try {
      client = createClient(url!, anonKey!, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
    } catch {
      return null;
    }
  }
  return client;
}

interface ProgressRow {
  user_id: string;
  word_id: number;
  status: MasteryStatus;
  is_starred: boolean;
  correct_streak: number;
  correct_count: number;
  incorrect_count: number;
  last_reviewed_at: string | null;
  client_updated_at: string | null;
}

const toRow = (userId: string, p: UserWordProgress): ProgressRow => ({
  user_id: userId,
  word_id: p.wordId,
  status: p.status,
  is_starred: p.isStarred,
  correct_streak: p.correctStreak,
  correct_count: p.correctCount,
  incorrect_count: p.incorrectCount,
  last_reviewed_at: p.lastReviewedAt,
  client_updated_at: p.updatedAt ?? p.lastReviewedAt,
});

const fromRow = (r: ProgressRow): UserWordProgress => ({
  wordId: r.word_id,
  status: r.status,
  isStarred: r.is_starred,
  correctStreak: r.correct_streak,
  correctCount: r.correct_count,
  incorrectCount: r.incorrect_count,
  lastReviewedAt: r.last_reviewed_at,
  updatedAt: r.client_updated_at,
});

export async function fetchRemoteProgress(userId: string): Promise<UserWordProgress[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const all: UserWordProgress[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from('user_word_progress')
      .select(
        'user_id, word_id, status, is_starred, correct_streak, correct_count, incorrect_count, last_reviewed_at, client_updated_at',
      )
      .eq('user_id', userId)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    all.push(...(data as ProgressRow[]).map(fromRow));
    if (!data || data.length < pageSize) break;
  }
  return all;
}

export async function pushProgress(userId: string, records: UserWordProgress[]): Promise<void> {
  const sb = getSupabase();
  if (!sb || records.length === 0) return;
  for (let i = 0; i < records.length; i += 500) {
    const chunk = records.slice(i, i + 500).map((p) => toRow(userId, p));
    const { error } = await sb.from('user_word_progress').upsert(chunk, { onConflict: 'user_id,word_id' });
    if (error) throw error;
  }
}

export interface RemoteStats {
  dailyStreak: number;
  lastStudyDate: string | null;
  totalQuizzesTaken: number;
  lastActiveDeck: number;
}

export async function fetchRemoteStats(userId: string): Promise<RemoteStats | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('user_stats')
    .select('daily_streak, last_study_date, total_quizzes_taken, last_active_deck')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    dailyStreak: data.daily_streak,
    lastStudyDate: data.last_study_date,
    totalQuizzesTaken: data.total_quizzes_taken,
    lastActiveDeck: data.last_active_deck,
  };
}

export async function pushStats(userId: string, stats: RemoteStats): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('user_stats').upsert(
    {
      user_id: userId,
      daily_streak: stats.dailyStreak,
      last_study_date: stats.lastStudyDate,
      total_quizzes_taken: stats.totalQuizzesTaken,
      last_active_deck: stats.lastActiveDeck,
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
