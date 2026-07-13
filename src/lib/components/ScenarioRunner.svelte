<script lang="ts">
  import { onMount } from "svelte";
  import { i18n, t } from "$lib/i18n";
  import { scenarioStore } from "$lib/state/scenario-store";
  import { missingStore } from "$lib/state/missing-store";

  /**
   * Side-effect-only component. Wires the scenario store's fire/reset hooks
   * to the live $t function (so calls go through the SDK's missing-key
   * handler exactly as a real user click would) and reads ?demo=play|loop
   * from the URL once the default bundle has been fetch-attempted (so the
   * first key isn't dropped by the "skip-until-attempted" guard in the SDK).
   */
  let {
    ready,
    autoStart = true,
  }: { ready: boolean; autoStart?: boolean } = $props();

  // wire fire/reset hooks. We re-read $t on every call so the latest snapshot
  // is used (locale changes mid-scenario stay coherent).
  onMount(() => {
    scenarioStore.attach(
      (key) => $t(key),
      () => {
        missingStore.clear();
        // Clearing OUR panel is not enough: a missing key is reportable ONCE
        // per i18n instance. i18next parks the key as a literal in the source
        // language on the first miss, and fallbackLng routes every other locale
        // THROUGH that park — so the key stops being missing *everywhere* and
        // the handler is never called again. The loop's payoff panel therefore
        // died after cycle 1 and stayed dead (live bug: "No misses yet" from
        // cycle 2 onward). No arrangement of scenario beats could escape it.
        //
        // resetMissingDedup() UN-PARKS the keys from i18next's store, which is
        // the only exit. Reachable on the binding since @sonenta/svelte-i18n
        // @1.1.0 (needs @sonenta/i18n-core >= 1.1.2); before that it existed in
        // the engine with no door to it.
        i18n.resetMissingDedup();
      },
    );
  });

  let started = false;
  $effect(() => {
    if (!ready || !autoStart || started) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const demo = params.get("demo");
    if (demo === "play") {
      scenarioStore.start("playing");
      started = true;
    } else if (demo === "loop") {
      scenarioStore.start("looping");
      started = true;
    }
    return () => scenarioStore.stop();
  });
</script>
