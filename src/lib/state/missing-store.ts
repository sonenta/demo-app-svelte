import { writable, type Readable } from "svelte/store";
import type { MissingKeyEvent } from "@local/svelte-i18n";

type MissingState = {
  events: MissingKeyEvent[];
  flushed: number;
  lastBatchAt: number | null;
};

const initial: MissingState = { events: [], flushed: 0, lastBatchAt: null };
const inner = writable<MissingState>(initial);

export const missingStore = {
  subscribe: inner.subscribe as Readable<MissingState>["subscribe"],
  pushBatch(batch: MissingKeyEvent[]) {
    inner.update((s) => ({
      events: [...batch, ...s.events].slice(0, 50),
      flushed: s.flushed + batch.length,
      lastBatchAt: Date.now(),
    }));
  },
  clear() {
    inner.set({ events: [], flushed: 0, lastBatchAt: null });
  },
};
