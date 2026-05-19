<script lang="ts">
  let { ready }: { ready: boolean } = $props();

  let mounted = $state(true);
  let fading = $state(false);

  $effect(() => {
    if (!ready || fading) return;
    fading = true;
    const tm = window.setTimeout(() => (mounted = false), 320);
    return () => window.clearTimeout(tm);
  });
</script>

{#if mounted}
  <div
    role="status"
    aria-live="polite"
    aria-busy={!ready}
    class={[
      "fixed inset-0 z-50 grid place-items-center bg-ink-950 transition-opacity duration-300",
      fading ? "opacity-0 pointer-events-none" : "opacity-100",
    ].join(" ")}
  >
    <div class="flex flex-col items-center gap-5">
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        width="48"
        height="48"
        class="splash-logo"
      >
        <rect width="32" height="32" rx="7" fill="#0e1015" />
        <path
          d="M9 9.5l5.6 12.5h2L22 9.5h-2.5l-4 9.4-3.9-9.4z"
          fill="#10b981"
        />
      </svg>
      <span
        class="mono text-[10px] uppercase tracking-[0.22em] text-ink-300"
      >
        loading bundles
      </span>
      <span
        class="block h-px w-24 bg-ink-800 overflow-hidden rounded-full"
      >
        <span class="block h-full w-1/2 bg-emerald-500 splash-bar"></span>
      </span>
    </div>
  </div>
{/if}
