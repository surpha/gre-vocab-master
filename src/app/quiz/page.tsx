import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuizView } from '@/components/quiz/QuizView';

export const metadata: Metadata = { title: 'Quiz' };

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="h-[28rem] animate-pulse rounded-3xl border border-line bg-surface" />
        </div>
      }
    >
      <QuizView />
    </Suspense>
  );
}
