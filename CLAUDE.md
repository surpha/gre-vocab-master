@AGENTS.md

# GRE Lexicon: Agent Guide

A local-first GRE vocabulary trainer with optional Supabase cloud sync. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before making non-trivial changes.

## Commands

```bash
npm run dev          # dev server (http://localhost:3000)
npm run build:data   # regenerate src/data/*.json from data/ (run after any word-list change)
npm run build        # production build; must pass before finishing any task
npx tsc --noEmit     # typecheck
npm run lint         # eslint
```

## Stack

- Next.js 16 App Router with `cacheComponents: true`. This is not Next 14/15: read `node_modules/next/dist/docs/` before using unfamiliar APIs.
- React 19, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no `tailwind.config`), Framer Motion, Zustand, lucide-react.
- Supabase (`@supabase/supabase-js`, browser client only, implicit auth flow).

## Hard rules

1. **Never change or delete entries in `data/word-ids.json`.** User progress (in localStorage and Supabase) is keyed by these IDs. New words get new IDs automatically from `scripts/build-vocab-data.ts`.
2. **Never edit `src/data/vocab.json` or `src/data/decks.json` by hand.** They are generated. Change the sources in `data/` and run `npm run build:data`.
3. **`useSearchParams()` must sit under a `<Suspense>` boundary** (see `src/app/learn/page.tsx` and `src/app/quiz/page.tsx`), or the static build fails.
4. **No `Math.random()`, `Date.now()`, or `localStorage` during render** of anything that can prerender. Use them only in effects, event handlers, or lazy `useState` initializers inside components that render after hydration (gated on `hasHydrated`).
5. **The Zustand store uses `skipHydration: true`.** It is rehydrated in `src/components/Providers.tsx`. UI that depends on progress should check `useVocabStore(s => s.hasHydrated)` to avoid hydration mismatches.
6. **Pages are kept alive with React `<Activity>`** (Cache Components), so navigating away hides a page instead of unmounting it. Effects are cleaned up while hidden and re-run when the page is shown again. Reset state with a `key` (see `QuizView`, `LearnSession`).
7. **Every progress mutation must set `updatedAt`.** Cross-device sync is last-write-wins on that field (`mergeProgress`).
8. **Supabase must stay optional.** If `NEXT_PUBLIC_SUPABASE_*` env vars are missing, `getSupabase()` returns `null` and the app must still work fully.
9. **Database changes go in `supabase/schema.sql`** and must be idempotent (`if not exists`, `drop policy if exists`, `add column if not exists`). Every table needs RLS restricted to `auth.uid()`.

## Conventions

- Path alias `@/*` → `src/*`. Client components start with `'use client'`; route `page.tsx` files stay as server components that render a client view.
- UI primitives live in `src/components/ui/`. Word-level display pieces (connotation and status badges, speak and star buttons, highlighted sentences) live in `src/components/word-bits.tsx`. Reuse them.
- Connotation colors: Positive = emerald, Negative = rose, Neutral = amber. Status colors: mastered = emerald, reviewing = amber, learning = rose, unseen = zinc.
- Fonts: `font-serif` (Instrument Serif) for headwords, `font-mono` (JetBrains Mono) for counters and `<Kbd>`, sans (Plus Jakarta) for everything else.
- Global keyboard handlers must ignore events when a `[role="dialog"]` is open or the target is a text input (`isTypingTarget`).
- Text inputs need `text-base` on mobile (`sm:text-sm` is fine); smaller sizes make iOS Safari zoom the page.

## Common tasks

- **Add words or a new word bank:** follow [docs/ADDING_WORDS.md](docs/ADDING_WORDS.md).
- **Deploy or configure auth:** follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
- **Pick up a new feature:** see [docs/ROADMAP.md](docs/ROADMAP.md). Each idea lists the files it touches; move it to Done when shipped.
- **New quiz format:** add it to `QuizFormat` and `QUIZ_FORMATS` in `src/lib/quiz-engine.ts`, handle it in `buildQuestionForFormat`, and render the prompt in `PromptHeader` (`src/components/quiz/QuizRunner.tsx`).
- **New synced field:** add it to `UserWordProgress`, the store, `toRow`/`fromRow` in `src/lib/supabase.ts`, and an idempotent `alter table` in `schema.sql`.
