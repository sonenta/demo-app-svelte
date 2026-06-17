/**
 * `@sonenta/*-i18n` rendered-key registry — §0e MOUNT-TRACKED +
 * REF-COUNTED (canonical model, == @sonenta/react-i18next@0.7.0;
 * master ruling 2026-05-19).
 *
 * A key is registered while at least one mounted component declares it,
 * and dropped only when the last declarer unmounts (refcount → 0). This
 * is NOT a per-view/phase reset: persistent always-on-screen strings
 * (e.g. the header eyebrow/title, the feedback CTA) stay declared on
 * every view, while strings whose region unmounts on navigation are
 * dropped — so the feedback panel lists exactly the strings VISIBLE on
 * the page.
 *
 * The feedback SDK reads `globalThis.__sonenta_key_registry__.snapshot()`
 * (the tiny contract); the namespace filter is applied SDK-side
 * (`rendered ∩ namespace`).
 */
import { writable, type Readable } from "svelte/store";

export type DeclaredKey = { namespace: string; key: string };

const GLOBAL = "__sonenta_key_registry__";

const _counts = new Map<string, { dk: DeclaredKey; n: number }>();
const _version = writable(0);

/** Bumped (post-render) whenever the registered set changes. */
export const registryVersion: Readable<number> = _version;

// Declarers run inside Svelte effects (render/commit path); coalesce +
// defer the store write to a microtask so it never lands inside a
// derived/render computation (that breaks hydration).
let _dirty = false;
function bump() {
  if (_dirty) return;
  _dirty = true;
  queueMicrotask(() => {
    _dirty = false;
    _version.update((n) => n + 1);
  });
}

const id = (ns: string, key: string) => `${ns}:${key}`;

export function track(namespace: string, key: string) {
  const k = id(namespace, key);
  const e = _counts.get(k);
  if (e) {
    e.n += 1;
  } else {
    _counts.set(k, { dk: { namespace, key }, n: 1 });
    bump();
  }
}

export function untrack(namespace: string, key: string) {
  const k = id(namespace, key);
  const e = _counts.get(k);
  if (!e) return;
  e.n -= 1;
  if (e.n <= 0) {
    _counts.delete(k);
    bump();
  }
}

const registry = { snapshot: (): DeclaredKey[] => [..._counts.values()].map((e) => e.dk) };

// Publish the global contract once (SSR-safe — globalThis exists in Node).
const g = globalThis as Record<string, unknown>;
if (!g[GLOBAL]) g[GLOBAL] = registry;
