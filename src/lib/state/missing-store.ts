import { writable, type Readable } from "svelte/store";

/** Display shape for the live inspector. The SDK's `MissingKeyEvent`
 *  ({key, namespace, language_code, source_value}) is adapted into this in the
 *  i18n `transport`, stamping a client-side `ts`. */
export type MissingKeyEvent = {
  key: string;
  ns: string;
  locale: string;
  ts: number;
  fallback: string;
};

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
