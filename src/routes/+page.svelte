<script lang="ts">
  import Header from "$lib/components/Header.svelte";
  import Hero from "$lib/components/Hero.svelte";
  import LiveSection from "$lib/components/LiveSection.svelte";
  import InstallSnippet from "$lib/components/InstallSnippet.svelte";
  import Features from "$lib/components/Features.svelte";
  import Pricing from "$lib/components/Pricing.svelte";
  import Footer from "$lib/components/Footer.svelte";
</script>

<svelte:head>
  <title>Verbumia · live i18n demo · Svelte</title>
  <meta
    name="description"
    content="Live demo of @verbumia/svelte-i18n — runtime missing-key handler, MIT-licensed, MCP-native, no per-word billing."
  />
</svelte:head>

<Header />
<main class="flex-1">
  <Hero />
  <LiveSection />
  <InstallSnippet />
  <Features />
  <Pricing />
</main>
<Footer />
