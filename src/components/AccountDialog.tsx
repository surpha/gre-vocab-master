'use client';

import { useRef, useState } from 'react';
import { Cloud, CloudOff, Download, LogOut, Mail, Upload } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getSupabase, isSupabaseConfigured, pushProgress, pushStats } from '@/lib/supabase';
import { useUIStore } from '@/store/useUIStore';
import { useVocabStore } from '@/store/useVocabStore';

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function AccountDialog() {
  const open = useUIStore((s) => s.accountOpen);
  const setOpen = useUIStore((s) => s.setAccountOpen);
  const userEmail = useUIStore((s) => s.userEmail);
  const syncState = useUIStore((s) => s.syncState);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    setMessage(null);
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !email.trim()) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    setMessage(error ? { tone: 'error', text: error.message } : { tone: 'ok', text: 'Check your inbox for a sign-in link.' });
  };

  const signInWithGoogle = async () => {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setMessage({ tone: 'error', text: error.message });
  };

  const signOut = async () => {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      const { data } = await sb.auth.getUser();
      if (data.user) {
        const s = useVocabStore.getState();
        await pushProgress(data.user.id, Object.values(s.progress));
        await pushStats(data.user.id, {
          dailyStreak: s.dailyStreak,
          lastStudyDate: s.lastStudyDate,
          totalQuizzesTaken: s.totalQuizzesTaken,
          lastActiveDeck: s.lastActiveDeck,
        });
      }
    } catch {
      setBusy(false);
      setMessage({ tone: 'error', text: 'Could not save your latest progress. Check your connection and try again.' });
      return;
    }
    await sb.auth.signOut();
    setBusy(false);
    setMessage({ tone: 'ok', text: 'Signed out. Your progress is saved to your account.' });
  };

  const exportJson = () => {
    const json = useVocabStore.getState().exportProgressJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gre-lexicon-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ tone: 'error', text: 'File is too large.' });
      return;
    }
    const result = useVocabStore.getState().importProgressJson(await file.text());
    setMessage(
      result.ok
        ? { tone: 'ok', text: `Imported progress for ${result.count} words.` }
        : { tone: 'error', text: result.error },
    );
  };

  return (
    <Dialog open={open} onClose={close} label="Account and data" className="max-w-md">
      <div className="overflow-y-auto p-6">
        <h2 className="text-lg font-semibold tracking-tight">Account & Data</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Progress is saved instantly on this device. Sign in to sync across devices.
        </p>

        <section className="mt-6 rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            {isSupabaseConfigured ? <Cloud className="h-4 w-4 text-violet-500" /> : <CloudOff className="h-4 w-4 text-zinc-400" />}
            Cloud Sync
            {userEmail && (
              <span className="ml-auto font-mono text-[11px] text-zinc-500 uppercase">{syncState}</span>
            )}
          </div>
          {!isSupabaseConfigured && (
            <p className="mt-2 text-sm text-zinc-500">
              Running in local-first mode. Add Supabase keys to <code className="font-mono text-xs">.env.local</code> to
              enable sync.
            </p>
          )}
          {isSupabaseConfigured && userEmail && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="truncate text-sm text-zinc-600 dark:text-zinc-300">{userEmail}</span>
              <Button variant="outline" size="sm" onClick={signOut} disabled={busy}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          )}
          {isSupabaseConfigured && !userEmail && (
            <div className="mt-3 space-y-2">
              <Button variant="outline" className="w-full" onClick={signInWithGoogle}>
                Continue with Google
              </Button>
              <form onSubmit={sendMagicLink} className="flex gap-2">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-label="Email address"
                />
                <Button type="submit" disabled={busy}>
                  <Mail className="h-4 w-4" /> Link
                </Button>
              </form>
            </div>
          )}
        </section>

        <section className="mt-3 rounded-xl border border-line p-4">
          <p className="text-sm font-medium">Backup</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" size="sm" onClick={exportJson}>
              <Download className="h-3.5 w-3.5" /> Export JSON
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
                e.target.value = '';
              }}
            />
          </div>
        </section>

        {message && (
          <p className={message.tone === 'ok' ? 'mt-4 text-sm text-emerald-600' : 'mt-4 text-sm text-rose-600'}>
            {message.text}
          </p>
        )}
      </div>
    </Dialog>
  );
}
