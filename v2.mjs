import { createSonentaI18n } from "@sonenta/svelte-i18n";   // the REAL path my app uses
const captured = [];
const i18n = createSonentaI18n({
  token: "x", projectUuid: "00000000-0000-0000-0000-000000000000",
  namespaces: ["common"], defaultNS: "common", defaultLocale: "en", fallbackLng: "en",
  keySeparator: false,
  initialBundles: { en: { common: { "present.key": "I am here" } } },
  autoStart: false, missingHandler: "send",
  transport: (b) => captured.push(...b),
});
const read = (s) => { let v; const u = s.subscribe(x => v = x); u(); return v; };
await new Promise(r => setTimeout(r, 700));
const t = read(i18n.t);

// ARM CHECK first — prove the pipeline can report at all before believing a 0.
t("absent.key.one");
await new Promise(r => setTimeout(r, 2500));
console.log("1) ARMED? miss reported on initialBundles+autoStart:false :", captured.length, captured.length ? "YES — delivery FIXED" : "NO — still dead");

if (captured.length) {
  const n1 = captured.length;
  t("absent.key.one");                       // same key again -> should dedup
  await new Promise(r => setTimeout(r, 1200));
  console.log("2) same key re-fired (expect NO new event)          :", captured.length === n1 ? "deduped (correct)" : "re-reported (unexpected)");

  i18n.resetMissingDedup();                  // the new binding-level affordance
  t("absent.key.one");
  await new Promise(r => setTimeout(r, 1500));
  console.log("3) after resetMissingDedup(), same key              :", captured.length > n1 ? "RE-REPORTED — loop is fixable" : "STILL deduped — reset ineffective");
}
