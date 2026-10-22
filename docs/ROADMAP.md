# Roadmap: Upcoming Ideas

These are incremental features that build on the current app. Each one notes what it touches so work can start from here. When you finish one, move it to **Done** at the bottom.

**Suggested order:** 1 → 6/7/8 → 16.

## Learning effectiveness

### 1. Spaced repetition + Daily Review queue ⭐
- Give each word a next-review date (SM-2-style intervals) based on grades and quiz results.
- The dashboard CTA reads "Review N due words", which gives users a daily habit loop.
- **Touches:** `UserWordProgress` (`dueAt`, `interval`, `ease`), store mutations (`setWordStatus`, `recordQuizResult`), a new `due` pool in `src/lib/pools.ts`, `toRow`/`fromRow`, and `alter table … add column if not exists due_at timestamptz` in `schema.sql`.

### 2. Mistake insights
- Record which wrong option the user chose, then surface pairs like "you confuse *laconic* with *loquacious*".
- Turn the pairs into side-by-side contrast cards (reuse `SynonymCompare` in `FlashcardSession.tsx`).
- **Touches:** a new `confusions` record (local + synced table), `choose()` in `QuizRunner.tsx`.

### 3. GRE-style question formats
- **Sentence Equivalence:** pick 2 of 6 options that both fit. Uses the existing synonym clusters (`theme`).
- **Text Completion:** 2 or 3 blanks.
- **Touches:** `QuizFormat` / `QUIZ_FORMATS` / `buildQuestionForFormat` in `src/lib/quiz-engine.ts`, `PromptHeader` and option rendering in `QuizRunner.tsx` (multi-select).

### 4. Typed recall mode
- Show the definition; the user types the word. Spelling is forgiving (Levenshtein ≤ 1–2).
- **Touches:** a new quiz format and a text input (remember `text-base` on mobile).

### 5. Connotation drill
- A rapid game: is the word Positive, Negative, or Neutral? Keys 1/2/3 or swipe.
- **Touches:** a new quiz format using `word.connotation`.

## Game and motivation

### 6. XP and levels ⭐
- Points for grading cards and answering questions; titles such as Novice → Scholar → Lexicographer.
- **Touches:** store (`xp`), the Navbar pill, and `user_stats.xp` in `schema.sql`.

### 7. Daily goal + streak freeze ⭐
- A configurable goal (e.g. 20 words/day) with a progress ring; one missed day per week is forgiven.
- **Touches:** `nextStreak` / `effectiveStreak` in `useVocabStore.ts`, plus new `user_stats` columns.

### 8. Achievements ⭐
- Examples: "First deck mastered", "10-day streak", "Perfect Blitz", "100 words mastered".
- **Touches:** a pure `evaluateAchievements(state)` function, a toast UI, and a synced `achievements` list.

### 9. Weekly leaderboard (opt-in)
- **Touches:** a `profiles` table (display name, opt-in flag) with RLS; a leaderboard view or RPC exposing only opted-in display names and weekly XP.

### 10. Shareable result cards
- After a quiz: "I scored 92% on Deck 7 🔥". Generate an OG image with `next/og` `ImageResponse`.
- **Touches:** a new `/share` route or `opengraph-image.tsx`, plus a share button in `QuizResults.tsx`.

## Study experience

### 11. Swipe gestures on flashcards
- Left = Still Learning, right = Mastered, up = Almost There (Framer Motion `drag`).
- **Touches:** `FlashcardSession.tsx`.

### 12. Mnemonics and word roots
- Show roots (e.g. *loqu* = speak → loquacious, eloquent) and let users write their own memory hooks, synced per user.
- **Touches:** an optional `roots`/`mnemonic` column in sources, the data pipeline, and a `user_notes` table.

### 13. Audio for example sentences
- **Touches:** `speakWord` → `speakText`, plus a button on the card back and the word detail modal.

### 14. Smarter custom study sets
- Examples: "Negative words I've missed 2+ times", "Not reviewed in 14 days".
- **Touches:** new pool kinds in `src/lib/pools.ts` and `PoolSelect`.

### 15. Progress page
- An activity calendar heatmap, mastery over time, and accuracy by quiz format.
- **Touches:** a daily activity log (local + synced) and a new `/progress` route.

## Platform

### 16. Installable PWA + offline mode ⭐
- Install the app on iPad or phone; vocabulary is already bundled, so offline mostly works.
- **Touches:** `src/app/manifest.ts`, 192/512 icons (reuse `Logo`), and a service worker. Read the bundled Next docs (`02-guides/progressive-web-apps.md`).

### 17. Reminder emails or push notifications
- "Your 23 review words are ready."
- **Requires:** custom SMTP or Web Push, and a scheduled job (Supabase cron or a Vercel cron).

### 18. Delete account button
- Replaces "email us" in `/privacy`.
- **Touches:** a Supabase Edge Function or a server route using the service role key (server-only, never `NEXT_PUBLIC_`).

### 19. Analytics
- Vercel Web Analytics: `@vercel/analytics`, no cookies. Update `/privacy` accordingly.

## Content

### 20. Word bank selector
- Let users choose "Core 2,122" vs "Advanced" once more banks exist.
- **Touches:** a `bank` field on `VocabWord` set from the source file in `build-vocab-data.ts`, decks numbered per bank, and a bank filter. See [ADDING_WORDS.md](ADDING_WORDS.md).

### 21. "Report an issue" on a word
- Flag a wrong definition or a bad example.
- **Touches:** a `word_reports` table (insert-only RLS for authenticated users) and a button in `WordDetailModal`.

## Pending setup (not features)

- [ ] Replace the `you@example.com` contact email in `src/app/privacy/page.tsx`.
- [ ] Publish the Google OAuth app (Google Cloud → Audience → Publish).
- [ ] Configure custom SMTP in Supabase before launch (the built-in email sender is rate-limited).
- [ ] Optional: Apple sign-in (needs an Apple Developer account).

## Done

- Core app: 43 decks, flashcards, cram table, 4 quiz formats, word bank, ⌘K search.
- Supabase auth (email + Google) and cross-device sync; Vercel deployment.
- Stable word IDs and multi-file word banks.
- Logo, favicon, Apple touch icon, and privacy page.
