<script lang="ts">
  import { base } from "$app/paths";
  import { t } from "$lib/i18n";
  import Brand from "./Brand.svelte";
  import LangSwitcher from "./LangSwitcher.svelte";
</script>

<header
  class="sticky top-0 z-30 backdrop-blur-md bg-ink-950/75 border-b border-ink-800"
>
  <div class="mx-auto max-w-6xl flex items-center gap-6 px-6 h-14">
    <Brand />
    <span
      class="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-300 px-2 py-0.5 border border-ink-700 rounded-sm"
    >
      <span class="h-1 w-1 rounded-full bg-emerald-400"></span>
      live demo · svelte
    </span>
    <nav
      class="ml-auto hidden md:flex items-center gap-6 text-sm text-ink-300"
    >
      <a href="#features" class="hover:text-ink-50 transition-colors">
        {$t("nav.product")}
      </a>
      <a href="#pricing" class="hover:text-ink-50 transition-colors">
        {$t("nav.pricing")}
      </a>
      <a href="#docs" class="hover:text-ink-50 transition-colors">
        {$t("nav.docs")}
      </a>
      <a href="{base}/quiz" class="hover:text-ink-50 transition-colors">
        {$t("nav.trivia")}
      </a>
    </nav>
    <LangSwitcher />
    <a
      href="#signin"
      class="hidden sm:inline-flex items-center text-sm font-medium text-ink-300 hover:text-ink-50 transition-colors"
    >
      {$t("nav.signin")} →
    </a>
  </div>
</header>
