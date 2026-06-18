/**
 * Official Sonenta i18n binding — `@sonenta/svelte-i18n@0.9.0` (beta).
 *
 * Replaces the former app-owned `@local/svelte-i18n` stub with the real
 * native-Svelte-store SDK over `@sonenta/i18n-core` (i18next engine), so this
 * demo resolves translations identically to the React / Vue bindings.
 *
 * OFFLINE-first deployable model: `initialBundles` primes all locales/namespaces
 * synchronously from the static JSON (instant first paint, zero network), and
 * `autoStart: false` keeps it fully offline (no CDN/runtime fetch). The
 * missing-key handler is wired to a custom `transport` that streams events into
 * the in-memory `missingStore` so the live inspector can render them.
 *
 * Keys are FLAT dotted literals ("hero.lede", "q.1.a.1") → `keySeparator: false`.
 */
import { get, type Readable } from "svelte/store";
import { createSonentaI18n, type MissingKeyEvent } from "@sonenta/svelte-i18n";
import { missingStore } from "./state/missing-store";

// Build-time snapshot — flat {locale: {namespace: {key: value}}} (same shape as
// the CDN JSON). Imported from the static bundles the demo also ships verbatim.
import enCommon from "../../static/locales/en/common.json";
import enQuiz from "../../static/locales/en/quiz.json";
import frCommon from "../../static/locales/fr/common.json";
import frQuiz from "../../static/locales/fr/quiz.json";
import esCommon from "../../static/locales/es/common.json";
import esQuiz from "../../static/locales/es/quiz.json";

const initialBundles = {
  en: { common: enCommon, quiz: enQuiz },
  fr: { common: frCommon, quiz: frQuiz },
  es: { common: esCommon, quiz: esQuiz },
} as Record<string, Record<string, Record<string, unknown>>>;

export const i18n = createSonentaI18n({
  // Cosmetic offline placeholders — never sent anywhere (autoStart:false ⇒ no
  // fetch, and the custom transport replaces the /v1/missing POST). projectUuid
  // is the real demo-public project; token only satisfies the config type.
  token: "demo-public-key",
  projectUuid: "06a07109-3e3c-7bd7-8000-95368a87bd2e",
  namespaces: ["common", "quiz"],
  defaultNS: "common",
  defaultLocale: "en",
  fallbackLng: "en",
  keySeparator: false,
  initialBundles,
  // TRUE zero-network: `initialBundles` is primed synchronously and the key
  // registry now attaches on CONSTRUCTION (@sonenta/i18n-core@^1.0.2), so we no
  // longer need `start()` to publish it. `autoStart:false` ⇒ no CDN/manifest
  // fetch at all — no stub fetchImpl, no disable flags needed. (Was an
  // autoStart:true + 404-stub workaround on 0.9.0; sdk fixed finding #1 in 1.0.2.)
  autoStart: false,
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
