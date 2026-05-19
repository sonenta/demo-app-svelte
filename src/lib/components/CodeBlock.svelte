<script lang="ts">
  import {
    tokenizeBash,
    tokenizeSvelte,
    tokenizeTs,
    type Token,
  } from "$lib/highlight";

  type Lang = "bash" | "ts" | "svelte";

  let {
    code,
    lang,
    caption,
  }: { code: string; lang: Lang; caption: string } = $props();

  let tokens = $derived<Token[]>(
    lang === "bash"
      ? tokenizeBash(code)
      : lang === "svelte"
        ? tokenizeSvelte(code)
        : tokenizeTs(code),
  );

  let copied = $state(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      window.setTimeout(() => (copied = false), 1400);
    } catch {
      // clipboard blocked — non-fatal in demo context
    }
  };
</script>

<figure
  class="rounded-2xl border border-ink-800 bg-ink-900 overflow-hidden shadow-[0_24px_60px_-30px_rgba(0,0,0,0.7)]"
>
  <figcaption
    class="flex items-center gap-3 px-4 py-2.5 border-b border-ink-800 text-xs"
  >
    <span class="flex gap-1.5">
      <span class="h-2.5 w-2.5 rounded-full bg-ink-700"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-ink-700"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-ink-700"></span>
    </span>
    <span class="mono uppercase tracking-[0.18em] text-ink-300">
      {caption}
    </span>
    <button
      type="button"
      onclick={copy}
      class="ml-auto mono text-[10px] uppercase tracking-[0.18em] text-ink-300 hover:text-emerald-400 transition-colors"
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  </figcaption>
  <pre class="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed mono"><code
      >{#each tokens as tok, i (i)}<span class={`tok-${tok.kind}`}>{tok.text}</span>{/each}</code
    ></pre>
</figure>
