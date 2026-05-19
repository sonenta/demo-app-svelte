<script lang="ts">
  import { t, locale, setLocale } from "$lib/i18n";

  const LOCALES = [
    { code: "fr", labelKey: "lang.fr" },
    { code: "en", labelKey: "lang.en" },
    { code: "es", labelKey: "lang.es" },
  ] as const;
</script>

<div
  role="group"
  aria-label={$t("lang.switcher.label")}
  class="inline-flex items-center rounded-full border border-ink-700 bg-ink-900/60 p-0.5 text-xs font-medium"
>
  {#each LOCALES as l (l.code)}
    {@const active = $locale === l.code}
    <button
      type="button"
      onclick={() => setLocale(l.code)}
      class={[
        "px-3 py-1 rounded-full transition-colors uppercase tracking-wider",
        active ? "bg-ink-50 text-ink-950" : "text-ink-300 hover:text-ink-50",
      ].join(" ")}
      aria-pressed={active}
      aria-current={active ? "true" : undefined}
      aria-label={$t(l.labelKey)}
      lang={l.code}
    >
      {l.code}
    </button>
  {/each}
</div>
