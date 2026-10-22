export const LOGO_PATH = 'M18 14H32V17H28V46H38L41 39H44L43 50H18V47H22V17H18Z';
export const LOGO_DOT = { cx: 42, cy: 21, r: 3.5 };

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" className="fill-zinc-900 dark:fill-white" />
      <path d={LOGO_PATH} className="fill-white dark:fill-zinc-900" />
      <circle {...LOGO_DOT} className="fill-violet-500" />
    </svg>
  );
}
