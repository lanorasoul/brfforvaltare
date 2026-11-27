// Uppgifter som är unika för en ort: vilka förvaltare som nämner den, vilka som anger kontor där, publicerade priser
// och kundnöjdhet bland förvaltarna som verkar där. Allt räknas ur förvaltarnas egna uppgifter, inget skrivs för hand.
import type { CompareRow } from "./compare.ts";
import { fold } from "./coverage.ts";
import type { GuideOutcome } from "./guide.ts";
import { priceRow } from "./price.ts";
import type { Category } from "./types.ts";

export interface PlaceFacts {
  /** Förvaltare vars egna sidor nämner orten. */
  listed: string[];
  /** Förvaltare som anger att de verkar i hela landet. */
  national: string[];
  /** Förvaltare som enligt sina sidor har kontor på orten. */
  offices: string[];
  eko: number;
  tek: number;
  /** Publicerade priser för ekonomisk förvaltning, lägst först. */
  prices: { name: string; slug: string; perYear: number; row: ReturnType<typeof priceRow> }[];
  /** Förvaltare med NKI bland dem som verkar på orten, högst först. */
  nki: { name: string; slug: string; value: number; year: number | null; average: number | null }[];
}

const word = (text: string, name: string) => new RegExp(`(^|[^a-z0-9])${fold(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(fold(text));

/** Sant när en mening i texten talar om kontor och nämner orten som eget ord, eller som "<ort>sområdet". "Stockholmsvägen" räknas inte. */
export function mentionsOffice(text: string, place: string): boolean {
  return text
    .split(/(?<=\.)\s+/)
    .some((s) => /kontor/i.test(s) && (word(s, place) || word(s, `${place}sområdet`)));
}

export function placeFacts(place: string, outcomes: Record<Category, GuideOutcome<CompareRow>>, officeTexts: Record<string, string[]>, n: number): PlaceFacts {
  const best = new Map<string, { name: string; slug: string; match: "listed" | "national"; rows: CompareRow[] }>();
  const count: Record<Category, number> = { ekonomisk: 0, teknisk: 0 };
  for (const c of Object.keys(outcomes) as Category[]) {
    for (const r of outcomes[c].results) {
      if (r.match !== "listed" && r.match !== "national") continue;
      count[c]++;
      const row = r.rows[c];
      const prev = best.get(r.slug);
      const match = prev?.match === "listed" || r.match === "listed" ? "listed" : "national";
      best.set(r.slug, { name: r.name, slug: r.slug, match, rows: [...(prev?.rows ?? []), ...(row ? [row] : [])] });
    }
  }
  const all = [...best.values()].sort((a, b) => a.name.localeCompare(b.name, "sv"));

  const prices = all
    .flatMap((x) => {
      const row = x.rows.find((r) => r.category === "ekonomisk");
      if (!row) return [];
      const p = priceRow({ slug: row.slug, name: row.name, pricing: row.pricing }, n);
      return p.perYear === null ? [] : [{ name: x.name, slug: x.slug, perYear: p.perYear, row: p }];
    })
    .sort((a, b) => a.perYear - b.perYear);

  const nki = all
    .flatMap((x) => {
      const v = x.rows.find((r) => r.nki)?.nki;
      return v ? [{ name: x.name, slug: x.slug, value: v.value, year: v.year, average: v.average }] : [];
    })
    .sort((a, b) => b.value - a.value);

  return {
    listed: all.filter((x) => x.match === "listed").map((x) => x.name),
    national: all.filter((x) => x.match === "national").map((x) => x.name),
    offices: all.filter((x) => (officeTexts[x.slug] ?? []).some((t) => mentionsOffice(t, place))).map((x) => x.name),
    eko: count.ekonomisk,
    tek: count.teknisk,
    prices,
    nki,
  };
}

/** "A", "A och B", "A, B och C". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} och ${names.at(-1)}`;
}
