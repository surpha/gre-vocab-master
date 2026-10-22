import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LearnView } from '@/components/learn/LearnView';

export const metadata: Metadata = { title: 'Learn' };

export default function LearnPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LearnView />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-zinc-200/60 dark:bg-white/5" />
      <div className="mx-auto mt-8 h-[26rem] max-w-3xl animate-pulse rounded-3xl border border-line bg-surface" />
    </div>
  );
}
