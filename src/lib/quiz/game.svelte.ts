/**
 * Hot-seat 2-player trivia state (Svelte 5 runes) — per the canonical
 * cross-demo SPEC: exactly 10 questions × 5 options, players alternate
 * per question, +1 per correct answer, per-player score, winner screen,
 * tie supported. Pure state machine — no i18n, no DOM.
 */
import {
  QUESTIONS,
  TOTAL_QUESTIONS,
  type OptionIndex,
  type Question,
} from "./questions";

export type Phase = "setup" | "playing" | "finished";

export type Player = { name: string; score: number; answered: number };

export class QuizGame {
  phase = $state<Phase>("setup");
  players = $state<[Player, Player]>([
    { name: "", score: 0, answered: 0 },
    { name: "", score: 0, answered: 0 },
  ]);
  qIndex = $state(0);
  selected = $state<OptionIndex | null>(null);
  revealed = $state(false);

  /** Whose turn — players alternate every question. */
  current = $derived(this.qIndex % 2);

  question = $derived<Question>(QUESTIONS[this.qIndex]!);

  progress = $derived({
    current: Math.min(this.qIndex + 1, TOTAL_QUESTIONS),
    total: TOTAL_QUESTIONS,
  });

  /** -1 tie, 0 player one, 1 player two. Valid once finished. */
  winner = $derived.by(() => {
    const [a, b] = this.players;
    if (a.score === b.score) return -1;
    return a.score > b.score ? 0 : 1;
  });

  start(nameA: string, nameB: string) {
    this.players = [
      { name: nameA.trim(), score: 0, answered: 0 },
      { name: nameB.trim(), score: 0, answered: 0 },
    ];
    this.qIndex = 0;
    this.selected = null;
    this.revealed = false;
    this.phase = "playing";
  }

  /** Lock in the active player's answer and reveal correctness. */
  answer(option: OptionIndex) {
    if (this.revealed || this.phase !== "playing") return;
    this.selected = option;
    this.revealed = true;
    const p = this.players[this.current]!;
    p.answered += 1;
    if (option === this.question.correct) p.score += 1;
  }

  /** Advance to the next question, or finish after the last one. */
  next() {
    if (!this.revealed) return;
    if (this.qIndex + 1 >= TOTAL_QUESTIONS) {
      this.phase = "finished";
      return;
    }
    this.qIndex += 1;
    this.selected = null;
    this.revealed = false;
  }

  reset() {
    this.phase = "setup";
    this.players = [
      { name: "", score: 0, answered: 0 },
      { name: "", score: 0, answered: 0 },
    ];
    this.qIndex = 0;
    this.selected = null;
    this.revealed = false;
  }
}
