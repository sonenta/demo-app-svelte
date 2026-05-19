# @verbumia/demo-app-svelte

Live showcase + dogfooding app for `@verbumia/svelte-i18n`.

Mirrors the React demo (`demo-app`) feature-for-feature in Svelte 5 / SvelteKit:
multi-locale (FR / EN / ES), live missing-key inspector, autoplay scenario.

## Stack

- **Svelte 5** + **SvelteKit** (adapter-static → `dist/`)
- **TypeScript** + **Vite**
- **Tailwind v4** (no Google Fonts; system font stack)

## SDK

Until `@verbumia/svelte-i18n` is published from `backend`, the import resolves
to a local stub in `src/lib/sdk/verbumia-svelte-i18n.ts` (aliased in
`svelte.config.js`). The stub implements the same surface the published
package will ship:

```ts
import { setupVerbumia } from "@verbumia/svelte-i18n";

export const i18n = setupVerbumia({
  projectId: "proj_xxx",
  apiKey: import.meta.env.VITE_VERBUMIA_KEY,
  defaultLocale: "en",
  namespaces: ["common"],
  missingHandlerEndpoint: "https://api.verbumia.ca/v1/missing",
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
