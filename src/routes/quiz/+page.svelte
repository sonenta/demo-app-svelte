<script lang="ts">
  import { base } from "$app/paths";
  import Header from "$lib/components/Header.svelte";
  import Footer from "$lib/components/Footer.svelte";
  import { tq } from "$lib/quiz/i18n";
  import { QuizGame } from "$lib/quiz/game.svelte";
  import {
    OPTIONS,
    promptKey,
    optionKey,
    type OptionIndex,
  } from "$lib/quiz/questions";
  import QuizFeedback from "$lib/quiz/QuizFeedback.svelte";

  const game = new QuizGame();

  let nameA = $state("");
  let nameB = $state("");

  const activeName = $derived(game.players[game.current]?.name || "");

  const optionState = (
    o: OptionIndex,
  ): "idle" | "correct" | "wrong" | "muted" => {
    if (!game.revealed) return "idle";
    if (o === game.question.correct) return "correct";
    if (o === game.selected) return "wrong";
    return "muted";
  };

  const optionClass: Record<string, string> = {
    idle: "border-ink-700 bg-ink-900/60 hover:border-emerald-500 hover:bg-ink-800/60",
    correct: "border-emerald-500 bg-emerald-500/12 text-emerald-300",
    wrong: "border-amber bg-amber-soft text-amber-bright",
    muted: "border-ink-800 bg-ink-900/40 text-ink-500",
  };

  // Rendered-key scoping is now owned by @sonenta/i18n-core: every quiz string
  // resolved through `$tq` (→ the official `t()`) is auto-tracked into the
  // on-screen key registry, so the feedback panel scopes itself with no
  // app-side declaration. (Beta note: the Svelte binding's registry ACCUMULATES
  // rendered keys for the instance lifetime rather than per-view — reported to
  // sdk; acceptable for this demo.)

  const startGame = () =>
    game.start(
      nameA.trim() || $tq("setup.player1.default"),
      nameB.trim() || $tq("setup.player2.default"),
    );
</script>

<svelte:head>
  <title>{$tq("meta.title")}</title>
  <meta name="description" content={$tq("meta.tagline")} />
</svelte:head>

<Header />

<main class="flex-1">
  <section class="mx-auto max-w-3xl px-6 pt-12 pb-20">
    <p
      class="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400 mb-3 inline-flex items-center gap-2"
    >
      <span class="h-1 w-1 rounded-full bg-emerald-400"></span>
      {$tq("meta.title")}
    </p>
    <h1
      class="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-ink-50"
    >
      {$tq("meta.tagline")}
    </h1>

    <!-- SETUP ------------------------------------------------------------ -->
    {#if game.phase === "setup"}
      <div
        class="mt-10 rounded-xl border border-ink-800 bg-ink-900/50 p-6 md:p-8"
      >
        <h2 class="text-lg font-semibold text-ink-50">
          {$tq("setup.heading")}
        </h2>
        <p class="mt-2 text-sm text-ink-300 max-w-xl">
          {$tq("setup.blurb")}
        </p>
        <div class="mt-6 grid gap-5 sm:grid-cols-2">
          <label class="block">
            <span
              class="mono text-[11px] uppercase tracking-[0.18em] text-ink-300"
            >
              {$tq("setup.player1.label")}
            </span>
            <input
              bind:value={nameA}
              placeholder={$tq("setup.player1.default")}
              maxlength="24"
              autocomplete="off"
              class="mt-2 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-ink-50 placeholder:text-ink-500 outline-none focus-visible:border-emerald-500"
            />
          </label>
          <label class="block">
            <span
              class="mono text-[11px] uppercase tracking-[0.18em] text-ink-300"
            >
              {$tq("setup.player2.label")}
            </span>
            <input
              bind:value={nameB}
              placeholder={$tq("setup.player2.default")}
              maxlength="24"
              autocomplete="off"
              class="mt-2 w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-ink-50 placeholder:text-ink-500 outline-none focus-visible:border-emerald-500"
            />
          </label>
        </div>
        <button
          type="button"
          onclick={startGame}
          class="mt-7 inline-flex items-center justify-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-emerald-400"
        >
          {$tq("setup.start")}
        </button>
      </div>

      <!-- PLAYING --------------------------------------------------------- -->
    {:else if game.phase === "playing"}
      <div class="mt-10">
        <div
          class="flex flex-wrap items-center gap-x-6 gap-y-2 mono text-[11px] uppercase tracking-[0.16em]"
        >
          <span class="text-emerald-400">
            {$tq("hud.turn", { name: activeName })}
          </span>
          <span class="text-ink-300">
            {$tq("hud.question", {
              current: game.progress.current,
              total: game.progress.total,
            })}
          </span>
          <span class="ml-auto flex items-center gap-4 text-ink-300">
            {#each game.players as p, i (i)}
              <span class={i === game.current ? "text-ink-50" : ""}>
                {$tq("hud.score", { name: p.name, score: p.score })}
              </span>
            {/each}
          </span>
        </div>

        <div
          class="mt-5 h-1 w-full overflow-hidden rounded-full bg-ink-800"
          role="progressbar"
          aria-valuenow={game.progress.current}
          aria-valuemin="1"
          aria-valuemax={game.progress.total}
        >
          <div
            class="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
            style:width={`${(game.progress.current / game.progress.total) * 100}%`}
          ></div>
        </div>

        <div
          class="mt-8 rounded-xl border border-ink-800 bg-ink-900/50 p-6 md:p-8"
        >
          <h2
            class="text-xl md:text-2xl font-semibold leading-snug text-ink-50"
          >
            {$tq(promptKey(game.question.n))}
          </h2>

          <div class="mt-6 grid gap-3">
            {#each OPTIONS as o (o)}
              {@const st = optionState(o)}
              <button
                type="button"
                disabled={game.revealed}
                onclick={() => game.answer(o)}
                class={[
                  "flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  optionClass[st],
                  game.revealed ? "cursor-default" : "cursor-pointer",
                ].join(" ")}
              >
                <span
                  class="mono text-[11px] uppercase tracking-widest opacity-60"
                >
                  {o}
                </span>
                <span class="flex-1 text-ink-100">
                  {$tq(optionKey(game.question.n, o))}
                </span>
                {#if st === "correct"}
                  <span aria-hidden="true">✓</span>
                {:else if st === "wrong"}
                  <span aria-hidden="true">✕</span>
                {/if}
              </button>
            {/each}
          </div>

          {#if game.revealed}
            <div
              class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-ink-800 pt-5"
            >
              <p class="text-sm">
                {#if game.selected === game.question.correct}
                  <span class="font-semibold text-emerald-400">
                    {$tq("feedback.correct")}
                  </span>
                {:else}
                  <span class="text-amber-bright">
                    {$tq("feedback.wrong", {
                      answer: $tq(
                        optionKey(game.question.n, game.question.correct),
                      ),
                    })}
                  </span>
                {/if}
              </p>
              <button
                type="button"
                onclick={() => game.next()}
                class="ml-auto inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-colors hover:bg-emerald-400"
              >
                {game.progress.current === game.progress.total
                  ? $tq("action.finish")
                  : $tq("action.next")}
              </button>
            </div>
          {/if}
        </div>
      </div>

      <!-- FINISHED --------------------------------------------------------- -->
    {:else}
      <div
        class="mt-10 rounded-xl border border-ink-800 bg-ink-900/50 p-8 text-center"
      >
        <p
          class="mono text-[11px] uppercase tracking-[0.22em] text-emerald-400"
        >
          {$tq("result.heading")}
        </p>
        <h2 class="mt-4 text-2xl md:text-3xl font-semibold text-ink-50">
          {#if game.winner === -1}
            {$tq("result.tie")}
          {:else}
            {$tq("result.winner", {
              name: game.players[game.winner]?.name ?? "",
            })}
          {/if}
        </h2>
        <div class="mt-4 space-y-1 mono text-sm text-ink-300">
          {#each game.players as p (p.name)}
            <p>
              {$tq("result.scoreline", {
                name: p.name,
                score: p.score,
                total: p.answered,
              })}
            </p>
          {/each}
        </div>
        <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onclick={() => {
              game.reset();
              nameA = "";
              nameB = "";
            }}
            class="inline-flex items-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-emerald-400"
          >
            {$tq("result.again")}
          </button>
          <a
            href="{base}/"
            class="inline-flex items-center rounded-md border border-ink-700 px-5 py-2.5 text-sm font-medium text-ink-300 transition-colors hover:border-ink-500 hover:text-ink-50"
          >
            {$tq("nav.back")}
          </a>
        </div>
      </div>
    {/if}
  </section>
</main>

<Footer />

<!-- @sonenta/feedback — official /svelte adapter. Declares the visible
     canonical quiz.* keys; isolated, never re-renders this page. -->
<QuizFeedback />
