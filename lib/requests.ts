// Offertförfrågan: kontroll av det som skrivs in och texten på mejlet. Ren logik, testad i scripts/requests.test.mjs.
// Ingenting sparas på sajten. Mejlet till den som driver sajten är den enda kopian.
import { num } from "./format.ts";
import type { Need } from "./guide.ts";
import { MAX_PICK, ORT_MAX, REQUEST_LGH_MAX } from "./limits.ts";

/** Ändra versionen när texten nedan ändras, så att varje mejl visar vilken text som godkändes. */
export const CONSENT_VERSION = "1";
export const CONSENT_TEXT =
  "Jag godkänner att uppgifterna jag fyller i skickas vidare till de förvaltare jag har valt, så att de kan svara på förfrågan.";

/** Längsta tillåtna text per fält. Längre text avvisas, den kapas aldrig i tysthet. */
export const LIMITS = { forening: 80, ort: ORT_MAX, nuvarande: 80, meddelande: 1500, namn: 80, roll: 60, epost: 120, telefon: 24 } as const;

/** Ett formulär som skickas snabbare än så är inte ifyllt av en människa. */
export const MIN_FILL_MS = 2500;

/** Största kropp vi läser, i tecken. Ett riktigt formulär är långt under en tiondel av det. */
export const MAX_BODY_CHARS = 20_000;

export interface RequestInput {
  forening: string;
  ort: string;
  lgh: number;
  behov: Need;
  nuvarande: string;
  meddelande: string;
  namn: string;
  roll: string;
  epost: string;
  telefon: string;
  /** Slug för varje vald förvaltare, högst MAX_PICK. */
  forvaltare: string[];
  samtycke: true;
}

export type FieldErrors = Partial<Record<keyof RequestInput | "form", string>>;

export type RequestCheck =
  | { kind: "ok"; value: RequestInput }
  | { kind: "invalid"; errors: FieldErrors }
  /** Det dolda fältet var ifyllt eller tiden saknas. Svara som om det gick bra och skicka ingenting. */
  | { kind: "bot" }
  /** Allt är rätt ifyllt men formuläret skickades för snabbt. Be om nytt försök. */
  | { kind: "toofast" };

/** Svaret från /api/forfragan. Formuläret i webbläsaren läser den här formen. */
export type SubmitResponse =
  | { ok: true; mode: "live" }
  | { ok: true; mode: "preview"; preview: { subject: string; text: string } }
  | { ok: false; reason: "invalid"; errors: FieldErrors }
  | { ok: false; reason: "toofast" | "closed" | "unavailable" | "origin" | "toolarge"; message: string };

// Styrtecken utom tab och radbrytning, samt osynliga riktningstecken som kan dölja text i ett mejl.
const CONTROL = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

const asText = (v: unknown): string => (typeof v === "string" ? v : "");

/** En rad: styrtecken bort och alla mellanrum till ett enda blanksteg. */
export function oneLine(v: unknown): string {
  return asText(v).replace(CONTROL, "").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
}

/** Flera rader: radbrytningar bevaras, men inte fler än en tom rad i följd. */
export function manyLines(v: unknown): string {
  return asText(v)
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(INVISIBLE, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function looksLikeEmail(s: string): boolean {
  return s.length <= LIMITS.epost && EMAIL.test(s) && !s.includes("..");
}

export function looksLikePhone(s: string): boolean {
  return /^[0-9+()\- ]+$/.test(s) && s.replace(/\D/g, "").length >= 6 && s.length <= LIMITS.telefon;
}

const NEEDS: Need[] = ["ekonomisk", "teknisk", "bada"];

/**
 * Kontrollerar ett inkommande formulär. raw är det okända som kom från webbläsaren.
 * slugs är de förvaltare som finns, now är klockan i millisekunder.
 */
export function validateRequest(raw: unknown, ctx: { slugs: readonly string[]; now: number }): RequestCheck {
  const r = (raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<string, unknown>;

  // Spamskydd. Fältet "webbplats" är dolt för människor, så en bot som fyller i allt fyller i det också.
  if (oneLine(r.webbplats) !== "") return { kind: "bot" };
  const t = typeof r.t === "number" ? r.t : Number.NaN;
  if (!Number.isFinite(t) || t > ctx.now + 60_000) return { kind: "bot" };

  const errors: FieldErrors = {};

  const forening = oneLine(r.forening);
  if (forening.length < 2) errors.forening = "Skriv föreningens namn.";
  else if (forening.length > LIMITS.forening) errors.forening = `Namnet är för långt. Använd högst ${LIMITS.forening} tecken.`;

  const ort = oneLine(r.ort);
  if (ort.length < 2) errors.ort = "Skriv vilken ort föreningen ligger i.";
  else if (ort.length > LIMITS.ort) errors.ort = `Ortsnamnet är för långt. Använd högst ${LIMITS.ort} tecken.`;

  const lghRaw = typeof r.lgh === "number" ? r.lgh : Number(oneLine(r.lgh).replace(/\s/g, ""));
  const lgh = Number.isInteger(lghRaw) && lghRaw >= 1 && lghRaw <= REQUEST_LGH_MAX ? lghRaw : Number.NaN;
  if (Number.isNaN(lgh)) errors.lgh = `Ange antal lägenheter som ett heltal mellan 1 och ${num(REQUEST_LGH_MAX)}.`;

  const behov = NEEDS.find((n) => n === r.behov);
  if (!behov) errors.behov = "Välj vad ni vill ha offert på.";

  const asked = Array.isArray(r.forvaltare) ? r.forvaltare.map(oneLine).filter((s) => s !== "") : [];
  const forvaltare = [...new Set(asked)];
  const known = new Set(ctx.slugs);
  if (forvaltare.length === 0) errors.forvaltare = "Välj minst en förvaltare att skicka förfrågan till.";
  else if (forvaltare.length > MAX_PICK) errors.forvaltare = "Välj högst tre förvaltare.";
  else if (forvaltare.some((s) => !known.has(s))) errors.forvaltare = "En av förvaltarna finns inte längre i listan. Gå tillbaka och välj igen.";

  const nuvarande = oneLine(r.nuvarande);
  if (nuvarande.length > LIMITS.nuvarande) errors.nuvarande = `Texten är för lång. Använd högst ${LIMITS.nuvarande} tecken.`;

  const meddelande = manyLines(r.meddelande);
  if (meddelande.length > LIMITS.meddelande) errors.meddelande = `Meddelandet är för långt. Korta ner det till högst ${num(LIMITS.meddelande)} tecken.`;

  const namn = oneLine(r.namn);
  if (namn.length < 2) errors.namn = "Skriv ert namn.";
  else if (namn.length > LIMITS.namn) errors.namn = `Namnet är för långt. Använd högst ${LIMITS.namn} tecken.`;

  const roll = oneLine(r.roll);
  if (roll.length > LIMITS.roll) errors.roll = `Texten är för lång. Använd högst ${LIMITS.roll} tecken.`;

  const epost = oneLine(r.epost);
  if (epost === "") errors.epost = "Skriv en e-postadress som förvaltaren kan svara till.";
  else if (!looksLikeEmail(epost)) errors.epost = "E-postadressen ser inte rätt ut. Kontrollera att den har ett @ och en ändelse.";

  const telefon = oneLine(r.telefon);
  if (telefon !== "" && !looksLikePhone(telefon)) errors.telefon = "Telefonnumret ser inte rätt ut. Lämna fältet tomt om ni inte vill ange något.";

  if (r.samtycke !== true) errors.samtycke = "Godkänn att uppgifterna skickas vidare, annars kan vi inte skicka förfrågan.";

  if (Object.keys(errors).length > 0) return { kind: "invalid", errors };
  if (ctx.now - t < MIN_FILL_MS) return { kind: "toofast" };

  return {
    kind: "ok",
    value: { forening, ort, lgh, behov: behov as Need, nuvarande, meddelande, namn, roll, epost, telefon, forvaltare, samtycke: true },
  };
}

export interface MailProvider {
  slug: string;
  name: string;
  website: string;
}

const NEED_TEXT: Record<Need, string> = {
  ekonomisk: "Ekonomisk förvaltning",
  teknisk: "Teknisk förvaltning",
  bada: "Ekonomisk och teknisk förvaltning",
};

const stamp = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Stockholm" });

/** Mejlet till den som driver sajten. Ren text, så att inget i en inmatad text kan tolkas som kod i mejlprogrammet. */
export function buildEmail(v: RequestInput, providers: MailProvider[], at: Date): { subject: string; text: string; replyTo: string } {
  const chosen = v.forvaltare.map((slug) => providers.find((p) => p.slug === slug)).filter((p): p is MailProvider => p !== undefined);

  const lines = [
    "Ny offertförfrågan från sajten",
    "",
    `Förening: ${v.forening}`,
    `Ort: ${v.ort}`,
    `Antal lägenheter: ${v.lgh}`,
    `Gäller: ${NEED_TEXT[v.behov]}`,
    `Nuvarande förvaltare: ${v.nuvarande || "Anges inte"}`,
    "",
    "Styrelsen har valt att skicka förfrågan till:",
    ...chosen.map((p) => `- ${p.name}, ${p.website}`),
    "",
    "Kontakt:",
    `Namn: ${v.namn}`,
    `Roll i föreningen: ${v.roll || "Anges inte"}`,
    `E-post: ${v.epost}`,
    `Telefon: ${v.telefon || "Anges inte"}`,
    "",
    "Meddelande:",
    v.meddelande || "Inget meddelande.",
    "",
    `Samtycke (text version ${CONSENT_VERSION}): ${CONSENT_TEXT}`,
    `Mottagen: ${stamp.format(at)}`,
  ];

  return {
    subject: `Offertförfrågan: ${v.forening}, ${v.ort} (${v.lgh} lgh)`.slice(0, 150),
    text: lines.join("\n"),
    replyTo: v.epost,
  };
}

/** Anropet kommer från sajtens egen sida om Origin pekar på samma värd som Host. */
export function sameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
