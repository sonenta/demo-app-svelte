/**
 * Demo feedback backend — an injected `fetchImpl` for the REAL
 * `@sonenta/feedback` `FeedbackClient`.
 *
 * The genuine SDK (npm `@sonenta/feedback@^1.2.0`) provides every bit
 * of client logic — ToS
 * bootstrap, rotating refresh, transparent 401-retry, debounced/size-capped
 * batched flush, never-throw-into-host. Only the HTTP layer is simulated
 * here, because there is no reachable Sonenta feedback backend in the demo
 * / preview environment. `FeedbackConfig.fetchImpl` is the SDK's own,
 * contract-blessed seam for exactly this (tests / RN polyfills).
 *
 * It implements the §1–§5 wire endpoints faithfully:
 *   POST /v1/feedback/tos            → TokenBundle (server-minted grouping_key)
 *   POST /v1/feedback/token/refresh  → rotated TokenBundle
 *   GET  /v1/feedback/strings        → strings for the explicit keys
 *   POST /v1/feedback/ratings        → { accepted, rejected, items }
 *   POST /v1/feedback/suggestions    → { accepted, rejected, items }
 *
 * Ratings are kept in localStorage (per project+session+language) so a
 * player's stars survive a locale switch / reload during the demo.
 */

/** Resolves a key's rendered value in the language under test. */
export type ValueResolver = (
  namespace: string,
  key: string,
  language: string,
) => string;

const enc = (o: unknown) =>
  new Response(JSON.stringify(o), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

const uuid7ish = (): string => {
  const r = () => Math.random().toString(16).slice(2, 10);
  return `${Date.now().toString(16)}${r()}${r()}`.slice(0, 28);
};

const fnv = (s: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "h_" + (h >>> 0).toString(16).padStart(8, "0");
};

type Agg = Record<string, { sum: number; count: number; mine: number | null }>;

const TOS_VERSION = "2026-05-18"; // contract c8e86de1 §1

export function createDemoFeedbackFetch(resolve: ValueResolver): typeof fetch {
  // grouping_key is server-minted and STABLE per end_user_id — returning
  // users keep theirs (contract §1). Deriving it deterministically from
  // end_user_id keeps it stable even across client rebuilds (locale switch
  // recreates the FeedbackClient, hence this closure).
  const sessionFor = (endUser: string) => `sess_${fnv(endUser).slice(2)}`;

  const aggKey = (project: string, session: string, lang: string) =>
    `sonenta.fb.demo.${project}.${session}.${lang}`;

  const loadAgg = (k: string): Agg => {
    if (typeof localStorage === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem(k) ?? "{}") as Agg;
    } catch {
      return {};
    }
  };
  const saveAgg = (k: string, a: Agg) => {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(k, JSON.stringify(a));
    } catch {
      /* quota / private mode — non-fatal */
    }
  };

  const bundle = (project: string, endUser: string, tosVersion?: string) => {
    const session = sessionFor(endUser);
    return {
      access_token: `demo.${fnv(session)}.${Date.now().toString(36)}`,
      token_type: "Bearer" as const,
      expires_in: 1800,
      refresh_token: `demo-refresh.${fnv(session + ":r")}`,
      refresh_expires_in: 604800,
      end_user_id: endUser,
      // v4: backend records the tos_version AS-SENT by the SDK
      tos_version: tosVersion || TOS_VERSION,
      grouping_key: session, // SERVER-MINTED
    };
  };

  // closure-local notion of "current session" keyed off the bearer token;
  // for the demo a single end user is enough, so we track the last bundle.
  let lastSession = "sess_demo";
  let lastProject = "demo";

  return async function demoFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url,
    );
    const path = url.pathname;
    const method = (init?.method ?? "GET").toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    // §1 ToS acceptance → token bootstrap
    if (path.endsWith("/v1/feedback/tos") && method === "POST") {
      const project = body.project_id ?? "demo";
      const endUser = body.end_user_id ?? `eu_${uuid7ish()}`;
      const b = bundle(project, endUser, body.tos_version);
      lastSession = b.grouping_key;
      lastProject = project;
      return enc(b);
    }

    // §2 rotating refresh
    if (path.endsWith("/v1/feedback/token/refresh") && method === "POST") {
      return enc(bundle(lastProject, "eu_returning"));
    }

    // §3 strings on the current view
    if (path.endsWith("/v1/feedback/strings") && method === "GET") {
      const language = url.searchParams.get("language") ?? "en";
      const rawKeys = url.searchParams.get("keys") ?? "";
      const k = aggKey(lastProject, lastSession, language);
      const agg = loadAgg(k);
      const strings = rawKeys
        .split(",")
        .filter(Boolean)
        .map((pair) => {
          const idx = pair.indexOf(":");
          const namespace = pair.slice(0, idx);
          const key = pair.slice(idx + 1);
          const value = resolve(namespace, key, language);
          const a = agg[`${namespace}:${key}`];
          return {
            namespace,
            key,
            key_uuid: fnv(`${namespace}:${key}`),
            language_uuid: fnv(`${language}:${namespace}`),
            value,
            translation_hash: fnv(`${language}:${namespace}:${key}:${value}`),
            avg_stars: a && a.count > 0 ? a.sum / a.count : null,
            ratings_count: a ? a.count : 0,
            my_rating: a ? a.mine : null,
          };
        });
      return enc({ project_id: lastProject, language, strings });
    }

    // §4 ratings
    if (path.endsWith("/v1/feedback/ratings") && method === "POST") {
      const ratings: Array<{
        namespace: string;
        key: string;
        language: string;
        stars: number;
      }> = body.ratings ?? [];
      for (const r of ratings) {
        const k = aggKey(lastProject, lastSession, r.language);
        const agg = loadAgg(k);
        const id = `${r.namespace}:${r.key}`;
        const slot = (agg[id] ??= { sum: 0, count: 0, mine: null });
        if (slot.mine != null) {
          slot.sum += r.stars - slot.mine; // idempotent: last write wins
        } else {
          slot.sum += r.stars;
          slot.count += 1;
        }
        slot.mine = r.stars;
        saveAgg(k, agg);
      }
      return enc({ accepted: ratings.length, rejected: 0, items: [] });
    }

    // §5 suggestions — created pending; nothing auto-publishes
    if (path.endsWith("/v1/feedback/suggestions") && method === "POST") {
      const s: unknown[] = body.suggestions ?? [];
      return enc({
        accepted: s.length,
        rejected: 0,
        items: s.map((_, i) => ({ suggestion_id: `sg_${uuid7ish()}_${i}` })),
      });
    }

    return new Response(
      JSON.stringify({ type: "about:blank", code: "not_found" }),
      { status: 404, headers: { "Content-Type": "application/problem+json" } },
    );
  };
}
