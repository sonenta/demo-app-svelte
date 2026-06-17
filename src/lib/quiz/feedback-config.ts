/**
 * Feedback mode resolver — dual-mode is the standard for all Sonenta
 * demos (master decision, kb sdk/demo-live-provisioning).
 *
 *  • DEFAULT (offline): an injected demo `fetchImpl` simulates the
 *    feedback backend. This is the deployable static showcase — works on
 *    Vercel, offline, anywhere. Robust and self-contained.
 *
 *  • LIVE (opt-in, local-dev only): set `VITE_FEEDBACK_LIVE=1` before
 *    `vite dev` / `vite build`. The injected fetchImpl is dropped and the
 *    real `@sonenta/feedback/core` client talks to the running
 *    sonenta-api: genuine tos → server-minted session → getStrings →
 *    ratings/suggestions → realtime `feedback:` channel.
 *
 * Live config is the canonical shared demo project (resolve kb by topic
 * sdk/demo-live-provisioning — kb_id rotates per revision). Live mode
 * rates the quiz-namespace keys; the full loop returns values once the
 * backend quiz-ns seed import into project 06a07109 lands (master-tasked).
 */

export type FeedbackMode = {
  live: boolean;
  apiBase: string;
  projectId: string;
};

// Vite inlines import.meta.env.* at build time; truthy only when the
// operator explicitly opts in. Any non-empty value other than "0"/"false".
const flag = import.meta.env.VITE_FEEDBACK_LIVE as string | undefined;
const LIVE = !!flag && flag !== "0" && flag !== "false";

const OFFLINE: FeedbackMode = {
  live: false,
  // unused offline (the injected fetchImpl never performs real I/O)
  apiBase: "https://api.sonenta.dev",
  projectId: "demo-verbumia-ca",
};

const LIVE_CFG: FeedbackMode = {
  live: true,
  // canonical shared demo project (kb sdk/demo-live-provisioning, task 613)
  apiBase: "http://localhost:8820",
  projectId: "06a07109-3e3c-7bd7-8000-95368a87bd2e",
};

export const FEEDBACK_MODE: FeedbackMode = LIVE ? LIVE_CFG : OFFLINE;
