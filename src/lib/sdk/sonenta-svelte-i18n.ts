/**
 * Local stub of @sonenta/svelte-i18n.
 *
 * Idiomatic Svelte adaptation of the V1 SDK contract that the React peer
 * already ships in @sonenta/react-i18next:
 *   - setupSonenta(opts)  →  I18nInstance with reactive stores
 *   - i18n.t               →  Readable<(key, opts?) => string>     (use as $t)
 *   - i18n.locale          →  Writable<string>
 *   - i18n.ready           →  Readable<boolean>                     (defaultNS attempted)
 *   - i18n.exists(key,ns?) →  boolean
 *   - opts.transport?      →  override the default POST to missingHandlerEndpoint
 *
 * Bundles are fetched from a CDN-shaped path:
 *   {cdnUrl}/{lang}/{ns}.json   (or {cdnUrl} with {projectId}/{lang}/{namespace} placeholders)
 *
 * Missing-key detections are debounced into batches and dispatched to a
 * transport function (default: POST to missingHandlerEndpoint). The demo wires
 * a custom transport that pipes events into an in-memory store so the live
 * inspector can render them; in production the same batches reach the
 * backend's /v1/missing endpoint, fan out via Centrifugo, and surface in the
 * client-admin dashboard.
 *
 * Mirrors React stub semantics 1:1: skip-until-attempted, per-event dedupe,
 * keepalive POST, transport failure isolation. Replace with `npm i
 * @sonenta/svelte-i18n` once the real package is published — same surface,
 * same behaviour.
 */
import { derived, get, writable, type Readable, type Writable } from "svelte/store";

export type Locale = string;
export type Namespace = string;

export type MissingKeyEvent = {
  key: string;
  ns: Namespace;
  locale: Locale;
  ts: number;
  fallback: string;
};

export type MissingKeyTransport = (
  batch: MissingKeyEvent[],
) => void | Promise<void>;

export type SetupOptions = {
  projectId: string;
  apiKey: string;
  baseUrl?: string;
  cdnUrl?: string;
  defaultLocale?: Locale;
  defaultNS?: Namespace;
  namespaces?: Namespace[];
  missingHandlerEndpoint?: string;
  debounceMs?: number;
  transport?: MissingKeyTransport;
  fetcher?: typeof fetch;
};

export type TOptions = {
  ns?: Namespace;
  defaultValue?: string;
  values?: Record<string, string | number>;
};

export type TFunction = (key: string, opts?: TOptions) => string;

export type I18nInstance = {
  locale: Writable<Locale>;
  ready: Readable<boolean>;
  t: Readable<TFunction>;
  exists: (key: string, ns?: Namespace) => boolean;
  setLocale: (l: Locale) => void;
  flushMissing: () => Promise<void>;
};

type Bundle = Record<string, string>;
type LocaleBundles = Record<Namespace, Bundle>;
type AllBundles = Record<Locale, LocaleBundles>;

const interpolate = (
  template: string,
  values?: Record<string, string | number>,
): string => {
  if (!values) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) =>
    values[k] != null ? String(values[k]) : `{{${k}}}`,
  );
};

const lookup = (
  bundles: AllBundles,
  locale: Locale,
  ns: Namespace,
  key: string,
): string | undefined => bundles[locale]?.[ns]?.[key];

const attemptedKey = (locale: Locale, ns: Namespace) => `${locale}::${ns}`;

const resolveBundleUrl = (
  cdnUrl: string,
  projectId: string,
  locale: Locale,
  ns: Namespace,
) => {
  if (cdnUrl.includes("{")) {
    return cdnUrl
      .replace("{projectId}", projectId)
      .replace("{lang}", locale)
      .replace("{namespace}", ns);
  }
  return `${cdnUrl}/${locale}/${ns}.json`;
};

export function setupSonenta(opts: SetupOptions): I18nInstance {
  const {
    projectId,
    apiKey: _apiKey,
    baseUrl: _baseUrl,
    cdnUrl = "/locales",
    defaultLocale = "en",
    defaultNS = "common",
    namespaces = ["common"],
    missingHandlerEndpoint,
    debounceMs = 5000,
    transport,
    fetcher,
  } = opts;

  const locale = writable<Locale>(defaultLocale);
  const bundles = writable<AllBundles>({});
  const attempted = writable<Set<string>>(new Set());

  const queue: MissingKeyEvent[] = [];
  const seen = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const fetchImpl: typeof fetch =
    fetcher ?? (typeof fetch !== "undefined" ? fetch : (async () => {
      throw new Error("[sonenta] no fetch available");
    }) as unknown as typeof fetch);

  const loadLocale = async (loc: Locale) => {
    // server / prerender: skip — bundles will load on hydrate.
    if (typeof window === "undefined") return;
    const next: LocaleBundles = {};
    const justAttempted: string[] = [];
    for (const ns of namespaces) {
      const url = resolveBundleUrl(cdnUrl, projectId, loc, ns);
      try {
        const res = await fetchImpl(url, { cache: "no-cache" });
        if (res.ok) next[ns] = (await res.json()) as Bundle;
      } catch {
        // network failure is non-fatal; we still mark the bundle attempted so
        // subsequent t() calls can flag missing keys instead of staying silent.
      }
      justAttempted.push(attemptedKey(loc, ns));
    }
    bundles.update((prev) => ({ ...prev, [loc]: { ...prev[loc], ...next } }));
    attempted.update((prev) => {
      const merged = new Set(prev);
      for (const k of justAttempted) merged.add(k);
      return merged;
    });
  };

  // load on every locale change.
  let lastLoaded: Locale | null = null;
  locale.subscribe((loc) => {
    if (loc === lastLoaded) return;
    lastLoaded = loc;
    void loadLocale(loc);
  });

  const flushMissing = async () => {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    if (transport) {
      try {
        await transport(batch);
      } catch {
        // transport failures must not break the app.
      }
      return;
    }
    if (missingHandlerEndpoint) {
      try {
        await fetchImpl(missingHandlerEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Verbumia-Project": projectId,
          },
          body: JSON.stringify({ events: batch }),
          keepalive: true,
        });
      } catch {
        // network failure is fine — batches are best-effort observability.
      }
    }
  };

  const reportMissing = (
    key: string,
    ns: Namespace,
    loc: Locale,
    fallback: string,
  ) => {
    // skip until the bundle for this {locale, ns} has been fetch-attempted —
    // otherwise the very first paint marks every consumed key as missing.
    if (!get(attempted).has(attemptedKey(loc, ns))) return;
    const dedupeKey = `${loc}::${ns}::${key}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    queue.push({ key, ns, locale: loc, ts: Date.now(), fallback });
    if (timer == null) {
      timer = setTimeout(() => void flushMissing(), debounceMs);
    }
  };

  const ready: Readable<boolean> = derived(attempted, ($a) =>
    $a.has(attemptedKey(get(locale), defaultNS)),
  );

  const t: Readable<TFunction> = derived(
    [locale, bundles, attempted],
    ([$locale, $bundles, _$attempted]) => {
      const fn: TFunction = (key, options = {}) => {
        const useNS = options.ns ?? defaultNS;
        const hit = lookup($bundles, $locale, useNS, key);
        if (hit != null) return interpolate(hit, options.values);
        const fallback = options.defaultValue ?? key;
        reportMissing(key, useNS, $locale, fallback);
        return interpolate(fallback, options.values);
      };
      return fn;
    },
  );

  const exists = (key: string, ns?: Namespace) =>
    lookup(get(bundles), get(locale), ns ?? defaultNS, key) != null;

  const setLocale = (l: Locale) => locale.set(l);

  return {
    locale,
    ready,
    t,
    exists,
    setLocale,
    flushMissing,
  };
}
