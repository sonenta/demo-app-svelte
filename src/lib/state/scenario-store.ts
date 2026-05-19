/**
 * Scenario store — drives the autoplay/loop demo.
 *
 * Triggers a curated sequence of t() calls on intentionally-missing keys,
 * spaced TICK_MS apart. In loop mode, after the last key fires we clear the
 * missing-store and restart, so video captures get a clean reset every cycle.
 *
 * The fire callback is wired by ScenarioRunner once it's mounted (where the
 * t-store has been subscribed and is reactive).
 */
import { writable, type Readable } from "svelte/store";

export type ScenarioMode = "idle" | "playing" | "looping";

export const SCENARIO_KEYS = [
  "legal.gdpr.long_clause",
  "checkout.tax.tooltip",
  "error.payment.declined",
  "landing.coming_soon",
] as const;

export const TICK_MS = 3500;
export const RESET_MS = 1500;

type ScenarioState = {
  mode: ScenarioMode;
  cursor: number;
  nextFireAt: number | null;
};

const initial: ScenarioState = { mode: "idle", cursor: 0, nextFireAt: null };
const inner = writable<ScenarioState>(initial);

let fireFn: ((key: string) => void) | null = null;
let resetFn: (() => void) | null = null;
let timerId: ReturnType<typeof setTimeout> | null = null;

const cancelTimer = () => {
  if (timerId != null) {
    clearTimeout(timerId);
    timerId = null;
  }
};

let snapshot: ScenarioState = initial;
inner.subscribe((s) => {
  snapshot = s;
});

const tick = () => {
  if (snapshot.mode === "idle") return;
  const key = SCENARIO_KEYS[snapshot.cursor];
  if (key && fireFn) fireFn(key);
  const isLast = snapshot.cursor >= SCENARIO_KEYS.length - 1;
  if (isLast) {
    if (snapshot.mode === "looping") {
      inner.set({
        mode: "looping",
        cursor: 0,
        nextFireAt: Date.now() + RESET_MS + TICK_MS,
      });
      timerId = setTimeout(() => {
        if (resetFn) resetFn();
        timerId = setTimeout(tick, TICK_MS);
      }, RESET_MS);
    } else {
      inner.set({ mode: "idle", cursor: 0, nextFireAt: null });
    }
  } else {
    inner.set({
      mode: snapshot.mode,
      cursor: snapshot.cursor + 1,
      nextFireAt: Date.now() + TICK_MS,
    });
    timerId = setTimeout(tick, TICK_MS);
  }
};

export const scenarioStore = {
  subscribe: inner.subscribe as Readable<ScenarioState>["subscribe"],
  attach(fire: (key: string) => void, reset: () => void) {
    fireFn = fire;
    resetFn = reset;
  },
  start(mode: Exclude<ScenarioMode, "idle">) {
    cancelTimer();
    inner.set({ mode, cursor: 0, nextFireAt: Date.now() + 200 });
    timerId = setTimeout(tick, 200);
  },
  stop() {
    cancelTimer();
    inner.set({ mode: "idle", cursor: 0, nextFireAt: null });
  },
};
