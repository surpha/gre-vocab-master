'use client';

import { useEffect } from 'react';
import { AccountDialog } from '@/components/AccountDialog';
import { CloudSync } from '@/components/CloudSync';
import { CommandSearch } from '@/components/CommandSearch';
import { WordDetailModal } from '@/components/WordDetailModal';
import { useVocabStore } from '@/store/useVocabStore';

export function Providers() {
  useEffect(() => {
    void useVocabStore.persist.rehydrate();
  }, []);

  return (
    <>
      <CommandSearch />
      <WordDetailModal />
      <AccountDialog />
      <CloudSync />
    </>
  );
}
