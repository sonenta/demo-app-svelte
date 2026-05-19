import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: "dist",
      assets: "dist",
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    prerender: {
      handleHttpError: "warn",
      handleMissingId: "ignore",
    },
    alias: {
      "@verbumia/svelte-i18n": "src/lib/sdk/verbumia-svelte-i18n.ts",
      // @verbumia/feedback is consumed as the REAL local npm-pack
      // (vendor/verbumia-feedback-0.1.0.tgz, source == frozen contract
      // c8e86de1, sha256 verified). No alias — it resolves to the genuine
      // package. The demo injects a fetchImpl to simulate the feedback
      // backend offline; swap the file: dep for the npm version + dist-tag
      // once backend broadcasts the published release.
    },
  },
};
