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
    alias: {
      // Local stub for the not-yet-published Svelte i18n binding. Kept OFF the
      // @sonenta/ prefix (sdk convention, master GO 2026-06-04) so demo source
      // never makes an unpublished binding look published. Swap to the real
      // @sonenta/* dep once sdk ships a first-class Svelte binding.
      "@local/svelte-i18n": "src/lib/sdk/sonenta-svelte-i18n.ts",
      // @sonenta/feedback is the REAL published npm package
      // (@sonenta/feedback@^1.2.0). No alias — it resolves to the genuine
      // package. The demo injects a fetchImpl to simulate the feedback
      // backend offline (public demo, no live backend reachable).
    },
  },
};
