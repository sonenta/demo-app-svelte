<script lang="ts">
  import { t } from "$lib/i18n";
  import CodeBlock from "./CodeBlock.svelte";

  const INSTALL = `npm install @verbumia/svelte-i18n`;

  const SETUP = `import { setupVerbumia } from "@verbumia/svelte-i18n";

export const i18n = setupVerbumia({
  projectId: "proj_xxx",
  apiKey: import.meta.env.VITE_VERBUMIA_KEY,
  defaultLocale: "en",
});

export const { t, locale, ready } = i18n;`;

  const USAGE = `<script>
  import { t, locale } from "$lib/i18n";
<\/script>

<h1>{$t("hero.title")}</h1>

<button onclick={() => locale.set("fr")}>FR</button>`;
</script>

<section class="mx-auto max-w-6xl px-6 py-20">
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
  </header>
  <div class="grid lg:grid-cols-3 gap-4">
    <CodeBlock code={INSTALL} lang="bash" caption="terminal" />
    <CodeBlock code={SETUP} lang="ts" caption="src/lib/i18n.ts" />
    <CodeBlock code={USAGE} lang="svelte" caption="+page.svelte" />
  </div>
</section>
