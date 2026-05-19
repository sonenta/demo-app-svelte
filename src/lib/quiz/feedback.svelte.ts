/**
 * Quiz feedback adapter — delegates to the OFFICIAL
 * `@verbumia/feedback/svelte` headless store adapter (v3 contract
 * b6324d39; wire §1–§5 byte-identical to v2 c8e86de1). Master directive:
 * swap the hand-rolled /core wrapper → the official /svelte entry,
 * byte-identical, no rework.
 *
 * `createFeedback()` owns the wire layer (isolated open-state, client,
 * stores, rate/suggest/flush, server-minted session via the client).
 * This thin class keeps only the demo's presentation glue the headless
 * adapter intentionally leaves to the consumer: a runes mirror for the
 * panel, the ToS-consent step, the "thanks" flash, dynamic per-view keys,
 * and a locale rebuild (the client fixes `language` at construction).
 * Dual-mode is preserved: offline injects the demo `fetchImpl`; live omits
 * it so the real verbumia-api is used.
 */
import {
  createFeedback,
  type SvelteFeedback,
  type FeedbackString,
  type RatingInput,
  type SuggestionInput,
} from "@verbumia/feedback/svelte";
// v4 (contract 7980e3d4): tosVersion is NO LONGER an integrator config
// field — the SDK bakes it as a build-time constant and sends it on
// /v1/feedback/tos automatically. We only read it for display.
// v4: SDK_TOS_VERSION is the SDK build-time constant (display only).
// v5: resolveKeys() reads the rendered-key registry → RENDERED auto-
// scoping (panel = on-screen keys only; no explicit prefetch list).
import { SDK_TOS_VERSION, resolveKeys } from "@verbumia/feedback/core";
import { createDemoFeedbackFetch, type ValueResolver } from "$lib/sdk/feedback-demo-backend";
import { QUIZ_NS } from "./i18n";

export class QuizFeedback {
  open = $state(false);
  consented = $state(false);
  /** Read-only, server-minted (exposed by the official client). */
  sessionId = $state<string | null>(null);
  busy = $state(false);
  /** Bumped on client rebuild (locale switch) so the view re-loads. */
  rev = $state(0);
  strings = $state<FeedbackString[]>([]);
  flash = $state<string | null>(null);

  /** SDK-supplied build-time constant (v4) — display only. */
  readonly tosVersion = SDK_TOS_VERSION;

  private apiBase: string;
  private projectId: string;
  private live: boolean;
  private language: string;
  private resolve: ValueResolver;
  private sf: SvelteFeedback;
  private unsubOpen: () => void = () => {};
  private endUserId: string | undefined;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: {
    apiBase: string;
    projectId: string;
    live: boolean;
    language: string;
    resolve: ValueResolver;
  }) {
    this.apiBase = opts.apiBase;
    this.projectId = opts.projectId;
    this.live = opts.live;
    this.language = opts.language;
    this.resolve = opts.resolve;
    this.sf = this.build();
  }

  private build(): SvelteFeedback {
    this.unsubOpen();
    const sf = createFeedback({
      apiBase: this.apiBase,
      projectId: this.projectId,
      language: this.language,
      // v4: NO tosVersion — the SDK self-supplies SDK_TOS_VERSION.
      // v6: namespace filter — panel = rendered ∩ ns "quiz" (no nav/chrome).
      namespace: QUIZ_NS,
      endUserId: this.endUserId,
      // LIVE: real network to verbumia-api. OFFLINE (default): the
      // contract-blessed fetchImpl seam simulates the feedback backend.
      ...(this.live
        ? {}
        : { fetchImpl: createDemoFeedbackFetch(this.resolve) }),
    });
    // mirror the official isolated open-state store into runes for the panel
    this.unsubOpen = sf.isOpen.subscribe((v) => (this.open = v));
    return sf;
  }

  /** Rebuild for a new language (client fixes language at construction).
   *  Re-accepting ToS with the same end-user id keeps the server-minted
   *  session stable (contract §1). Does NOT load — the view reloads once
   *  the i18n bundle for the new locale is ready. */
  async setLanguage(lang: string) {
    if (lang === this.language) return;
    this.language = lang;
    const wasConsented = this.consented;
    const wasOpen = this.open;
    this.sf = this.build();
    // a fresh createFeedback() has its own isOpen=false store — preserve
    // the panel's visible state across the locale rebuild.
    if (wasOpen) this.sf.isOpen.set(true);
    if (wasConsented) {
      await this.sf.client.acceptTos();
      this.sessionId = this.sf.client.sessionId ?? null;
    }
    this.rev += 1;
  }

  async toggle() {
    if (this.open) {
      this.sf.close(); // official: isOpen=false + flush
      return;
    }
    this.sf.isOpen.set(true);
    if (this.consented) await this.load();
  }

  close() {
    this.sf.close();
  }

  async accept() {
    this.busy = true;
    try {
      const bundle = await this.sf.client.acceptTos();
      this.endUserId = bundle.end_user_id;
      this.consented = this.sf.client.hasConsented;
      this.sessionId = this.sf.client.sessionId ?? null;
      await this.load();
    } finally {
      this.busy = false;
    }
  }

  /** RENDERED auto-scoping (v5) + ns filter (v6): resolveKeys reads the
   *  mount-tracked registry, narrowed to ns "quiz" — exactly the on-screen
   *  trivia strings, no nav/chrome, no explicit prefetch list. */
  async load() {
    const declared = resolveKeys(undefined, QUIZ_NS);
    this.busy = true;
    try {
      const res = await this.sf.client.getStrings({
        keys: declared.length ? declared : undefined,
        namespace: QUIZ_NS,
      });
      this.strings = res.strings;
      this.sf.strings.set(res.strings);
    } finally {
      this.busy = false;
    }
  }

  private flashNow(msg: string) {
    this.flash = msg;
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => (this.flash = null), 2200);
  }

  rate(s: FeedbackString, stars: number, thanks: string) {
    const payload: RatingInput = {
      namespace: s.namespace,
      key: s.key,
      language: this.language,
      translation_hash: s.translation_hash,
      stars,
    };
    this.sf.rate(payload); // official adapter → client.rate (queued)
    this.strings = this.strings.map((x) =>
      x.key === s.key && x.namespace === s.namespace
        ? { ...x, my_rating: stars }
        : x,
    );
    this.flashNow(thanks);
    // surface fresh aggregates (avg / count) once the batch flushes
    void this.sf.client.flush().then(() => this.load());
  }

  suggest(
    s: FeedbackString,
    text: string,
    comment: string | null,
    thanks: string,
  ) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return;
    const payload: SuggestionInput = {
      namespace: s.namespace,
      key: s.key,
      language: this.language,
      translation_hash: s.translation_hash,
      suggested_text: trimmed.slice(0, 2000),
      comment: comment?.trim() ? comment.trim().slice(0, 500) : undefined,
    };
    this.sf.suggest(payload); // official adapter → client.suggest (queued)
    this.flashNow(thanks);
  }
}
