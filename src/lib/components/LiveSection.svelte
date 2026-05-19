<script lang="ts">
  import MissingKeysPanel from "./MissingKeysPanel.svelte";
  import TriggerCard from "./TriggerCard.svelte";
</script>

<section id="live" class="border-y border-ink-800 bg-ink-900/40 mt-12">
  <div
    class="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-start"
  >
    <MissingKeysPanel />
    <TriggerCard />
  </div>
</section>
