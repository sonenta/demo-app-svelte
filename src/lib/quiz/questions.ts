/**
 * Canonical trivia structure — single source of truth is the cross-demo
 * quiz SPEC (kb topic=demo sub_topic=quiz-spec, owner demo-app). All four
 * demos render the IDENTICAL quiz.
 *
 * EXACTLY 10 questions, EXACTLY 5 options each, ids 1..10 in fixed order.
 * No copy here: every prompt/option is an i18n key in the `common`
 * namespace (`quiz.q.N.prompt`, `quiz.q.N.a.1..5`), resolved from the
 * shared seed via the Sonenta i18n binding — so offline and the live demo
 * project render the same strings and the feedback widget rates the real
 * seeded keys.
 *
 * The correct-answer map is authoritative from the SPEC and MUST live in
 * code (the seed holds only strings, never the answer key).
 */
export type OptionIndex = 1 | 2 | 3 | 4 | 5;

export const OPTIONS: readonly OptionIndex[] = [1, 2, 3, 4, 5] as const;
export const TOTAL_QUESTIONS = 10;

/** 1-based correct option per question — canonical SPEC (kb demo/quiz-spec). */
export const ANSWER_KEY: Readonly<Record<number, OptionIndex>> = {
  1: 1,
  2: 2,
  3: 3,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 3,
  9: 1,
  10: 3,
} as const;

export type Question = { n: number; correct: OptionIndex };

export const QUESTIONS: readonly Question[] = Array.from(
  { length: TOTAL_QUESTIONS },
  (_, i) => {
    const n = i + 1;
    return { n, correct: ANSWER_KEY[n]! };
  },
);

/** i18n keys — namespace `quiz`, NO prefix (SPEC v3). `tq` resolves
 *  them in ns=quiz; the registry declares { namespace:"quiz", key }. */
export const promptKey = (n: number) => `q.${n}.prompt`;
export const optionKey = (n: number, o: OptionIndex) => `q.${n}.a.${o}`;
