// Kontroll före lansering. Körs som en del av bygget (npm run build).
// På Vercel i produktion, eller med CHECK_LAUNCH=1, stoppas bygget om något hindrar en säker lansering.
// Annars skrivs läget ut och bygget fortsätter.
import { effectiveMode, launchProblems, mailConfigured, parseMode } from "../lib/launch.ts";
import { SITE } from "../lib/site.ts";

const env = process.env;
const strict = env.VERCEL_ENV === "production" || env.CHECK_LAUNCH === "1";

const state = {
  mode: parseMode(env.REQUESTS_MODE),
  indexable: SITE.indexable,
  operator: SITE.operator,
  contactEmail: SITE.contactEmail,
  mailConfigured: mailConfigured(env),
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
};

const problems = launchProblems(state);

const modeText = { off: "stängda", preview: "förhandsvisning (skickar inget)", live: "öppna" }[effectiveMode(state.mode, state.operator)];
console.log(`Förfrågningar: ${modeText}. Sökmotorer: ${state.indexable ? "öppna" : "stängda"}. Avsändare: ${state.operator ? state.operator.name : "inte angiven"}.`);

if (problems.length === 0) {
  console.log("Launch-kontroll: inget hindrar.");
  process.exit(0);
}

const prefix = strict ? "Launch-kontroll misslyckades:" : "Launch-kontroll (stoppar bara i produktion):";
console.error(prefix);
for (const p of problems) console.error(`  - ${p}`);
process.exit(strict ? 1 : 0);
