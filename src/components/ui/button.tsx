import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'positive' | 'negative' | 'warning';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm',
  secondary:
    'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100',
  outline:
    'border border-line bg-surface text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5',
  positive:
    'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 hover:bg-emerald-500/20 dark:text-emerald-300',
  negative: 'bg-rose-500/10 text-rose-700 border border-rose-500/25 hover:bg-rose-500/20 dark:text-rose-300',
  warning: 'bg-amber-500/10 text-amber-700 border border-amber-500/25 hover:bg-amber-500/20 dark:text-amber-300',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-sm gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none',
        'focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:outline-none active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
