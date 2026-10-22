'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { BookOpen, Flame, LayoutGrid, Library, Search, UserRound, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Kbd } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { TOTAL_WORDS } from '@/lib/vocab';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { effectiveStreak, useVocabStore } from '@/store/useVocabStore';

const NAV = [
  { href: '/', label: 'Decks', icon: LayoutGrid },
  { href: '/learn', label: 'Learn', icon: BookOpen },
  { href: '/quiz', label: 'Quiz', icon: Zap },
  { href: '/words', label: 'Word Bank', icon: Library },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const setAccountOpen = useUIStore((s) => s.setAccountOpen);
  const userEmail = useUIStore((s) => s.userEmail);
  const progress = useVocabStore((s) => s.progress);
  const dailyStreak = useVocabStore((s) => s.dailyStreak);
  const lastStudyDate = useVocabStore((s) => s.lastStudyDate);
  const hasHydrated = useVocabStore((s) => s.hasHydrated);

  const mastered = useMemo(() => Object.values(progress).filter((p) => p.status === 'mastered').length, [progress]);
  const streak = hasHydrated ? effectiveStreak(dailyStreak, lastStudyDate) : 0;
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-background/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="hidden font-serif text-xl tracking-tight sm:inline">Lexicon</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-0.5 md:flex">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive(href)
                    ? 'bg-zinc-900/[0.06] text-zinc-900 dark:bg-white/10 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-9 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm text-zinc-400 transition hover:border-zinc-300 sm:max-w-xs dark:hover:border-white/20"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">
              Search {TOTAL_WORDS.toLocaleString()} words<span className="hidden lg:inline"> or meanings</span>…
            </span>
            <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <Tooltip content="Daily streak" side="bottom">
              <span
                className={cn(
                  'hidden items-center gap-1 rounded-lg px-2 py-1 font-mono text-xs font-medium sm:inline-flex',
                  streak > 0 ? 'text-orange-500' : 'text-zinc-400',
                )}
              >
                <Flame className={cn('h-3.5 w-3.5', streak > 0 && 'fill-orange-500/20')} />
                {streak}
              </span>
            </Tooltip>
            <Tooltip content="Words mastered" side="bottom">
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-medium text-emerald-600 lg:inline-flex dark:text-emerald-400">
                {hasHydrated ? mastered.toLocaleString() : 0} / {TOTAL_WORDS.toLocaleString()}
              </span>
            </Tooltip>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label="Account and data"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <UserRound className="h-4 w-4" />
              {userEmail && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            </button>
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              isActive(href) ? 'text-zinc-900 dark:text-white' : 'text-zinc-400',
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
