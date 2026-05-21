import { base } from "$app/paths";
import { setupVerbumia } from "@verbumia/svelte-i18n";
import { missingStore } from "./state/missing-store";

export const i18n = setupVerbumia({
  projectId: "demo-verbumia-ca",
  apiKey: "demo-public-key",
  baseUrl: "https://api.verbumia.ca",
  // Locales sit at static/locales/, served from $base/locales/ at runtime.
  cdnUrl: `${base}/locales`,
  defaultLocale: "en",
  defaultNS: "common",
  namespaces: ["common", "quiz"],
  missingHandlerEndpoint: "https://api.verbumia.ca/v1/missing",
  debounceMs: 5000,
  transport: (batch) => missingStore.pushBatch(batch),
});

export const { t, locale, ready, setLocale, exists } = i18n;
