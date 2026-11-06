// Underlag till översikten på startsidan: en rad per förvaltare med det en styrelse frågar först.
// Ren logik utan beroenden, testad i scripts/overview.test.mjs.
import type { Pricing, Provider, Rating } from "./types.ts";

export interface Linked {
  text: string;
  url: string;
  checked: string;
}

export interface OverviewRating {
  kind: Rating["kind"];
  value: number;
  scale: 100 | 5;
  count: number | null;
  year: number | null;
  average: number | null;
  /** Bara förvaltarens ord, inte kontrollerat av någon annan. */
  ownClaim: boolean;
  text: string;
  url: string;
  checked: string;
}

export interface OverviewRow {
  slug: string;
  name: string;
  website: string;
  logo: { file: string; ratio: number } | null;
  region: string | null;
  ekonomisk: boolean;
  teknisk: boolean;
  /** Pris för ekonomisk förvaltning, null om förvaltaren inte erbjuder den. */
  pricing: Pricing | null;
  priceUrl: string | null;
  priceChecked: string | null;
  /** Vad förvaltaren säger om pris när inget belopp anges. */
  priceText: string | null;
  founded: (Linked & { year: number }) | null;
  clients: (Linked & { value: number }) | null;
  offices: (Linked & { count: number }) | null;
  employees: (Linked & { value: number }) | null;
  terms: Linked[];
  ratings: OverviewRating[];
  /** NKI från Prognoscentret, om förvaltaren har ett redovisat värde. */
  nki: OverviewRating | null;
}

/** Bygger en rad per förvaltare. Kastar om en källa saknas, vilket datakontrollen redan stoppar. */
export function overviewRows(providers: Provider[]): OverviewRow[] {
  return providers.map((p) => {
    const src = (id: string) => {
      const s = p.sources.find((x) => x.id === id);
      if (!s) throw new Error(`Källa ${id} saknas för ${p.slug}`);
      return s;
    };
    const link = <T extends { text: string; source: string }>(f: T | undefined) => {
      if (!f) return null;
      const s = src(f.source);
      return { ...f, url: s.url, checked: s.checked };
    };
    const eko = p.ekonomisk;
    const ratings: OverviewRating[] = p.facts.ratings.map((r) => {
      const s = src(r.source);
      return {
        kind: r.kind,
        value: r.value,
        scale: r.scale,
        count: r.count ?? null,
        year: r.year ?? null,
        average: r.average ?? null,
        ownClaim: r.by === "förvaltaren",
        text: r.text,
        url: s.url,
        checked: s.checked,
      };
    });
    const nki = ratings.filter((r) => r.kind === "nki").sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null;
    const pick = <T extends { text: string; source: string }>(f: T | undefined) => {
      const l = link(f);
      if (!l) return null;
      const { source: _s, ...rest } = l;
      return rest;
    };
    return {
      slug: p.slug,
      name: p.name,
      website: p.website,
      logo: p.logo ? { file: p.logo.file, ratio: p.logo.width / p.logo.height } : null,
      region: p.region,
      ekonomisk: p.services.ekonomisk === "yes",
      teknisk: p.services.teknisk === "yes",
      pricing: eko ? eko.pricing : null,
      priceUrl: eko ? src(eko.pricing.source).url : null,
      priceChecked: eko ? src(eko.pricing.source).checked : null,
      priceText: eko && eko.pricing.model === "on_request" ? eko.pricing.text : null,
      founded: pick(p.facts.founded),
      clients: pick(p.facts.clients),
      offices: pick(p.facts.offices),
      employees: pick(p.facts.employees),
      terms: p.facts.terms.map((t) => {
        const s = src(t.source);
        return { text: t.text, url: s.url, checked: s.checked };
      }),
      ratings,
      nki,
    };
  });
}

export type SortKey = "name" | "price" | "nki" | "clients";

/**
 * Sorterar raderna. Namn är standard. Övriga ordningar väljer besökaren själv, och rader som saknar
 * värdet hamnar sist i namnordning, så att ingen förvaltare straffas eller gynnas av att något saknas.
 */
export function sortRows<T extends { name: string }>(rows: T[], valueOf: (r: T) => number | null, dir: "asc" | "desc"): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "sv");
  const has = rows.filter((r) => valueOf(r) !== null);
  const missing = rows.filter((r) => valueOf(r) === null).sort(byName);
  has.sort((a, b) => {
    const d = (valueOf(a) as number) - (valueOf(b) as number);
    return d !== 0 ? (dir === "asc" ? d : -d) : byName(a, b);
  });
  return [...has, ...missing];
}
