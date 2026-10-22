import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'outline' | 'positive' | 'negative' | 'neutral' | 'violet' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-zinc-900 text-white border-transparent dark:bg-white dark:text-zinc-900',
  outline: 'border-line text-zinc-700 dark:text-zinc-300',
  positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  negative: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  neutral: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20',
  muted: 'bg-zinc-500/[0.07] text-zinc-600 dark:text-zinc-400 border-zinc-500/10',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'outline', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-zinc-100 px-1 font-mono text-[10px] font-medium text-zinc-500 dark:bg-white/5 dark:text-zinc-400',
        className,
      )}
      {...props}
    />
  );
}
