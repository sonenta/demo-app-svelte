<script lang="ts">
  import { t } from "$lib/i18n";
  import CodeBlock from "./CodeBlock.svelte";

  // SvelteKit + svelte-i18n: translations served from the Sonenta CDN
  // through a thin app-owned adapter. A dedicated first-class binding is
  // coming soon, so there is no install line for it yet.
  const SETUP = `// SvelteKit + svelte-i18n — translations from the Sonenta CDN via a
// thin app-owned adapter (a dedicated first-class binding is coming soon).
import { setupSonenta } from "@local/svelte-i18n";

export const i18n = setupSonenta({
  projectId: "proj_xxx",
  apiKey: import.meta.env.VITE_SONENTA_KEY,
  defaultLocale: "en",
});

export const { t, locale, ready } = i18n;`;

  const USAGE = `<script>
  import { t, locale } from "$lib/i18n";
<\/script>

<h1>{$t("hero.title")}</h1>

<button onclick={() => locale.set("fr")}>FR</button>`;
</script>

<section id="install" class="mx-auto max-w-6xl px-6 py-20">
  <header class="max-w-2xl mb-8">
    <p
      class="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 inline-flex items-center gap-2"
    >
      <span class="h-1 w-1 rounded-full bg-emerald-400"></span>
      {$t("install.eyebrow")}
    </p>
    <h2
      class="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50 mt-3"
    >
      {$t("install.title")}
    </h2>
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <span
        class="mono text-[11px] uppercase tracking-[0.18em] rounded-full border border-ink-700 px-2.5 py-1 text-ink-200"
      >
        {$t("binding.label")}
      </span>
      <span
        class="mono text-[11px] uppercase tracking-[0.18em] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-emerald-300"
      >
        {$t("binding.status")}
      </span>
    </div>
    <p class="mt-4 text-sm md:text-base leading-relaxed text-ink-300">
      {$t("binding.positioning")}
    </p>
  </header>
  <div class="grid lg:grid-cols-2 gap-4">
    <CodeBlock code={SETUP} lang="ts" caption="src/lib/i18n.ts" />
    <CodeBlock code={USAGE} lang="svelte" caption="+page.svelte" />
  </div>
</section>
