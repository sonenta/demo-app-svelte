<script lang="ts">
  import { t, locale } from "$lib/i18n";
  import { missingStore } from "$lib/state/missing-store";
  import { scenarioStore } from "$lib/state/scenario-store";

  let headerEl: HTMLDivElement | undefined = $state();
  let flushedFlash = $state(false);
  let lastSeenBatchAt: number | null = null;

  $effect(() => {
    const at = $missingStore.lastBatchAt;
    if (at == null || at === lastSeenBatchAt) return;
    lastSeenBatchAt = at;
    const el = headerEl;
    if (!el) return;
    el.classList.remove("pulse-amber");
    void el.offsetWidth;
    el.classList.add("pulse-amber");
    flushedFlash = true;
    const tm = window.setTimeout(() => (flushedFlash = false), 1800);
    return () => window.clearTimeout(tm);
  });

  let count = $derived($missingStore.events.length);
  let countLabel = $derived(
    count === 0
      ? $t("live.empty")
      : $t(count === 1 ? "live.count.one" : "live.count.other", {
          values: { count },
        }),
  );

  const formatTime = (ts: number, loc: string) => {
    try {
      return new Intl.DateTimeFormat(loc, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(ts));
    } catch {
      return new Date(ts).toLocaleTimeString();
    }
  };
</script>

<div
  class="rounded-2xl border border-ink-800 bg-ink-900 shadow-[0_1px_0_rgba(255,255,255,0.02),0_24px_60px_-30px_rgba(0,0,0,0.6)] overflow-hidden"
>
  <div
    bind:this={headerEl}
    class="flex items-center gap-3 px-5 py-4 border-b border-ink-800 bg-gradient-to-b from-ink-900 to-ink-900/70 rounded-t-2xl"
  >
    <span class="relative flex h-2.5 w-2.5">
      <span class="absolute inset-0 rounded-full bg-amber blink"></span>
      <span class="absolute inset-0 rounded-full bg-amber/40 animate-ping"></span>
    </span>
    <h2 class="text-[1.05rem] font-semibold tracking-tight text-ink-50">
      {$t("live.title")}
    </h2>
    {#if $scenarioStore.mode !== "idle"}
      <span
        class="mono text-[10px] uppercase tracking-[0.18em] text-ink-950 bg-emerald-400 px-1.5 py-0.5 rounded-sm ml-auto inline-flex items-center gap-1"
      >
        <span class="h-1 w-1 rounded-full bg-ink-950 blink"></span>
        {$scenarioStore.mode === "looping" ? "loop" : "auto"}
      </span>
    {:else}
      <span
        class="mono text-[10px] uppercase tracking-[0.18em] text-amber-bright bg-amber-soft px-1.5 py-0.5 rounded-sm ml-auto"
      >
        live
      </span>
    {/if}
  </div>

  <div class="px-5 py-3 flex items-center gap-3 text-sm border-b border-ink-800">
    <span class="mono text-xs tabular-nums text-ink-100">
      {String(count).padStart(2, "0")}
    </span>
    <span class="text-ink-300">{countLabel}</span>
    {#if flushedFlash}
      <span class="ml-auto mono text-[11px] text-amber-bright slide-in">
        {$t("live.flushed")}
      </span>
    {:else if count > 0}
      <button
        type="button"
        onclick={() => missingStore.clear()}
        class="ml-auto mono text-[11px] uppercase tracking-wider text-ink-300 hover:text-ink-50 transition-colors"
      >
        {$t("panel.clear")}
      </button>
    {/if}
  </div>

  <p class="px-5 py-3 text-xs text-ink-300 border-b border-ink-800">
    {$t("live.subtitle")}
  </p>

  <ol class="divide-y divide-ink-800 max-h-[24rem] overflow-y-auto">
    {#if $missingStore.events.length === 0}
      <li class="px-5 py-12 text-center text-ink-300 text-sm">
        <span
          class="mono text-[11px] uppercase tracking-[0.18em] text-ink-300/60 block mb-2"
        >
          POST /v1/missing
        </span>
        {$t("live.empty")}
      </li>
    {:else}
      {#each $missingStore.events as ev, i (`${ev.locale}-${ev.ns}-${ev.key}-${ev.ts}-${i}`)}
        <li
          class="px-5 py-3 grid grid-cols-[1fr_auto_auto] items-center gap-3 slide-in"
        >
          <code
            class="mono text-[13px] text-ink-100 truncate"
            title={ev.key}
          >
            <span class="text-emerald-400">{ev.ns}</span>
            <span class="text-ink-300">:</span>
            {ev.key}
          </code>
          <span
            class="mono text-[10px] uppercase tracking-[0.18em] text-amber-bright bg-amber-soft px-1.5 py-0.5 rounded-sm"
          >
            {ev.locale}
          </span>
          <time
            class="mono text-[11px] text-ink-300 tabular-nums"
            datetime={new Date(ev.ts).toISOString()}
          >
            {formatTime(ev.ts, $locale)}
          </time>
        </li>
      {/each}
    {/if}
  </ol>
</div>
