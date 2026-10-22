import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import type { Connotation, DeckMeta, VocabWord } from '../src/types/vocab';

const PRIMARY_SOURCE = path.resolve('data/final imp GRE vocab.xlsx');
const EXTRA_SOURCES_DIR = path.resolve('data/word-banks');
const ID_REGISTRY = path.resolve('data/word-ids.json');
const OUT_DIR = path.resolve('src/data');
const DECK_SIZE = 50;
const REQUIRED = ['Group', 'Word', 'Connotation', 'Definition', 'Example Sentence'] as const;

interface Row {
  Group: string;
  Word: string;
  Connotation: string;
  Definition: string;
  'Example Sentence': string;
}

interface SourcedRow extends Row {
  source: string;
  line: number;
}

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const keyOf = (word: string) => word.trim().toLowerCase();

function parseDefinition(raw: string): { partOfSpeech: string | null; definition: string } {
  const text = raw.trim();
  const match = text.match(/^\(([^)]+)\)\s*([\s\S]*)$/);
  if (match) return { partOfSpeech: match[1].trim(), definition: capitalize(match[2].trim()) };
  return { partOfSpeech: null, definition: capitalize(text) };
}

function toConnotation(value: string, where: string): Connotation {
  const v = capitalize(value.trim().toLowerCase());
  if (v === 'Positive' || v === 'Negative' || v === 'Neutral') return v;
  throw new Error(`${where}: invalid Connotation "${value}" (expected Positive, Negative, or Neutral)`);
}

function readSource(file: string): SourcedRow[] {
  const workbook = XLSX.readFile(file);
  const sheetName = workbook.SheetNames.includes('Vocabulary') ? 'Vocabulary' : workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
  const name = path.relative(process.cwd(), file);
  return rows.map((raw, i) => {
    const line = i + 2; // header is row 1
    const row = Object.fromEntries(REQUIRED.map((col) => [col, String(raw[col] ?? '').trim()])) as unknown as Row;
    const missing = REQUIRED.filter((col) => !row[col]);
    if (missing.length) throw new Error(`${name} row ${line}: missing ${missing.join(', ')}`);
    return { ...row, source: name, line };
  });
}

// 1. Read the primary sheet plus any extra word banks (data/word-banks/*.xlsx|*.csv), in alphabetical order.
const extraFiles = existsSync(EXTRA_SOURCES_DIR)
  ? readdirSync(EXTRA_SOURCES_DIR)
      .filter((f) => /\.(xlsx|csv)$/i.test(f) && !f.startsWith('~$') && !f.startsWith('_'))
      .sort()
      .map((f) => path.join(EXTRA_SOURCES_DIR, f))
  : [];

const seen = new Map<string, SourcedRow>();
let duplicates = 0;
for (const file of [PRIMARY_SOURCE, ...extraFiles]) {
  for (const row of readSource(file)) {
    const key = keyOf(row.Word);
    const prior = seen.get(key);
    if (prior) {
      duplicates++;
      console.warn(`  ⚠ duplicate "${row.Word}" in ${row.source} row ${row.line} (kept ${prior.source} row ${prior.line})`);
      continue;
    }
    seen.set(key, row);
  }
}

// 2. Group by theme, largest clusters first, so synonym clusters land in the earliest decks.
const groups = new Map<string, SourcedRow[]>();
for (const row of seen.values()) {
  if (!groups.has(row.Group)) groups.set(row.Group, []);
  groups.get(row.Group)!.push(row);
}
const orderedRows = [...groups.entries()]
  .sort(([a, ra], [b, rb]) => rb.length - ra.length || a.localeCompare(b))
  .flatMap(([, rows]) => rows);

// 3. Stable IDs: existing words keep their ID forever; new words get the next free number.
//    User progress is keyed by these IDs, so never edit or delete entries in data/word-ids.json.
const registry: Record<string, number> = existsSync(ID_REGISTRY) ? JSON.parse(readFileSync(ID_REGISTRY, 'utf8')) : {};
let nextId = Math.max(0, ...Object.values(registry)) + 1;
let newIds = 0;
for (const row of orderedRows) {
  const key = keyOf(row.Word);
  if (registry[key] === undefined) {
    registry[key] = nextId++;
    newIds++;
  }
}

// 4. Build words and decks.
const words: VocabWord[] = orderedRows.map((row, index) => {
  const word = row.Word;
  const { partOfSpeech, definition } = parseDefinition(row.Definition);
  return {
    id: registry[keyOf(word)],
    word,
    deckId: Math.ceil((index + 1) / DECK_SIZE),
    theme: row.Group,
    connotation: toConnotation(row.Connotation, `${row.source} row ${row.line}`),
    partOfSpeech,
    definition,
    exampleSentence: row['Example Sentence'],
    synonyms: groups.get(row.Group)!.map((r) => r.Word).filter((w) => w !== word),
  };
});

const deckCount = Math.ceil(words.length / DECK_SIZE);
const decks: DeckMeta[] = Array.from({ length: deckCount }, (_, i) => {
  const deckId = i + 1;
  const deckWords = words.filter((w) => w.deckId === deckId);
  const themeCounts = new Map<string, number>();
  for (const w of deckWords) themeCounts.set(w.theme, (themeCounts.get(w.theme) ?? 0) + 1);
  const topThemes = [...themeCounts.entries()]
    .sort(([a, ca], [b, cb]) => cb - ca || a.localeCompare(b))
    .slice(0, 3)
    .map(([t]) => t);
  return { deckId, title: `Deck ${deckId}`, wordCount: deckWords.length, topThemes };
});

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'vocab.json'), JSON.stringify(words));
writeFileSync(path.join(OUT_DIR, 'decks.json'), JSON.stringify(decks, null, 2));
const sortedRegistry = Object.fromEntries(Object.entries(registry).sort(([, a], [, b]) => a - b));
writeFileSync(ID_REGISTRY, JSON.stringify(sortedRegistry, null, 2) + '\n');

console.log(`✓ ${words.length} words from ${groups.size} groups → ${decks.length} decks`);
console.log(`  Sources: ${[PRIMARY_SOURCE, ...extraFiles].map((f) => path.relative(process.cwd(), f)).join(', ')}`);
console.log(`  New IDs assigned: ${newIds} · duplicates skipped: ${duplicates}`);
console.log(`  Last deck: ${decks.at(-1)?.wordCount} words · with part of speech: ${words.filter((w) => w.partOfSpeech).length}`);
