'use client';

import { useState } from 'react';
import { EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnotationBadge, STATUS_META, SpeakButton, StarButton } from '@/components/word-bits';
import { cn } from '@/lib/utils';
import { getStatus, useVocabStore } from '@/store/useVocabStore';
import { useUIStore } from '@/store/useUIStore';
import type { MasteryStatus, VocabWord } from '@/types/vocab';

const STATUSES: MasteryStatus[] = ['unseen', 'learning', 'reviewing', 'mastered'];

export function CramTable({ words }: { words: VocabWord[] }) {
  const progress = useVocabStore((s) => s.progress);
  const setWordStatus = useVocabStore((s) => s.setWordStatus);
  const toggleStar = useVocabStore((s) => s.toggleStar);
  const openWordDetail = useUIStore((s) => s.openWordDetail);
  const [hideDefs, setHideDefs] = useState(false);
  const [hideWords, setHideWords] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());

  const toggleReveal = (key: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const hiddenClass = (hidden: boolean, key: string) =>
    hidden && !revealed.has(key) ? 'blur-[6px] select-none hover:blur-none cursor-pointer transition' : 'transition';

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={hideWords ? 'primary' : 'outline'}
          onClick={() => {
            setHideWords((v) => !v);
            setRevealed(new Set());
          }}
        >
          <EyeOff className="h-3.5 w-3.5" /> Hide Words
        </Button>
        <Button
          size="sm"
          variant={hideDefs ? 'primary' : 'outline'}
          onClick={() => {
            setHideDefs((v) => !v);
            setRevealed(new Set());
          }}
        >
          <EyeOff className="h-3.5 w-3.5" /> Hide Definitions
        </Button>
        <span className="ml-auto font-mono text-xs text-zinc-400">{words.length} words · hover or tap to peek</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] tracking-wider text-zinc-500 uppercase">
                <th className="w-10 px-4 py-3 font-medium">#</th>
                <th className="w-52 px-4 py-3 font-medium">Word</th>
                <th className="px-4 py-3 font-medium">Definition</th>
                <th className="w-36 px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => {
                const status = getStatus(progress, w.id);
                return (
                  <tr key={w.id} className="border-b border-line align-top last:border-0 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => (hideWords && !revealed.has(`w${w.id}`) ? toggleReveal(`w${w.id}`) : openWordDetail(w.id))}
                          className={cn('text-left font-serif text-xl leading-tight', hiddenClass(hideWords, `w${w.id}`))}
                        >
                          {w.word}
                        </button>
                        <SpeakButton text={w.word} size="sm" />
                        <StarButton
                          starred={!!progress[w.id]?.isStarred}
                          onToggle={() => toggleStar(w.id)}
                          className="h-7 w-7"
                        />
                      </div>
                      <ConnotationBadge connotation={w.connotation} className="mt-1 scale-90 origin-left" />
                    </td>
                    <td className="px-4 py-3">
                      <div
                        role={hideDefs ? 'button' : undefined}
                        tabIndex={hideDefs ? 0 : undefined}
                        onClick={() => hideDefs && toggleReveal(`d${w.id}`)}
                        onKeyDown={(e) => hideDefs && e.key === 'Enter' && toggleReveal(`d${w.id}`)}
                        className={hiddenClass(hideDefs, `d${w.id}`)}
                      >
                        <p className="leading-snug">{w.definition}</p>
                        <p className="mt-1 text-xs text-zinc-500">{w.theme}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={(e) => setWordStatus(w.id, e.target.value as MasteryStatus)}
                        aria-label={`Status for ${w.word}`}
                        className={cn(
                          'w-full cursor-pointer appearance-none rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none',
                          STATUS_META[status].badge,
                        )}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
