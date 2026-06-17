<script lang="ts">
  /**
   * @sonenta/feedback — Svelte integration (core-adapter pattern,
   * authorized by master; backend confirmed there is no svelte-i18n
   * plugins[] slot / `/svelte` entry, that parity is a separate task).
   *
   * Self-contained, isolated leaf: it owns its own open-state and never
   * re-renders the host quiz. It lists the quiz-namespace strings on the
   * current view and lets an end user rate (1–5) or suggest a better
   * translation. sessionId is SERVER-MINTED via acceptTos() and shown
   * read-only. All chrome is itself translated by the Sonenta i18n binding.
   */
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { locale, t, exists } from "$lib/i18n";
  import { tq, tfb, QUIZ_NS } from "$lib/quiz/i18n";
  import { QuizFeedback } from "$lib/quiz/feedback.svelte";
  import { FEEDBACK_MODE } from "$lib/quiz/feedback-config";
  import { registryVersion } from "$lib/sdk/sonenta-key-registry";
  import { declareRenderedKeys } from "$lib/sdk/key-scope.svelte";
  import { resolveKeys, type FeedbackString } from "@sonenta/feedback/core";

  // The floating CTA (quiz:action.rate) is always on screen while this
  // widget is mounted → declare it for the whole lifetime (persistent;
  // §0e: stays across every quiz view, like the header eyebrow/title).
  declareRenderedKeys(() => [{ namespace: QUIZ_NS, key: "action.rate" }]);

  const fb = new QuizFeedback({
    apiBase: FEEDBACK_MODE.apiBase,
    projectId: FEEDBACK_MODE.projectId,
    live: FEEDBACK_MODE.live,
    language: $locale,
    // the real /core client asks the backend to resolve values; offline
    // the injected demo backend resolves them through the i18n SDK.
    resolve: (ns, key) => get(t)(key, { ns }),
  });

  // keep the client language in lockstep with the SDK locale (rebuilds the
  // real /core client; does not load — see below)
  $effect(() => {
    void fb.setLanguage($locale);
  });

  // RENDERED auto-scoping: reload when the rendered-key registry changes
  // ($registryVersion — i.e. the user navigated to a new view), on client
  // rebuild (fb.rev), or when bundles arrive ($t). Gate on the bundle
  // actually holding the rendered keys so the resolver never echoes raw
  // keys offline.
  $effect(() => {
    void $t;
    void $registryVersion;
    fb.rev;
    const probe = resolveKeys(undefined, QUIZ_NS)[0]?.key;
    const bundleReady = probe == null || exists(probe, QUIZ_NS);
    if (fb.open && fb.consented && bundleReady) void fb.load();
  });

  let mounted = $state(false);
  onMount(() => {
    mounted = true;
  });

  // per-string "suggest" box open-state + drafts (local UI only)
  let openSuggest = $state<Record<string, boolean>>({});
  let draft = $state<Record<string, string>>({});
  let draftWhy = $state<Record<string, string>>({});

  const sid = (s: FeedbackString) => `${s.namespace}:${s.key}`;

  function sendSuggest(s: FeedbackString) {
    const id = sid(s);
    fb.suggest(s, draft[id] ?? "", draftWhy[id] ?? null, $tfb("thanks.suggested"));
    draft[id] = "";
    draftWhy[id] = "";
    openSuggest[id] = false;
  }
</script>

{#if mounted}
  <!-- floating CTA — isolated; opening it never re-renders the quiz -->
  <button
    type="button"
    onclick={() => fb.toggle()}
    aria-expanded={fb.open}
    class="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-emerald-600 bg-ink-900/90 px-4 py-2.5 text-sm font-semibold text-emerald-300 shadow-lg backdrop-blur-md transition-colors hover:border-emerald-400 hover:text-emerald-200"
  >
    <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
    {$tq("action.rate")}
  </button>

  {#if fb.open}
    <!-- scrim -->
    <button
      type="button"
      aria-label={$tfb("close")}
      onclick={() => fb.close()}
      class="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
    ></button>

    <aside
      class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-ink-800 bg-ink-950 shadow-2xl"
      aria-label={$tfb("title")}
    >
      <header
        class="flex items-start gap-4 border-b border-ink-800 px-6 py-5"
      >
        <div class="flex-1">
          <h2 class="flex items-center gap-2 text-lg font-semibold text-ink-50">
            {$tfb("title")}
            {#if FEEDBACK_MODE.live}
              <span
                class="mono inline-flex items-center gap-1 rounded-sm border border-emerald-600 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-emerald-400"
                title="Live sonenta-api"
              >
                <span class="h-1 w-1 rounded-full bg-emerald-400"></span>
                live
              </span>
            {/if}
          </h2>
          <p class="mt-1 text-xs leading-relaxed text-ink-300">
            {$tfb("intro")}
          </p>
        </div>
        <button
          type="button"
          onclick={() => fb.close()}
          class="rounded-md border border-ink-700 px-2.5 py-1 text-xs text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-50"
        >
          {$tfb("close")}
        </button>
      </header>

      <div class="flex-1 overflow-y-auto px-6 py-5">
        {#if !fb.consented}
          <!-- §1 ToS gate — token + server-minted sessionId bootstrap -->
          <div class="rounded-xl border border-ink-800 bg-ink-900/50 p-5">
            <h3 class="text-sm font-semibold text-ink-50">
              {$tfb("consent.title")}
            </h3>
            <p class="mt-2 text-xs leading-relaxed text-ink-300">
              {$tfb("consent.body", { tos: fb.tosVersion })}
            </p>
            <button
              type="button"
              disabled={fb.busy}
              onclick={() => fb.accept()}
              class="mt-4 inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-emerald-400 disabled:bg-ink-700 disabled:text-ink-500"
            >
              {$tfb("consent.accept")}
            </button>
          </div>
        {:else}
          {#if fb.sessionId}
            <p
              class="mono mb-4 flex items-center gap-2 text-[11px] text-ink-500"
            >
              <span class="rounded-sm bg-ink-900 px-2 py-1 text-emerald-400">
                {$tfb("session", { id: fb.sessionId.slice(0, 14) })}
              </span>
              <span>{$tfb("session.note")}</span>
            </p>
          {/if}

          {#if fb.strings.length === 0}
            <p class="text-sm text-ink-300">{$tfb("empty")}</p>
          {:else}
            <ul class="space-y-3">
              {#each fb.strings as s (sid(s))}
                {@const id = sid(s)}
                <li
                  class="rounded-lg border border-ink-800 bg-ink-900/40 p-4"
                >
                  <p class="text-sm text-ink-100">{s.value}</p>
                  <p class="mono mt-1 text-[10px] text-ink-500">
                    {s.namespace}:{s.key}
                  </p>

                  <div class="mt-3 flex items-center gap-3">
                    <span
                      class="mono text-[10px] uppercase tracking-wider text-ink-500"
                    >
                      {$tfb("rate.label")}
                    </span>
                    <div class="flex items-center gap-1">
                      {#each [1, 2, 3, 4, 5] as star (star)}
                        <button
                          type="button"
                          aria-label={`${star}`}
                          onclick={() =>
                            fb.rate(s, star, $tfb("thanks.rated"))}
                          class={[
                            "text-lg leading-none transition-colors",
                            (s.my_rating ?? 0) >= star
                              ? "text-emerald-400"
                              : "text-ink-700 hover:text-ink-500",
                          ].join(" ")}
                        >
                          ★
                        </button>
                      {/each}
                    </div>
                    <span class="ml-auto mono text-[10px] text-ink-500">
                      {#if s.ratings_count > 0}
                        {$tfb("avg", {
                          avg: (s.avg_stars ?? 0).toFixed(1),
                          count: s.ratings_count,
                        })}
                      {:else}
                        {$tfb("avg.none")}
                      {/if}
                    </span>
                  </div>

                  {#if openSuggest[id]}
                    <div class="mt-3 space-y-2">
                      <textarea
                        bind:value={draft[id]}
                        placeholder={$tfb("suggest.placeholder")}
                        rows="2"
                        maxlength="2000"
                        class="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-500 outline-none focus-visible:border-emerald-500"
                      ></textarea>
                      <input
                        bind:value={draftWhy[id]}
                        placeholder={$tfb("suggest.comment")}
                        maxlength="500"
                        class="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-1.5 text-xs text-ink-50 placeholder:text-ink-500 outline-none focus-visible:border-emerald-500"
                      />
                      <button
                        type="button"
                        onclick={() => sendSuggest(s)}
                        class="inline-flex items-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-ink-950 transition-colors hover:bg-emerald-400"
                      >
                        {$tfb("suggest.send")}
                      </button>
                    </div>
                  {:else}
                    <button
                      type="button"
                      onclick={() => (openSuggest[id] = true)}
                      class="mt-3 text-xs text-ink-300 underline decoration-ink-700 underline-offset-4 transition-colors hover:text-emerald-400 hover:decoration-emerald-500"
                    >
                      {$tfb("suggest.toggle")}
                    </button>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>

      {#if fb.flash}
        <div
          class="border-t border-emerald-600/40 bg-emerald-500/10 px-6 py-3 text-sm text-emerald-300"
          role="status"
        >
          {fb.flash}
        </div>
      {/if}
    </aside>
  {/if}
{/if}
