'use client';

import { BookOpen, Zap } from 'lucide-react';
import Link from 'next/link';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ConnotationBadge,
  HighlightedSentence,
  PosBadge,
  SpeakButton,
  StarButton,
  StatusBadge,
  ThemeTag,
} from '@/components/word-bits';
import { WORD_BY_ID, WORD_BY_TEXT } from '@/lib/vocab';
import { useUIStore } from '@/store/useUIStore';
import { getStatus, useVocabStore } from '@/store/useVocabStore';

export function WordDetailModal() {
  const wordId = useUIStore((s) => s.detailWordId);
  const close = useUIStore((s) => s.closeWordDetail);
  const open = useUIStore((s) => s.openWordDetail);
  const progress = useVocabStore((s) => s.progress);
  const toggleStar = useVocabStore((s) => s.toggleStar);
  const word = wordId != null ? WORD_BY_ID.get(wordId) : undefined;

  return (
    <Dialog open={!!word} onClose={close} label={word ? `Details for ${word.word}` : 'Word details'} className="max-w-xl">
      {word && (
        <div className="overflow-y-auto p-6 sm:p-8">
          <div className="flex items-center gap-2 pr-8 text-xs text-zinc-500">
            <Badge tone="muted" className="font-mono">
              Deck {word.deckId}
            </Badge>
            <StatusBadge status={getStatus(progress, word.id)} />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <h2 className="font-serif text-5xl leading-none tracking-tight">{word.word}</h2>
            <SpeakButton text={word.word} />
            <StarButton starred={!!progress[word.id]?.isStarred} onToggle={() => toggleStar(word.id)} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <ConnotationBadge connotation={word.connotation} />
            <PosBadge pos={word.partOfSpeech} />
            <ThemeTag theme={word.theme} />
          </div>
          <p className="mt-5 text-lg leading-relaxed font-medium">{word.definition}</p>
          <blockquote className="mt-4 rounded-xl border-l-2 border-violet-500/60 bg-violet-500/[0.04] px-4 py-3 text-[15px] leading-relaxed text-zinc-600 italic dark:text-zinc-300">
            “<HighlightedSentence sentence={word.exampleSentence} word={word.word} />”
          </blockquote>

          {word.synonyms.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Related in “{word.theme}” · {word.synonyms.length}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {word.synonyms.map((syn) => {
                  const target = WORD_BY_TEXT.get(syn.toLowerCase());
                  return (
                    <button
                      key={syn}
                      type="button"
                      onClick={() => target && open(target.id)}
                      className="rounded-full border border-line px-3 py-1 text-sm transition hover:border-violet-500/40 hover:bg-violet-500/5"
                    >
                      {syn}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-wrap gap-2 border-t border-line pt-5">
            <Link
              href={`/learn?deck=${word.deckId}`}
              onClick={close}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
            >
              <BookOpen className="h-4 w-4" /> Learn Deck {word.deckId}
            </Link>
            <Link
              href={`/quiz?deck=${word.deckId}`}
              onClick={close}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium transition hover:bg-zinc-50 dark:hover:bg-white/5"
            >
              <Zap className="h-4 w-4" /> Quiz Deck {word.deckId}
            </Link>
          </div>
        </div>
      )}
    </Dialog>
  );
}
