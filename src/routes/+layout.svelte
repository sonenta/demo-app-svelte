<script lang="ts">
  import { onMount } from "svelte";
  import "../app.css";
  import { locale, ready } from "$lib/i18n";
  import Splash from "$lib/components/Splash.svelte";
  import ScenarioRunner from "$lib/components/ScenarioRunner.svelte";

  let { children } = $props();

  /**
   * REVEAL CAP — the network must never be able to hide the page.
   *
   * `ready` waits on the bundle FETCH (we serve our own bundles from a
   * same-origin cdnBase). Gating first paint on it means a slow or dead link
   * hides the entire app for as long as the fetch takes — indefinitely, in the
   * limit. Verified: with the bundle request stalled, `#main` sat at opacity 0
   * behind the splash for the whole measurement.
   *
   * So: reveal after CAP_MS whether or not bundles landed. A page with a few
   * keys still resolving beats no page at all, and every control still works.
   * (Shape published by demo-app as the quartet reference, react 34ab10d.)
   *
   * NOTE the cap only helps if nothing ELSE hides the tree — the opacity gate
   * below must key off `revealed`, not `$ready`, or the cap expires onto a
   * still-invisible page.
   */
  const CAP_MS = 1200;
  let capExpired = $state(false);
  onMount(() => {
    const id = setTimeout(() => (capExpired = true), CAP_MS);
    return () => clearTimeout(id);
  });
  const revealed = $derived($ready || capExpired);

  // RTL is uncommon for V1 (FR/EN/ES are LTR), but we set both lang and dir on
  // every locale change so adding ar/he/fa/ur later is a single-line change.
  const RTL_LANGS = new Set(["ar", "he", "fa", "ur"]);
  const dirOf = (loc: string) =>
    RTL_LANGS.has(loc.split("-")[0]!) ? "rtl" : "ltr";

  $effect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = $locale;
    document.documentElement.dir = dirOf($locale);
  });
</script>

<a
  href="#main"
  class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-3 focus-visible:left-3 focus-visible:z-[60] focus-visible:px-3 focus-visible:py-2 focus-visible:bg-emerald-500 focus-visible:text-ink-950 focus-visible:rounded-md focus-visible:text-sm focus-visible:font-semibold"
>
  Skip to content
</a>

<Splash ready={revealed} />
<!-- ScenarioRunner stays on the REAL `ready`: firing t() before the bundles
     land would report present keys as missing. The cap is about PAINT, not
     about pretending the data arrived. -->
<ScenarioRunner ready={$ready} />
<div
  id="main"
  class={[
    "min-h-screen flex flex-col transition-opacity duration-300",
    revealed ? "opacity-100" : "opacity-0",
  ].join(" ")}
>
  {@render children()}
</div>
