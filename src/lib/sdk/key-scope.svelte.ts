/**
 * `declareRenderedKeys` — mount-scoped, ref-counted declaration of the
 * i18n keys a component currently shows. Call once from a component's
 * <script>; pass a reactive getter of the keys visible RIGHT NOW.
 *
 * While mounted, an $effect keeps the registry in sync with the getter
 * incrementally (track added keys, untrack removed ones as the visible
 * set changes — NOT a full release/re-acquire each tick). On unmount,
 * `onDestroy` releases everything still held. Registry ref-counting means
 * a key declared by several mounted components (e.g. a persistent header)
 * survives until the LAST declarer unmounts — §0e canonical semantics.
 */
import { onDestroy } from "svelte";
import { track, untrack, type DeclaredKey } from "./verbumia-key-registry";

export function declareRenderedKeys(getKeys: () => DeclaredKey[]) {
  let held = new Map<string, DeclaredKey>();

  $effect(() => {
    const next = getKeys();
    const nextIds = new Set<string>();
    for (const dk of next) {
      const k = `${dk.namespace}:${dk.key}`;
      nextIds.add(k);
      if (!held.has(k)) {
        track(dk.namespace, dk.key);
        held.set(k, dk);
      }
    }
    for (const [k, dk] of [...held]) {
      if (!nextIds.has(k)) {
        untrack(dk.namespace, dk.key);
        held.delete(k);
      }
    }
  });

  onDestroy(() => {
    for (const dk of held.values()) untrack(dk.namespace, dk.key);
    held = new Map();
  });
}
