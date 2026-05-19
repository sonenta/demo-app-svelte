<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
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
      () => missingStore.clear(),
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
