import type { Metadata } from 'next';
import { WordBank } from '@/components/words/WordBank';

export const metadata: Metadata = { title: 'Word Bank' };

export default function WordsPage() {
  return <WordBank />;
}
