'use client';

import { Star, Volume2 } from 'lucide-react';
import type { Connotation, MasteryStatus } from '@/types/vocab';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { speakWord } from '@/lib/speech';
import { splitOnWord } from '@/lib/vocab';

const CONNOTATION_META: Record<Connotation, { symbol: string; tone: 'positive' | 'negative' | 'neutral' }> = {
  Positive: { symbol: '+', tone: 'positive' },
  Negative: { symbol: '−', tone: 'negative' },
  Neutral: { symbol: '~', tone: 'neutral' },
};

export function ConnotationBadge({ connotation, className }: { connotation: Connotation; className?: string }) {
  const meta = CONNOTATION_META[connotation];
  return (
    <Badge tone={meta.tone} className={className}>
      <span className="font-mono">{meta.symbol}</span> {connotation}
    </Badge>
  );
}

export const STATUS_META: Record<MasteryStatus, { label: string; dot: string; badge: string; bar: string }> = {
  unseen: {
    label: 'Unseen',
    dot: 'bg-zinc-300 dark:bg-zinc-600',
    badge: 'bg-zinc-500/[0.07] text-zinc-500 border-zinc-500/15',
    bar: 'bg-zinc-300 dark:bg-zinc-700',
  },
  learning: {
    label: 'Still Learning',
    dot: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    bar: 'bg-rose-500',
  },
  reviewing: {
    label: 'Almost There',
    dot: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    bar: 'bg-amber-400',
  },
  mastered: {
    label: 'Mastered',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    bar: 'bg-emerald-500',
  },
};

export function StatusBadge({ status, className }: { status: MasteryStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn(meta.badge, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </Badge>
  );
}

export function PosBadge({ pos }: { pos: string | null }) {
  if (!pos) return null;
  return (
    <Badge tone="muted" className="font-mono text-[11px] italic">
      {pos}
    </Badge>
  );
}

export function ThemeTag({ theme, className }: { theme: string; className?: string }) {
  return (
    <Badge tone="violet" className={cn('max-w-full truncate', className)} title={theme}>
      {theme}
    </Badge>
  );
}

export function SpeakButton({ text, className, size = 'md' }: { text: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speakWord(text);
      }}
      aria-label={`Pronounce ${text}`}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10 dark:hover:text-white',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        className,
      )}
    >
      <Volume2 className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </button>
  );
}

export function StarButton({
  starred,
  onToggle,
  className,
}: {
  starred: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={starred}
      aria-label={starred ? 'Unstar word' : 'Star word'}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-zinc-100 dark:hover:bg-white/10',
        starred ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
        className,
      )}
    >
      <Star className={cn('h-4 w-4', starred && 'fill-current')} />
    </button>
  );
}

export function HighlightedSentence({ sentence, word, className }: { sentence: string; word: string; className?: string }) {
  return (
    <span className={className}>
      {splitOnWord(sentence, word).map((seg, i) =>
        seg.match ? (
          <strong
            key={i}
            className="font-semibold text-foreground underline decoration-violet-500/60 decoration-2 underline-offset-4"
          >
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </span>
  );
}
