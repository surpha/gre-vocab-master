export type Connotation = 'Positive' | 'Negative' | 'Neutral';
export type MasteryStatus = 'unseen' | 'learning' | 'reviewing' | 'mastered';

export interface VocabWord {
  id: number;
  word: string;
  deckId: number;
  theme: string;
  connotation: Connotation;
  partOfSpeech: string | null;
  definition: string;
  exampleSentence: string;
  synonyms: string[];
}

export interface DeckMeta {
  deckId: number;
  title: string;
  wordCount: number;
  topThemes: string[];
}

export interface UserWordProgress {
  wordId: number;
  status: MasteryStatus;
  isStarred: boolean;
  correctStreak: number;
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: string | null;
  /** Client timestamp of the last change of any kind; used for last-write-wins sync. */
  updatedAt?: string | null;
}
