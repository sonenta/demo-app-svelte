/**
 * Generates the same-origin CDN tree the SDK fetches from, out of the locale
 * files that are the single source of truth.
 *
 * The SDK reads bundles from `cdnBase`, in ITS layout:
 *   /cdn/p/<projectUuid>/<version>/latest/<locale>/<namespace>.json
 *
 * Those are the same bundles as `static/locales/<locale>/<ns>.json`, just in a
 * different shape on disk. Keeping two hand-maintained copies would let them
 * drift silently — the app would render one set and the SDK would fetch the
 * other. So `static/cdn/` is GENERATED (and gitignored); edit `static/locales/`.
 *
 * Runs as `prebuild`, so `npm run build` (and Vercel's build) always emits it.
 */
import { mkdir, copyFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const PROJECT_UUID = "06a07109-3e3c-7bd7-8000-95368a87bd2e";
const VERSION = "main";

const SRC = "static/locales";
const DEST = `static/cdn/p/${PROJECT_UUID}/${VERSION}/latest`;

const locales = await readdir(SRC);
let n = 0;

for (const locale of locales) {
  const files = (await readdir(join(SRC, locale))).filter((f) =>
    f.endsWith(".json"),
  );
  for (const file of files) {
    const to = join(DEST, locale, file);
    await mkdir(dirname(to), { recursive: true });
    await copyFile(join(SRC, locale, file), to);
    n++;
  }
}

console.log(`sync-cdn: ${n} bundle(s) -> ${DEST}`);
