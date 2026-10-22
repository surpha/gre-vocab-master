import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10', className)}
    >
      <div
        className={cn('h-full rounded-full bg-zinc-900 transition-[width] duration-500 ease-out dark:bg-white', barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export interface Segment {
  value: number;
  className: string;
  label: string;
}

export function SegmentedProgress({ segments, total, className }: { segments: Segment[]; total: number; className?: string }) {
  return (
    <div className={cn('flex h-2 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10', className)}>
      {segments.map((s) =>
        s.value > 0 ? (
          <div
            key={s.label}
            title={`${s.label}: ${s.value}`}
            className={cn('h-full transition-[width] duration-700 ease-out', s.className)}
            style={{ width: `${(s.value / Math.max(total, 1)) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  );
}
