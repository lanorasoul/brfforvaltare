// Ren logik för texten i kunskapsartiklarna. Inga beroenden, testad i scripts/posts.test.mjs.
//
// Texten i data/posts är vanlig text med två tillägg: [länktext](adress) och **fetstil**.
// Siffror som räknas ur förvaltardatan skrivs som {{nyckel}} och fylls i när sidan byggs,
// så att en artikel aldrig säger något annat än jämförelsen.

export type Inline = { kind: "text"; text: string } | { kind: "strong"; text: string } | { kind: "link"; text: string; href: string };

/** Nycklarna som artiklarna får använda. Värdena räknas ur förvaltardatan i lib/posts.ts. */
export const POST_FACT_KEYS = ["providers", "eko.total", "tek.total", "eko.priced", "tek.priced", "eko.notice", "tek.notice", "both", "nki.count", "checked"] as const;
export type PostFactKey = (typeof POST_FACT_KEYS)[number];

const MARKUP = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
const TOKEN = /\{\{([a-z][a-z0-9.]*)\}\}/g;

/** Delar upp en textrad i vanlig text, fetstil och länkar. */
export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of s.matchAll(MARKUP)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: "text", text: s.slice(last, at) });
    if (m[1] !== undefined) out.push({ kind: "link", text: m[1], href: m[2] });
    else out.push({ kind: "strong", text: m[3] });
    last = at + m[0].length;
  }
  if (last < s.length) out.push({ kind: "text", text: s.slice(last) });
  return out;
}

/** Texten utan länkar och fetstil, för sökmotorernas strukturerade data och för sidbeskrivningar. */
export function plainText(s: string): string {
  return parseInline(s)
    .map((p) => p.text)
    .join("");
}

/** Alla länkadresser i en textrad. */
export function linksIn(s: string): string[] {
  return parseInline(s).flatMap((p) => (p.kind === "link" ? [p.href] : []));
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/** Nycklarna som en textrad vill ha ifyllda. */
export function tokensIn(s: string): string[] {
  return [...s.matchAll(TOKEN)].map((m) => m[1]);
}

/** Fyller i {{nyckel}} med värden ur förvaltardatan. Okänd nyckel är ett fel, inte en tom lucka. */
export function fillTokens(s: string, facts: Record<string, string | number>): string {
  return s.replace(TOKEN, (_, key: string) => {
    if (!(key in facts)) throw new Error(`Okänd nyckel {{${key}}} i artikeltext`);
    return String(facts[key]);
  });
}

export function countWords(s: string): number {
  return plainText(s).split(/\s+/).filter(Boolean).length;
}

/** Lästid i hela minuter vid ungefär 200 ord i minuten, minst en minut. */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

/** Går igenom alla textvärden i en struktur och byter ut dem. */
export function mapStrings<T>(v: T, fn: (s: string) => string): T {
  if (typeof v === "string") return fn(v) as T;
  if (Array.isArray(v)) return v.map((x) => mapStrings(x, fn)) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapStrings(x, fn)])) as T;
  return v;
}

/** Alla textvärden i en struktur, i ordning. */
export function allStrings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(allStrings);
  if (v && typeof v === "object") return Object.values(v).flatMap(allStrings);
  return [];
}
