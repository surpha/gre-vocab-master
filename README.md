# GRE Lexicon

A minimalist, keyboard-driven GRE vocabulary trainer: 2,122 words in 43 themed decks, 3D flashcards, a cram table, four quiz formats, and connotation cues on every word.

Built with Next.js 16 (App Router), Tailwind CSS v4, Zustand, and Framer Motion. Progress is stored locally first, and you can turn on Supabase sync if you want it.

## Local development

```bash
npm install
npm run build:data   # data/final imp GRE vocab.xlsx → src/data/vocab.json + decks.json
npm run dev          # http://localhost:3000
```

## Updating the word list

See [docs/ADDING_WORDS.md](docs/ADDING_WORDS.md). In short: drop a CSV/XLSX into `data/word-banks/`, run `npm run build:data`, and commit `data/` and `src/data/`. Never hand-edit `data/word-ids.json`.

## Deploying (Vercel + Supabase)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full step-by-step guide, including Google and magic-link auth. Without Supabase env vars, the app runs fully offline in local-first mode.

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): data pipeline, state model, sync protocol, database
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): Supabase + Vercel setup
- [docs/ADDING_WORDS.md](docs/ADDING_WORDS.md): adding words and new word banks
- [docs/ROADMAP.md](docs/ROADMAP.md): upcoming feature ideas and pending setup
- [CLAUDE.md](CLAUDE.md): rules and conventions for AI coding agents
