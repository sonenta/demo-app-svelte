# @sonenta/demo-app-svelte

Live showcase + dogfooding app for **SvelteKit + svelte-i18n** — translations served from the Sonenta CDN through a thin app-owned adapter, with live missing-key handling. A dedicated first-class binding is **coming soon**.

Mirrors the React demo (`demo-app`) feature-for-feature in Svelte 5 / SvelteKit:
multi-locale (FR / EN / ES), live missing-key inspector, autoplay scenario.

## Stack

- **Svelte 5** + **SvelteKit** (adapter-static → `dist/`)
- **TypeScript** + **Vite**
- **Tailwind v4** (no Google Fonts; system font stack)

## SDK

A dedicated first-class svelte-i18n binding is **coming soon**. Today this demo
serves translations from the Sonenta CDN through a thin app-owned adapter — a
local stub in `src/lib/sdk/sonenta-svelte-i18n.ts`, bound via the
`@local/svelte-i18n` alias in `svelte.config.js`. The stub implements the same
surface a published binding would ship:

```ts
import { setupSonenta } from "@local/svelte-i18n";

export const i18n = setupSonenta({
  projectId: "proj_xxx",
  apiKey: import.meta.env.VITE_SONENTA_KEY,
  defaultLocale: "en",
  namespaces: ["common"],
  missingHandlerEndpoint: "https://api.sonenta.dev/v1/missing",
});

export const { t, locale, ready } = i18n;
```

```svelte
<script>
  import { t, locale } from "$lib/i18n";
</script>
<h1>{$t("hero.title")}</h1>
<button onclick={() => locale.set("fr")}>FR</button>
```

## Develop

```sh
npm install
npm run dev
```

Visit `/` for the showcase or `/demo?demo=loop` for the autoplay scenario.

## Deploy

`vercel.json` is committed; any Vercel project pointing at this repo will pick
up the static build automatically.

## License

MIT.
