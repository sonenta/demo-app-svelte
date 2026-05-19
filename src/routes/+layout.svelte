<script lang="ts">
  import "../app.css";
  import { locale, ready } from "$lib/i18n";
  import Splash from "$lib/components/Splash.svelte";
  import ScenarioRunner from "$lib/components/ScenarioRunner.svelte";

  let { children } = $props();

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

<Splash ready={$ready} />
<ScenarioRunner ready={$ready} />
<div
  id="main"
  class={[
    "min-h-screen flex flex-col transition-opacity duration-300",
    $ready ? "opacity-100" : "opacity-0",
  ].join(" ")}
>
  {@render children()}
</div>
