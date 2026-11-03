// Gör om förvaltarnas data till enkla rader som kan skickas till webbläsaren.
// Ingen filläsning här, så att klientkomponenter kan importera typerna och hjälpfunktionerna.
import { placeOptions } from "./coverage";
import { withBlock } from "./schema";
import type { Category, Coverage, Extra, FeatureState, Level, Presence, Pricing, Provider, Service, ServiceBlock } from "./types";

export interface SourceRef {
  url: string;
  title: string;
  checked: string;
}

export interface CompareRow {
  slug: string;
  name: string;
  category: Category;
  region: string | null;
  summary: string;
  /** Huvudsidan för den här delen av förvaltningen. */
  source: SourceRef;
  pricing: Pricing;
  pricingSource: SourceRef;
  /** Tillval som förvaltaren anger ett pris för, med första meningen av prisuppgiften och sidan priset står på. */
  pricedExtras: { label: string; price: string; source: SourceRef }[];
  notice: string | null;
  coverage: { scope: Coverage["scope"]; text: string; places: string[]; source: SourceRef };
  counts: { included: number; extras: number; levels: number; reporting: number };
  levelNames: string[];
  features: Record<string, FeatureState>;
  disclosure: Record<string, Presence>;
  /** Senaste datum då vi läste en sida från förvaltaren. */
  checked: string;
}

export interface MissingRow {
  slug: string;
  name: string;
  state: Service;
}

export interface CompareData {
  rows: Record<Category, CompareRow[]>;
  /** Förvaltare som saknar kategorin, med vad deras sida säger. */
  missing: Record<Category, MissingRow[]>;
  places: string[];
  providerCount: number;
  checkedAt: string;
}

/** "499 kr per månad exklusive moms. Avtalet löper 12 månader." blir "499 kr per månad exklusive moms". */
export function firstSentence(s: string): string {
  const i = s.search(/\.(\s|$)/);
  return (i === -1 ? s : s.slice(0, i)).trim();
}

function ref(p: Provider, id: string): SourceRef {
  const s = p.sources.find((x) => x.id === id);
  if (!s) throw new Error(`Källa ${id} saknas för ${p.slug}`);
  return { url: s.url, title: s.title, checked: s.checked };
}

function rowOf(p: Provider, category: Category, b: ServiceBlock): CompareRow {
  return {
    slug: p.slug,
    name: p.name,
    category,
    region: p.region,
    summary: b.summary,
    source: ref(p, b.source),
    pricing: b.pricing,
    pricingSource: ref(p, b.pricing.source),
    pricedExtras: b.extras.flatMap((e) =>
      e.price ? [{ label: e.label, price: firstSentence(e.price), source: ref(p, e.source ?? b.pricing.source) }] : [],
    ),
    notice: b.terms.notice,
    coverage: { scope: b.coverage.scope, text: b.coverage.text, places: b.coverage.places, source: ref(p, b.coverage.source) },
    counts: { included: b.included.length, extras: b.extras.length, levels: b.levels.length, reporting: b.reporting.length },
    levelNames: b.levels.map((l) => l.name),
    features: b.features,
    disclosure: b.disclosure,
    checked: p.checked,
  };
}

export function buildCompareData(providers: Provider[], checkedAt: string): CompareData {
  const rows = { ekonomisk: [] as CompareRow[], teknisk: [] as CompareRow[] };
  const missing = { ekonomisk: [] as MissingRow[], teknisk: [] as MissingRow[] };

  for (const category of ["ekonomisk", "teknisk"] as const) {
    for (const { provider: p, block: b } of withBlock(providers, category)) rows[category].push(rowOf(p, category, b));
    for (const p of providers) {
      if (!p[category]) missing[category].push({ slug: p.slug, name: p.name, state: p.services[category] });
    }
  }

  return {
    rows,
    missing,
    places: placeOptions([...rows.ekonomisk, ...rows.teknisk].map((r) => r.coverage)),
    providerCount: providers.length,
    checkedAt,
  };
}

/** Raden plus allt som behövs för att lägga två eller tre förvaltare sida vid sida. */
export interface CompareDetail extends CompareRow {
  included: string[];
  extras: Extra[];
  digital: string[];
  reporting: string[];
  otherTerms: string[];
  levels: Level[];
  group: string | null;
  customers: string | null;
}

export function buildCompareDetails(providers: Provider[]): Record<Category, CompareDetail[]> {
  const out = { ekonomisk: [] as CompareDetail[], teknisk: [] as CompareDetail[] };
  for (const category of ["ekonomisk", "teknisk"] as const) {
    for (const { provider: p, block: b } of withBlock(providers, category)) {
      out[category].push({
        ...rowOf(p, category, b),
        included: b.included,
        extras: b.extras,
        digital: b.digital,
        reporting: b.reporting,
        otherTerms: b.terms.other ?? [],
        levels: b.levels,
        group: p.group?.text ?? null,
        customers: p.customers?.text ?? null,
      });
    }
  }
  return out;
}
