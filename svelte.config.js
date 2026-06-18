import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    // adapter-static writes to build/ (default). `fallback: index.html` ships
    // an SPA shell so client-side navigations (e.g. /demos/svelte/?demo=play)
    // and any not-prerendered path keep working under the static nginx mount.
    adapter: adapter({
      fallback: "index.html",
      precompress: false,
      strict: true,
    }),
    prerender: {
      handleHttpError: "warn",
      handleMissingId: "ignore",
    },
    // Production lives under https://sonenta.com/demos/svelte/ — every internal
    // link and asset URL must be prefixed via `base` from $app/paths.
    paths: { base: "/demos/svelte" },
    // i18n is the REAL published npm binding @sonenta/svelte-i18n (over
    // @sonenta/i18n-core); feedback is @sonenta/feedback. Both resolve to the
    // genuine packages — no aliases. The demo runs fully offline (i18n via
    // initialBundles; feedback via an injected fetchImpl).
  },
};
