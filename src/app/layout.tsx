import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Providers } from '@/components/Providers';
import { THEME_SCRIPT } from '@/lib/theme-script';
import './globals.css';

const serif = Instrument_Serif({ variable: '--font-instrument', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] });
const sans = Plus_Jakarta_Sans({ variable: '--font-jakarta', subsets: ['latin'] });
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: 'GRE Lexicon — Master 2,122 GRE Words', template: '%s · GRE Lexicon' },
  description:
    'A minimalist, keyboard-driven GRE vocabulary trainer: 43 themed decks, 3D flashcards, context-cloze quizzes, and connotation cues.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line pb-24 md:pb-0">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 text-xs text-zinc-500 sm:px-6">
            <span className="font-serif text-sm">GRE Lexicon</span>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
        </footer>
        <Providers />
      </body>
    </html>
  );
}
