/**
 * Quiz translators over the CANONICAL cross-demo keyset (SPEC v3).
 *
 * Trivia strings live in their OWN i18n namespace `quiz` (no `quiz.`
 * prefix on keys) — the shared source of truth seeded into the live demo
 * project (seed v3 artifact 04a5d395). Rendering through these exact keys
 * means offline and live show identical strings and the feedback panel
 * (SDK namespace filter = "quiz") rates exactly these.
 *
 *  - `$tq("setup.heading")`  → `quiz:setup.heading`     (rateable content)
 *  - `$tfb("title")`         → `common:quizfb.title`    (widget chrome,
 *                              local-only — excluded by the ns=quiz filter)
 *
 * `tq` is a PURE translator now: registry membership is mount-tracked by
 * `declareRenderedKeys` (§0e), not a `tq` render-path side-effect.
 */
import { derived, type Readable } from "svelte/store";
import { t } from "$lib/i18n";

export type QuizT = (
  key: string,
  values?: Record<string, string | number>,
) => string;

/** Trivia strings are their own namespace (SPEC v3). */
export const QUIZ_NS = "quiz";

export const tq: Readable<QuizT> = derived(t, ($t) => {
  const fn: QuizT = (key, values) => $t(key, { ns: QUIZ_NS, values });
  return fn;
});

/** Feedback-widget chrome — local UI in `common`, not seeded / not rated
 *  (the ns=quiz panel filter excludes it). */
export const tfb: Readable<QuizT> = derived(t, ($t) => {
  const fn: QuizT = (key, values) => $t(`quizfb.${key}`, { values });
  return fn;
});
