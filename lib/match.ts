// Matchningen på startsidan. Ren logik, testad i scripts/match.test.mjs.
//
// Förvaltare som inte erbjuder rätt förvaltning, eller vars sidor bara nämner andra orter, visas inte.
// Övriga sorteras efter hur väl de uppfyller det styrelsen har valt som viktigast. Varje poäng bygger på en
// uppgift med källa, och skälen skrivs ut vid varje förvaltare. Ingen förvaltare kan betala för att hamna högre.
import { fold, matchPlace, type PlaceMatch } from "./coverage.ts";
import type { OverviewRow } from "./overview.ts";
import { priceRow, type PriceRow } from "./price.ts";
import type { Coverage } from "./types.ts";

export type Need = "ekonomisk" | "teknisk" | "bada";

export type Priority = "pris" | "nojda" | "lokalt" | "etablerad" | "digitalt" | "avtal";

export const PRIORITIES: { key: Priority; label: string; help: string }[] = [
  { key: "pris", label: "Lågt pris", help: "Förvaltare som publicerar ett pris, billigast först" },
  { key: "nojda", label: "Nöjda kunder", help: "Högt NKI eller bra betyg från många omdömen" },
  { key: "lokalt", label: "Kontor nära oss", help: "Kontor på er ort" },
  { key: "etablerad", label: "Stor och etablerad", help: "Många kunder och lång historia" },
  { key: "digitalt", label: "Digitalt och enkelt", help: "Kundportal, BankID och digitala verktyg" },
  { key: "avtal", label: "Kort bindning", help: "Kort avtalstid eller uppsägningstid" },
];

export interface MatchInput {
  need: Need;
  ort: string;
  lgh: number;
  priorities: Priority[];
}

/** Det matchningen behöver om en förvaltare, utöver raden i översikten. */
export interface MatchProvider extends OverviewRow {
  coverage: { ekonomisk: Pick<Coverage, "scope" | "places"> | null; teknisk: Pick<Coverage, "scope" | "places"> | null };
  /** Antal digitala funktioner som sidan för ekonomisk förvaltning listar. */
  digital: number;
  /** Orter med kontor enligt förvaltaren. */
  places: string[];
}

export interface Match {
  row: MatchProvider;
  score: number;
  price: PriceRow | null;
  place: PlaceMatch | null;
  /** Korta skäl, ett per uppfyllt önskemål, i samma ordning som önskemålen. */
  reasons: string[];
}

export interface MatchResult {
  matches: Match[];
  /** Förvaltare som inte erbjuder rätt förvaltning. */
  wrongService: string[];
  /** Förvaltare vars sidor bara nämner andra orter. */
  otherPlaces: string[];
}

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const krNum = (v: number) => Math.round(v).toLocaleString("sv-SE").replace(/ /g, " ");

function offers(r: MatchProvider, need: Need): boolean {
  if (need === "bada") return r.ekonomisk && r.teknisk;
  return r[need];
}

/** Hur förvaltaren täcker orten. "no" om någon del som behövs bara nämner andra orter. */
function placeFor(r: MatchProvider, need: Need, ort: string): PlaceMatch | null {
  if (fold(ort) === "") return null;
  const parts = need === "bada" ? [r.coverage.ekonomisk, r.coverage.teknisk] : [r.coverage[need]];
  const res = parts.map((c) => (c ? matchPlace(c, ort) : "unknown"));
  if (res.includes("no")) return "no";
  if (res.includes("listed")) return "listed";
  if (res.every((x) => x === "national")) return "national";
  return "unknown";
}

function hasOffice(r: MatchProvider, ort: string): string | null {
  const q = fold(ort);
  if (q === "") return null;
  const all = [...r.places, ...(r.coverage.ekonomisk?.places ?? []), ...(r.coverage.teknisk?.places ?? [])];
  return all.find((p) => {
    const f = fold(p);
    return f === q || (q.length >= 3 && f.startsWith(q));
  }) ?? null;
}

function shortTerm(r: MatchProvider): string | null {
  const t = r.terms.find((x) => /ett år i taget|(en|två|tre|1|2|3) månaders? (varsel|uppsägning)/i.test(x.text));
  return t ? t.text : null;
}

export function matchProviders(rows: MatchProvider[], input: MatchInput): MatchResult {
  const wrongService: string[] = [];
  const otherPlaces: string[] = [];
  const eligible: { row: MatchProvider; place: PlaceMatch | null; price: PriceRow | null }[] = [];

  for (const row of rows) {
    if (!offers(row, input.need)) {
      wrongService.push(row.name);
      continue;
    }
    const place = placeFor(row, input.need, input.ort);
    if (place === "no") {
      otherPlaces.push(row.name);
      continue;
    }
    const price = row.pricing && input.need !== "teknisk" ? priceRow({ slug: row.slug, name: row.name, pricing: row.pricing }, input.lgh) : null;
    eligible.push({ row, place, price });
  }

  const prices = eligible.map((e) => e.price?.perYear).filter((v): v is number => typeof v === "number");
  const cheapest = prices.length > 0 ? Math.min(...prices) : null;

  const matches: Match[] = eligible.map(({ row, place, price }) => {
    let score = 0;
    const reasons: string[] = [];
    for (const p of input.priorities) {
      if (p === "pris") {
        if (price && price.perYear !== null && cheapest !== null) {
          // En tumregel eller ett exempel väger lite lättare än en prislista.
          const trust = price.kind === "list" ? 1 : 0.85;
          score += clamp(cheapest / price.perYear) * trust;
          reasons.push(`Publicerar pris: ${price.kind === "list" ? "" : "ca "}${krNum(price.perYear)} kr per år för ${input.lgh} lägenheter`);
        }
      } else if (p === "nojda") {
        if (row.nki) {
          score += clamp((row.nki.value - 60) / 20);
          const avg = row.nki.average;
          reasons.push(`NKI ${row.nki.value} i Prognoscentrets mätning ${row.nki.year}${avg ? `, snittet var ${avg}` : ""}`);
        } else {
          const rec = row.ratings.filter((x) => x.kind === "reco" && (x.count ?? 0) >= 20).sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
          if (rec) {
            score += clamp((rec.value - 2.5) / 2) * 0.8;
            reasons.push(`${rec.value.toLocaleString("sv-SE")} av 5 från ${rec.count} omdömen på Reco`);
          }
        }
      } else if (p === "lokalt") {
        const office = hasOffice(row, input.ort);
        if (office) {
          score += 1;
          reasons.push(`Finns i ${office}`);
        } else if (fold(input.ort) === "" && row.offices && row.offices.count >= 10) {
          score += 0.5;
          reasons.push(`${row.offices.count} kontor i landet`);
        }
      } else if (p === "etablerad") {
        const c = row.clients?.value ?? 0;
        const y = row.founded?.year ?? null;
        const s = clamp(c >= 3000 ? 1 : c >= 1000 ? 0.6 : c > 0 ? 0.2 : 0) * 0.7 + (y !== null && y <= 1960 ? 0.3 : 0);
        if (s > 0) {
          score += s;
          const parts = [c > 0 ? `${krNum(c)} kunder` : null, y !== null ? `grundad ${y}` : null].filter(Boolean);
          reasons.push(parts.join(", ").replace(/^./, (x) => x.toUpperCase()));
        }
      } else if (p === "digitalt") {
        if (row.digital >= 3) {
          score += clamp(row.digital / 5);
          reasons.push(`Digital kundportal med ${row.digital} listade funktioner`);
        }
      } else if (p === "avtal") {
        const t = shortTerm(row);
        if (t) {
          score += 1;
          reasons.push(t);
        }
      }
    }
    return { row, score, price, place, reasons };
  });

  matches.sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name, "sv"));
  return { matches, wrongService, otherPlaces };
}

/** Läser svaren ur adressen, så att en länk visar samma resultat. */
export function parseMatch(params: Record<string, string | string[] | undefined>): MatchInput & { asked: boolean } {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const raw = one(params.behov);
  const asked = raw === "ekonomisk" || raw === "teknisk" || raw === "bada";
  const n = Number(one(params.lgh));
  const keys = new Set(PRIORITIES.map((p) => p.key));
  const vill = (Array.isArray(params.vill) ? params.vill : one(params.vill).split(","))
    .map((s) => s.trim())
    .filter((s): s is Priority => keys.has(s as Priority));
  return {
    asked,
    need: asked ? (raw as Need) : "ekonomisk",
    ort: one(params.ort).replace(/\s+/g, " ").trim().slice(0, 60),
    lgh: Number.isFinite(n) && n >= 1 ? Math.min(999, Math.round(n)) : 30,
    priorities: [...new Set(vill)],
  };
}

export function matchQuery(i: MatchInput): string {
  const q = new URLSearchParams();
  q.set("behov", i.need);
  if (i.ort) q.set("ort", i.ort);
  q.set("lgh", String(i.lgh));
  if (i.priorities.length) q.set("vill", i.priorities.join(","));
  return q.toString();
}
