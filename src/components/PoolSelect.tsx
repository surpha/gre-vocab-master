'use client';

import { Select } from '@/components/ui/input';
import { DECKS } from '@/lib/vocab';
import type { PoolSpec } from '@/lib/pools';

export function poolValue(spec: PoolSpec): string {
  return spec.kind === 'deck' ? `deck:${spec.deckId}` : spec.kind;
}

export function valueToPool(value: string): PoolSpec | null {
  if (value.startsWith('deck:')) return { kind: 'deck', deckId: Number(value.slice(5)) };
  if (value === 'weak' || value === 'starred' || value === 'all') return { kind: value };
  return null;
}

export function PoolSelect({
  spec,
  onChange,
  includeAll,
  counts,
  className,
}: {
  spec: PoolSpec;
  onChange: (spec: PoolSpec) => void;
  includeAll?: boolean;
  counts: { weak: number; starred: number };
  className?: string;
}) {
  return (
    <Select
      value={poolValue(spec)}
      onChange={(e) => {
        const next = valueToPool(e.target.value);
        if (next) onChange(next);
      }}
      aria-label="Word pool"
      className={className}
    >
      {spec.kind === 'custom' && <option value="custom">{spec.ids.length} Selected Words</option>}
      <optgroup label="Smart pools">
        <option value="weak">Still Learning ({counts.weak})</option>
        <option value="starred">Starred Words ({counts.starred})</option>
        {includeAll && <option value="all">All 2,122 Words</option>}
      </optgroup>
      <optgroup label="Decks">
        {DECKS.map((d) => (
          <option key={d.deckId} value={`deck:${d.deckId}`}>
            Deck {d.deckId} · {d.topThemes[0]}
          </option>
        ))}
      </optgroup>
    </Select>
  );
}
