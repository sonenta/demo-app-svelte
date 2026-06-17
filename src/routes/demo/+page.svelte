<script lang="ts">
  /**
   * /demo — focused autoplay route.
   *
   * Same root setup as /, but stripped of marketing chrome so a video capture
   * or screenshot lands directly on the live missing-key inspector. The
   * scenario runner mounted in +layout.svelte already reads ?demo=play|loop
   * from the URL — landing on /demo?demo=loop is enough to start the loop.
   *
   * URL state is read in onMount (not at render time) because this route is
   * prerendered to a single HTML file and querystrings only resolve client-side.
   */
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import Header from "$lib/components/Header.svelte";
  import LiveSection from "$lib/components/LiveSection.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { t } from "$lib/i18n";

  let mode = $state("play");

  const titleFor = (m: string) =>
    m === "loop"
      ? "Sonenta · autoplay loop · Svelte"
      : "Sonenta · autoplay · Svelte";

  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("demo");
    if (requested === "play" || requested === "loop") {
      mode = requested;
    } else {
      // self-demonstrating: default to play if visitor lands without a mode.
      params.set("demo", "play");
      const next = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      window.history.replaceState(null, "", next);
      mode = "play";
    }
  });
</script>

<svelte:head>
  <title>{titleFor(mode)}</title>
  <meta
    name="description"
    content="Live autoplay demo of Sonenta, the adaptive content layer — content managed in Sonenta and shipped multilingual to a SvelteKit app via the CDN."
  />
  <meta name="robots" content="noindex" />
</svelte:head>

<Header />
<main class="flex-1">
  <section class="mx-auto max-w-6xl px-6 pt-12 pb-6">
    <p
      class="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 mb-3 inline-flex items-center gap-2"
    >
      <span class="h-1 w-1 rounded-full bg-emerald-400 blink"></span>
      autoplay · {mode}
    </p>
    <h1
      class="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50"
    >
      {$t("live.title")}
    </h1>
    <p class="mt-3 max-w-2xl text-ink-300">
      {$t("live.subtitle")}
    </p>
    <div
      class="mt-4 flex flex-wrap items-center gap-2 mono text-[11px] text-ink-300"
    >
      <a
        href="?demo=play"
        class="px-2 py-1 rounded-sm border border-ink-800 bg-ink-900 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
      >
        ?demo=play
      </a>
      <a
        href="?demo=loop"
        class="px-2 py-1 rounded-sm border border-ink-800 bg-ink-900 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
      >
        ?demo=loop
      </a>
      <a
        href="{base}/"
        class="ml-auto px-2 py-1 rounded-sm border border-ink-800 bg-ink-900 hover:text-ink-50 transition-colors"
      >
        ← back to showcase
      </a>
    </div>
  </section>
  <LiveSection />
</main>
<Footer />
