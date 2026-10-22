# Adding Words and Word Banks

The app's vocabulary is generated at build time from spreadsheet and CSV files in `data/`. Follow this process to add new words, including lists collected from the web.

## TL;DR

```bash
# 1. Drop a new file into data/word-banks/ (copy _template.csv)
# 2. Rebuild the data and verify
npm run build:data
npm run build
# 3. Commit the source file AND the generated files
git add data/ src/data/ && git commit -m "Add <name> word bank"
```

## File format

Each word bank is a `.xlsx` (sheet `Vocabulary`, or else the first sheet) or `.csv` file with **exactly these headers**:

| Column | Required | Rules |
| --- | --- | --- |
| `Group` | ✓ | Semantic cluster, e.g. `Deceptive / Dishonest`. **Reuse existing group names** where they fit, so new words link up as synonyms and never appear as wrong options for each other. |
| `Word` | ✓ | The headword. Case-insensitive duplicates are skipped (the first file wins). |
| `Connotation` | ✓ | `Positive`, `Negative`, or `Neutral` (any letter case). |
| `Definition` | ✓ | Optionally starts with a part-of-speech tag: `(adj.) …`, `(n., formal) …`, `(v.) …`. The tag improves distractor quality. |
| `Example Sentence` | ✓ | Must contain the word or an inflected form (`bilk` → `bilked`), or cloze questions fall back to definition questions. |

See [`data/word-banks/_template.csv`](../data/word-banks/_template.csv). Files starting with `_` or `~$` are ignored.

### Processing order

1. `data/final imp GRE vocab.xlsx` (primary)
2. `data/word-banks/*` in alphabetical order. Prefix files to control priority, e.g. `01-barrons.csv`, `02-magoosh-extra.csv`.

## Stable IDs: the one rule that matters

`data/word-ids.json` maps every word (lowercased) to a permanent numeric ID. User progress in browsers and in Supabase is stored by that ID.

- New words automatically get the next free ID.
- **Never** hand-edit, renumber, or delete entries, and **never** delete the file. Doing so would attach users' progress to the wrong words.
- Removing a word from a source is safe. Its ID stays reserved and its progress row is simply ignored.
- Renaming a word (e.g. fixing a typo) creates a new ID. If the typo'd version has already shipped, add the new spelling as a key in `word-ids.json` with the **same ID number** as the old spelling before you rebuild.
- Deck numbers are positional and may shift when words are added. Users' progress follows the words, not the decks.

## Collecting words from the web

When gathering lists from the internet (scraping or manual collection):

1. **Respect copyright and terms of service.** Word lists themselves are generally fine to compile. Definitions and example sentences from commercial dictionaries or prep books usually are **not** free to copy. Write your own definitions and sentences, or use openly licensed sources such as Wiktionary (CC BY-SA, attribution required) or WordNet. Check `robots.txt` and the site's terms before scraping.
2. **Normalize to the schema above.** A small script that outputs CSV works well. Keep raw scraped data outside `data/word-banks/`, e.g. in `data/raw/` (add it to `.gitignore` if it's large or unlicensed).
3. **Fill the gaps.** Most sources lack `Group` and `Connotation`. Assign them deliberately: match new words to existing groups (you can browse them in `src/data/vocab.json` or the app's Word Bank), and create new groups only when nothing fits.
4. **Spot-check.** Read a sample of rows. Bad definitions are worse than missing words.

### Prompt for an AI agent to prepare a new bank

> Read `docs/ADDING_WORDS.md` and `src/data/vocab.json`. Convert `data/raw/<file>` into `data/word-banks/<NN-name>.csv` with headers `Group,Word,Connotation,Definition,Example Sentence`. Skip words already in `vocab.json`. Assign each word to an existing `theme` where the meaning genuinely matches; otherwise create a concise new group name in the same style. Write original definitions (prefixed with a part-of-speech tag) and original example sentences that contain the word. Then run `npm run build:data` and `npm run build`, and report the counts and any warnings. Do not modify `data/word-ids.json` by hand.

## Verifying

`npm run build:data` prints:

```
✓ 2250 words from 1301 groups → 45 decks
  Sources: data/final imp GRE vocab.xlsx, data/word-banks/01-extra.csv
  New IDs assigned: 128 · duplicates skipped: 3
```

- **Errors** (missing column, bad connotation) include the file and row number. Fix the source and re-run.
- **Duplicate warnings** list which copy was kept.
- Then run `npm run build` and spot-check new words in the app (⌘K search).

## Want separate word banks in the UI?

Right now all sources merge into one pool of decks. If you later want users to pick a bank (e.g. "Core GRE" vs. "Advanced"), the natural extension is:

1. Add a `bank` field to `VocabWord` and set it from the source file name in `build-vocab-data.ts`.
2. Number decks within each bank and add a bank filter on the dashboard and in `PoolSelect`.

Stable IDs make this safe to add later without losing anyone's progress.
