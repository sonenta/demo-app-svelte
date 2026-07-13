/**
 * Official Sonenta i18n binding — `@sonenta/svelte-i18n@0.9.0` (beta).
 *
 * Replaces the former app-owned `@local/svelte-i18n` stub with the real
 * native-Svelte-store SDK over `@sonenta/i18n-core` (i18next engine), so this
 * demo resolves translations identically to the React / Vue bindings.
 *
 * SELF-HOSTED CDN model (master-approved 2026-07-13). The bundles are served
 * from a same-origin `cdnBase` — static files shipped in this build, in the
 * SDK's own CDN layout (`/cdn/p/<uuid>/<version>/latest/<locale>/<ns>.json`).
 * Still zero EXTERNAL network: every fetch is same-origin against our own
 * `static/` output. The missing-key handler streams events through a custom
 * `transport` into the in-memory `missingStore` for the live inspector.
 *
 * WHY NOT `initialBundles` + `autoStart:false` (the previous config): that
 * combination SILENTLY DISABLES MISSING-KEY REPORTING. i18n-core's
 * `_handleMissing` early-returns unless `_attempted.has(cacheKey)`, and
 * `_attempted` is only ever populated inside `_loadBundle`'s `finally` — so with
 * no fetch, nothing is ever "attempted" and every miss is discarded, with no
 * error. It killed this demo's centrepiece in production for weeks. Fetching our
 * own bundles makes `_loadBundle` run, which releases the guard.
 * This is a WORKAROUND FOR OUR APP ONLY — the core bug is still open with `sdk`
 * as a P1 (offline-first consumers remain broken); do not treat it as closed.
 *
 * Keys are FLAT dotted literals ("hero.lede", "q.1.a.1") → `keySeparator: false`.
 * Do NOT drop `keySeparator` — without it the SDK probes the API for key_style,
 * which 401s on a public demo (per demo-app-vue).
 */
import { get, type Readable } from "svelte/store";
import { base } from "$app/paths";
import { createSonentaI18n, type MissingKeyEvent } from "@sonenta/svelte-i18n";
import { missingStore } from "./state/missing-store";

export const i18n = createSonentaI18n({
  // `token` only satisfies the config type — nothing is sent anywhere: the CDN
  // is same-origin static files and the custom transport replaces the
  // /v1/missing POST. projectUuid is the real demo-public project, and is part
  // of the CDN path below.
  token: "demo-public-key",
  projectUuid: "06a07109-3e3c-7bd7-8000-95368a87bd2e",
  namespaces: ["common", "quiz"],
  defaultNS: "common",
  defaultLocale: "en",
  fallbackLng: "en",
  keySeparator: false,
  // Our OWN bundles, same-origin, in the SDK's CDN layout. autoStart is left at
  // its default (true) so `_loadBundle` actually runs — that is what releases
  // the missing-key guard. See the header note.
  cdnBase: `${base}/cdn`,
  version: "main",
  // The manifest/catalog endpoints only exist on the real CDN; we ship bundles
  // only. Disabling them keeps the network clean (no 404s per visitor).
  disableLanguageManifest: true,
  disableLanguageCatalog: true,
  // Capture every fallback the SDK serves and pipe it into the live inspector.
  missingHandler: "send",
  transport: (batch: MissingKeyEvent[]) =>
    missingStore.pushBatch(
      batch.map((e) => ({
        key: e.key,
        ns: e.namespace,
        locale: e.language_code,
        ts: Date.now(),
        fallback: e.source_value ?? e.key,
      })),
    ),
});

// --- Compatibility re-exports -------------------------------------------------
// The app was written against the stub's names; alias the official store API so
// components keep importing `locale` / `setLocale` / `exists` unchanged.
export const t = i18n.t;
export const ready = i18n.ready;
/** Active language (BCP-47) — read-only store; was `locale` on the stub. */
export const locale: Readable<string> = i18n.language;
/** Change the active language; was `setLocale` on the stub. */
export const setLocale = (l: string) => void i18n.setLanguage(l);

/** Does `key` resolve in `ns`? (i18next returns the key itself on a miss.) */
export function exists(key: string, ns?: string): boolean {
  const fn = get(i18n.t);
  return fn(key, { ns }) !== key;
}
