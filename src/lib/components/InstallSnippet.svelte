<script lang="ts">
  import { t } from "$lib/i18n";
  import CodeBlock from "./CodeBlock.svelte";

  // SvelteKit — the official native Svelte-store binding @sonenta/svelte-i18n
  // (over @sonenta/i18n-core), no svelte-i18n dependency.
  const SETUP = `// npm i @sonenta/svelte-i18n
import { createSonentaI18n } from "@sonenta/svelte-i18n";

export const i18n = createSonentaI18n({
  token: import.meta.env.VITE_SONENTA_KEY,
  projectUuid: "proj_xxx",
  defaultLocale: "en",
});`;

  const USAGE = `<script>
  import { i18n } from "$lib/i18n";
  const { t, setLanguage } = i18n;
<\/script>

<h1>{$t("hero.title")}</h1>

<button onclick={() => setLanguage("fr")}>FR</button>`;
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
