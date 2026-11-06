// Lägen och kontroller före lansering. Ren logik, testad i scripts/launch.test.mjs.
// Förfrågningar är stängda tills den som driver sajten är angiven i lib/site.ts och läget sätts till live.
import { SITE } from "./site.ts";

/**
 * off: förfrågningsformuläret är stängt (standard).
 * preview: formuläret fungerar men ingenting skickas. Svaret visar mejlet som skulle ha gått iväg. Bara för test.
 * live: förfrågningar skickas som mejl till den som driver sajten.
 */
export type RequestsMode = "off" | "preview" | "live";

type Env = Record<string, string | undefined>;

export function parseMode(v: string | undefined): RequestsMode {
  return v === "preview" || v === "live" ? v : "off";
}

/** Live utan angiven avsändare räknas som stängt, så att inga personuppgifter tas emot av någon som inte står på sajten. */
export function effectiveMode(mode: RequestsMode, operator: unknown): RequestsMode {
  return mode === "live" && !operator ? "off" : mode;
}

/** Läget som gäller just nu. Läses vid varje anrop på servern. Får inte importeras från en klientkomponent. */
export function currentMode(env: Env = process.env): RequestsMode {
  return effectiveMode(parseMode(env.REQUESTS_MODE), SITE.operator);
}

export function mailConfigured(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY && env.REQUEST_TO_EMAIL && env.REQUEST_FROM_EMAIL);
}

export interface LaunchState {
  mode: RequestsMode;
  indexable: boolean;
  operator: unknown;
  contactEmail: unknown;
  mailConfigured: boolean;
  /** Värdet i NEXT_PUBLIC_SITE_URL. Utan det pekar kanoniska adresser och sitemap på arbetsnamnets domän. */
  siteUrl?: string;
}

/** Skäl till att en publik driftsättning inte ska släppas igenom. Tom lista betyder att inget hindrar. */
export function launchProblems(s: LaunchState): string[] {
  const out: string[] = [];
  if (s.mode === "preview") out.push("REQUESTS_MODE=preview får inte köras publikt. Förhandsvisningen skickar ingenting vidare.");
  if (s.mode === "live" && !s.operator) out.push("REQUESTS_MODE=live kräver att operator är satt i lib/site.ts.");
  if (s.mode === "live" && !s.mailConfigured) out.push("REQUESTS_MODE=live kräver RESEND_API_KEY, REQUEST_TO_EMAIL och REQUEST_FROM_EMAIL.");
  if (s.indexable && !s.operator) out.push("NEXT_PUBLIC_INDEXABLE=true kräver att operator är satt i lib/site.ts.");
  if (s.indexable && !s.contactEmail) out.push("NEXT_PUBLIC_INDEXABLE=true kräver att contactEmail är satt i lib/site.ts.");
  if (s.indexable && !/^https:\/\/[^/]+$/.test(s.siteUrl ?? "")) {
    out.push("NEXT_PUBLIC_INDEXABLE=true kräver att NEXT_PUBLIC_SITE_URL är sajtens riktiga adress, till exempel https://exempel.se (utan snedstreck sist).");
  }
  return out;
}
