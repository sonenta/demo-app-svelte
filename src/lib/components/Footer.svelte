<script lang="ts">
  import { t } from "$lib/i18n";
  import Brand from "./Brand.svelte";
</script>

<footer class="border-t border-ink-800">
  <div class="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center gap-6">
    <Brand size={22} />
    <p class="text-ink-300 text-sm">{$t("footer.tagline")}</p>
    <div class="ml-auto flex items-center gap-5 text-xs text-ink-300 mono">
      <a
        href="https://github.com/sonenta/demo-app-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-ink-50 transition-colors"
      >
        {$t("footer.repo")}
      </a>
      <span class="border-l border-ink-800 h-4"></span>
      <span>{$t("footer.demo")}</span>
    </div>
  </div>
</footer>
