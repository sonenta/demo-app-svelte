import { base } from "$app/paths";
import { setupSonenta } from "@local/svelte-i18n";
import { missingStore } from "./state/missing-store";

export const i18n = setupSonenta({
  projectId: "demo-verbumia-ca",
  apiKey: "demo-public-key",
  baseUrl: "https://api.sonenta.dev",
  // Locales sit at static/locales/, served from $base/locales/ at runtime.
  cdnUrl: `${base}/locales`,
  defaultLocale: "en",
  defaultNS: "common",
  namespaces: ["common", "quiz"],
  missingHandlerEndpoint: "https://api.sonenta.dev/v1/missing",
  debounceMs: 5000,
  transport: (batch) => missingStore.pushBatch(batch),
});

export const { t, locale, ready, setLocale, exists } = i18n;
