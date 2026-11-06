// Offertförfrågan: kontroll av det som skrivs in och texten på mejlet. Ren logik, testad i scripts/requests.test.mjs.
// Ingenting sparas på sajten. Mejlet till den som driver sajten är den enda kopian.
import { num } from "./format.ts";
import type { Need } from "./guide.ts";
import { MAX_PICK, ORT_MAX, REQUEST_LGH_MAX } from "./limits.ts";

/** Ändra versionen när texten nedan ändras, så att varje mejl visar vilken text som godkändes. */
export const CONSENT_VERSION = "1";
export const CONSENT_TEXT =
  "Jag godkänner att uppgifterna jag fyller i skickas vidare till de förvaltare jag har valt, så att de kan svara på förfrågan.";
export const CONSENT_MATCH_TEXT =
  "Jag godkänner att uppgifterna jag fyller i skickas till de förvaltare som passar vår förening, så att de kan kontakta oss med en offert.";

/** Det en styrelse kan välja som viktigast när den vill bli matchad. */
export const WISHES = [
  { key: "pris", label: "Lågt pris" },
  { key: "nojda", label: "Nöjda kunder" },
  { key: "personlig", label: "Personlig kontakt" },
  { key: "lokalt", label: "Kontor nära oss" },
  { key: "digitalt", label: "Digitalt och enkelt" },
  { key: "avtal", label: "Kort bindningstid" },
] as const;

export type Wish = (typeof WISHES)[number]["key"];

/**
 * Tjänster en styrelse kan kryssa i vid matchning. Nycklarna är desamma som i data/schema.json (kontrolleras av ett test),
 * men texterna är skrivna för en styrelse som inte kan branschens ord.
 */
export const SERVICES = {
  ekonomisk: [
    { key: "bokforing", label: "Löpande bokföring" },
    { key: "leverantorsfakturor", label: "Betalning av leverantörsfakturor" },
    { key: "avisering", label: "Avier för avgifter och hyror" },
    { key: "budget", label: "Budget och uppföljning" },
    { key: "arsredovisning", label: "Bokslut och årsredovisning" },
    { key: "skatt", label: "Moms, skatt och deklaration" },
    { key: "overlatelser", label: "Överlåtelser och pantsättningar" },
    { key: "lan", label: "Hjälp med föreningens lån" },
    { key: "radgivning", label: "Ekonomisk rådgivning" },
    { key: "flerars", label: "Flerårsbudget" },
    { key: "inkasso", label: "Påminnelser och inkasso" },
    { key: "imd", label: "IMD, el eller vatten per lägenhet" },
  ],
  teknisk: [
    { key: "forvaltare", label: "Fast teknisk förvaltare" },
    { key: "underhallsplan", label: "Underhållsplan" },
    { key: "besiktning", label: "Besiktningar och tillsyn" },
    { key: "ovk", label: "OVK, ventilationskontroll" },
    { key: "sba", label: "Brandskydd, SBA" },
    { key: "energi", label: "Energi och energideklaration" },
    { key: "projekt", label: "Projektledning" },
    { key: "renovering", label: "Stambyte och större renoveringar" },
    { key: "skotsel", label: "Fastighetsskötsel" },
    { key: "upphandling", label: "Upphandling av entreprenörer" },
    { key: "felanmalan", label: "Felanmälan för boende" },
    { key: "jour", label: "Jour utanför kontorstid" },
  ],
} as const;

export type ServiceCategory = keyof typeof SERVICES;

/** tjanster: styrelsen kryssar i vad den vill ha. kontakt: styrelsen vill bli kontaktad först och ta resten i offerten. */
export type Upplagg = "tjanster" | "kontakt";

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
  /** Slug för varje vald förvaltare, högst MAX_PICK. Tom när styrelsen vill bli matchad. */
  forvaltare: string[];
  /** Sant när styrelsen inte har valt förvaltare utan vill att vi föreslår lämpliga. */
  matcha: boolean;
  /** Vad styrelsen tycker är viktigast. Bara vid matchning. */
  viktigt: Wish[];
  /** Bara vid matchning. */
  upplagg: Upplagg;
  /** Tjänster per förvaltning. Tomma när upplägget är kontakt. */
  tjanster: Record<ServiceCategory, string[]>;
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

  const matcha = r.matcha === true;
  const wishKeys = new Set<string>(WISHES.map((w) => w.key));
  const viktigt = matcha && Array.isArray(r.viktigt) ? ([...new Set(r.viktigt.map(oneLine))].filter((k) => wishKeys.has(k)) as Wish[]) : [];

  const upplagg: Upplagg = r.upplagg === "kontakt" ? "kontakt" : "tjanster";
  const rawT = (r.tjanster !== null && typeof r.tjanster === "object" ? r.tjanster : {}) as Record<string, unknown>;
  const pickServices = (c: ServiceCategory): string[] => {
    if (!matcha || upplagg === "kontakt") return [];
    if (behov && behov !== "bada" && behov !== c) return [];
    const ok = new Set<string>(SERVICES[c].map((x) => x.key));
    const list = Array.isArray(rawT[c]) ? (rawT[c] as unknown[]).map(oneLine) : [];
    return SERVICES[c].map((x) => x.key as string).filter((k) => ok.has(k) && list.includes(k));
  };
  const tjanster = { ekonomisk: pickServices("ekonomisk"), teknisk: pickServices("teknisk") };

  const asked = Array.isArray(r.forvaltare) ? r.forvaltare.map(oneLine).filter((s) => s !== "") : [];
  const forvaltare = matcha ? [] : [...new Set(asked)];
  const known = new Set(ctx.slugs);
  if (matcha) {
    // Vid matchning väljer vi förvaltare, så listan ska vara tom.
  } else if (forvaltare.length === 0) errors.forvaltare = "Välj minst en förvaltare att skicka förfrågan till.";
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
    value: { forening, ort, lgh, behov: behov as Need, nuvarande, meddelande, namn, roll, epost, telefon, forvaltare, matcha, viktigt, upplagg: matcha ? upplagg : "tjanster", tjanster, samtycke: true },
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

  const wishText = v.viktigt.map((k) => WISHES.find((w) => w.key === k)?.label ?? k).join(", ");
  const lines = [
    v.matcha ? "Ny förfrågan om matchning från sajten" : "Ny offertförfrågan från sajten",
    "",
    `Förening: ${v.forening}`,
    `Ort: ${v.ort}`,
    `Antal lägenheter: ${v.lgh}`,
    `Gäller: ${NEED_TEXT[v.behov]}`,
    `Nuvarande förvaltare: ${v.nuvarande || "Anges inte"}`,
    "",
    ...(v.matcha
      ? [
          "Styrelsen vill bli matchad med lämpliga förvaltare.",
          v.upplagg === "kontakt"
            ? "Upplägg: Styrelsen vill bli kontaktad först och ta upp vad som ska ingå i offerten."
            : "Upplägg: Styrelsen har valt tjänster.",
          ...(v.upplagg === "tjanster"
            ? (["ekonomisk", "teknisk"] as const)
                .filter((c) => v.behov === "bada" || v.behov === c)
                .map((c) => {
                  const labels = v.tjanster[c].map((k) => SERVICES[c].find((x) => x.key === k)?.label ?? k);
                  return `Önskade tjänster, ${c === "ekonomisk" ? "ekonomisk" : "teknisk"} förvaltning: ${labels.join(", ") || "Inga valda"}`;
                })
            : []),
          `Viktigast för styrelsen: ${wishText || "Anges inte"}`,
        ]
      : ["Styrelsen har valt att skicka förfrågan till:", ...chosen.map((p) => `- ${p.name}, ${p.website}`)]),
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
    `Samtycke (text version ${CONSENT_VERSION}): ${v.matcha ? CONSENT_MATCH_TEXT : CONSENT_TEXT}`,
    `Mottagen: ${stamp.format(at)}`,
  ];

  return {
    subject: `${v.matcha ? "Matchning" : "Offertförfrågan"}: ${v.forening}, ${v.ort} (${v.lgh} lgh)`.slice(0, 150),
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
