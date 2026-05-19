<script lang="ts">
  import { t } from "$lib/i18n";

  const PLANS = [
    {
      id: "free",
      nameKey: "pricing.free.name",
      priceKey: "pricing.free.price",
      line1Key: "pricing.free.line1",
      line2Key: "pricing.free.line2",
      accent: false,
    },
    {
      id: "hobby",
      nameKey: "pricing.hobby.name",
      priceKey: "pricing.hobby.price",
      line1Key: "pricing.hobby.line1",
      line2Key: "pricing.hobby.line2",
      accent: false,
    },
    {
      id: "pro",
      nameKey: "pricing.pro.name",
      priceKey: "pricing.pro.price",
      line1Key: "pricing.pro.line1",
      line2Key: "pricing.pro.line2",
      accent: true,
    },
    {
      id: "team",
      nameKey: "pricing.team.name",
      priceKey: "pricing.team.price",
      line1Key: "pricing.team.line1",
      line2Key: "pricing.team.line2",
      accent: false,
    },
  ] as const;
</script>

<section id="pricing" class="border-t border-ink-800 bg-ink-900/40">
  <div class="mx-auto max-w-6xl px-6 py-20 lg:py-28">
    <header class="max-w-2xl mb-12">
      <h2
        class="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50"
      >
        {$t("pricing.title")}
      </h2>
      <p class="mt-3 text-ink-300">{$t("pricing.subtitle")}</p>
    </header>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {#each PLANS as p (p.id)}
        <article
          class={[
            "relative rounded-xl border bg-ink-900 p-6 flex flex-col gap-4",
            p.accent
              ? "border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
              : "border-ink-800",
          ].join(" ")}
        >
          {#if p.accent}
            <span
              class="absolute -top-2.5 left-6 mono text-[10px] uppercase tracking-[0.2em] bg-emerald-500 text-ink-950 px-2 py-0.5 rounded-sm"
            >
              popular
            </span>
          {/if}
          <h3 class="text-xl font-semibold tracking-tight text-ink-50">
            {$t(p.nameKey)}
          </h3>
          <div class="flex items-baseline gap-1">
            <span
              class="text-4xl font-semibold tracking-tight text-ink-50"
            >
              {$t(p.priceKey)}
            </span>
            <span class="text-xs text-ink-300">{$t("pricing.month")}</span>
          </div>
          <ul class="text-sm text-ink-300 space-y-1.5">
            <li>{$t(p.line1Key)}</li>
            <li>{$t(p.line2Key)}</li>
          </ul>
          <button
            type="button"
            class={[
              "mt-auto px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors",
              p.accent
                ? "bg-emerald-500 text-ink-950 hover:bg-emerald-400"
                : "border border-ink-700 bg-ink-900 text-ink-100 hover:bg-ink-800",
            ].join(" ")}
          >
            {$t("pricing.cta")}
          </button>
        </article>
      {/each}
    </div>
  </div>
</section>
