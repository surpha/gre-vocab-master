import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Privacy Policy' };

// TODO: replace with your real contact email before publishing.
const CONTACT_EMAIL = 'you@example.com';
const LAST_UPDATED = 'October 23, 2026';

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">Last updated {LAST_UPDATED}</p>
      <h1 className="mt-2 font-serif text-5xl tracking-tight">Privacy Policy</h1>

      <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
        <p>
          GRE Lexicon (“we”, “the app”) is a vocabulary study tool. This policy explains what data the app handles and
          why. The short version: we only store what is needed to save your study progress, and we never sell it.
        </p>

        <section>
          <h2>Using the app without an account</h2>
          <p>
            You can use every feature without signing in. Your progress (word statuses, starred words, streaks) is saved
            only in your browser’s local storage on your device and is never sent to us.
          </p>
        </section>

        <section>
          <h2>If you sign in</h2>
          <p>Signing in (with Google or an email link) lets you sync progress across devices. We then store:</p>
          <ul className="mt-2 space-y-1">
            <li>Your email address and an account ID, provided by Google or your email sign-in.</li>
            <li>Your study progress: each word’s mastery status, starred words, quiz correct/incorrect counts, and when you last reviewed it.</li>
            <li>Study stats: daily streak, number of quizzes taken, and the last deck you studied.</li>
          </ul>
          <p className="mt-2">
            With Google sign-in we request only your basic profile and email address. We do not access your contacts,
            files, Gmail, or any other Google data.
          </p>
        </section>

        <section>
          <h2>How we use it</h2>
          <p>
            Solely to sign you in and to save and sync your study progress. We do not use your data for advertising, we
            do not sell or share it with third parties, and the app contains no ads or third-party tracking.
          </p>
        </section>

        <section>
          <h2>Where it is stored</h2>
          <p>
            Account and progress data is stored with <a className="underline" href="https://supabase.com/privacy">Supabase</a>, our
            database and authentication provider. The website is hosted on{' '}
            <a className="underline" href="https://vercel.com/legal/privacy-policy">Vercel</a>. Access to your progress is
            restricted so that only you can read or change it.
          </p>
        </section>

        <section>
          <h2>Your choices</h2>
          <ul className="space-y-1">
            <li>Export your progress at any time from the account menu (Export JSON).</li>
            <li>Sign out at any time; this removes your progress from that device.</li>
            <li>
              To delete your account and all associated data, email{' '}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will delete it within 30 days.
            </li>
          </ul>
        </section>

        <section>
          <h2>Children</h2>
          <p>The app is intended for users aged 13 and over and is not directed at children under 13.</p>
        </section>

        <section>
          <h2>Changes</h2>
          <p>If this policy changes, we will update the date above.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions? Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </section>

        <p>
          <Link href="/" className="text-violet-600 hover:underline dark:text-violet-400">
            ← Back to GRE Lexicon
          </Link>
        </p>
      </div>
    </article>
  );
}
