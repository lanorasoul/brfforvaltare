// Ren logik utan beroenden, testad i scripts/price.test.mjs.
import type { Pricing, Status, Vat, Point } from "./types.ts";

export interface PriceInput {
  slug: string;
  name: string;
  pricing: Pricing;
}

export type RowKind = "list" | "estimate" | "assumption" | "from" | "none";

export interface PriceRow {
  slug: string;
  name: string;
  kind: RowKind;
  /** Pris per år för valt antal lägenheter, om förvaltaren ger underlag. */
  perYear: number | null;
  perLgh: number | null;
  /** Kort etikett: Prislista, Exempel, Tumregel, Från-pris, Pris på förfrågan. */
  basis: string;
  vat: Vat;
  status: Status | null;
  /** En mening som förklarar var siffran kommer ifrån. */
  note: string;
  sourceId: string;
}

/** Linjär interpolation mellan publicerade punkter. Null utanför det publicerade spannet. */
export function interpolate(points: Point[], n: number): number | null {
  if (points.length === 0) return null;
  const p = [...points].sort((a, b) => a.lgh - b.lgh);
  if (n < p[0].lgh || n > p[p.length - 1].lgh) return null;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    if (n >= a.lgh && n <= b.lgh) {
      if (b.lgh === a.lgh) return a.perYear;
      return a.perYear + ((b.perYear - a.perYear) * (n - a.lgh)) / (b.lgh - a.lgh);
    }
  }
  return p[p.length - 1].perYear;
}

export function priceRow(provider: PriceInput, n: number): PriceRow {
  const pr = provider.pricing;
  const base = { slug: provider.slug, name: provider.name, sourceId: pr.source };

  if (pr.model === "list") {
    const v = interpolate(pr.anchors, n);
    if (v !== null) {
      // Ett värde som står i prislistan är verifierat. Allt däremellan har vi räknat fram, så det är en uppskattning.
      const published = pr.anchors.some((a) => a.lgh === n);
      return {
        ...base,
        kind: "list",
        perYear: v,
        // ERF rundar ned i sin egen tabell (1 362,5 visas som 1 362), så vi gör likadant.
        perLgh: Math.floor(v / n),
        basis: "Prislista",
        vat: pr.vat,
        status: published || pr.status !== "verified" ? pr.status : "estimated",
        note: published
          ? "Pris för exakt den här storleken enligt förvaltarens prislista."
          : "Beräknat av oss rakt mellan de närmaste storlekarna i förvaltarens prislista.",
      };
    }
    const max = Math.max(...pr.anchors.map((a) => a.lgh));
    if (pr.openFrom && n > max) {
      return {
        ...base,
        kind: "from",
        perYear: pr.openFrom.perYear,
        perLgh: null,
        basis: "Från-pris",
        vat: pr.vat,
        status: pr.status,
        note: `Förvaltaren anger bara ett från-pris över ${max} lägenheter.`,
      };
    }
    return { ...base, kind: "none", perYear: null, perLgh: null, basis: "Ej publicerat", vat: pr.vat, status: null, note: "Förvaltarens prislista täcker inte den här storleken." };
  }

  if (pr.model === "examples") {
    const exact = pr.examples.find((e) => e.lgh === n);
    const v = interpolate(pr.examples, n);
    if (exact) {
      return {
        ...base,
        kind: "estimate",
        perYear: exact.perYear,
        perLgh: exact.perYear / n,
        basis: "Exempel",
        vat: pr.vat,
        status: "verified",
        note: "Förvaltarens eget prisexempel för den här storleken. Förvaltaren anger att priserna är exempel och inte fasta prisnivåer.",
      };
    }
    if (v !== null) {
      return {
        ...base,
        kind: "estimate",
        perYear: v,
        perLgh: v / n,
        basis: "Exempel",
        vat: pr.vat,
        status: "estimated",
        note: "Uppskattat rakt mellan förvaltarens prisexempel. Förvaltaren anger att priserna är exempel och inte fasta prisnivåer.",
      };
    }
    if (typeof pr.fromPerYear === "number" && n < Math.min(...pr.examples.map((e) => e.lgh))) {
      return {
        ...base,
        kind: "from",
        perYear: pr.fromPerYear,
        perLgh: null,
        basis: "Från-pris",
        vat: pr.vat,
        status: "verified",
        note: "Förvaltaren anger ett lägsta pris per år. Exempel finns bara för större föreningar.",
      };
    }
    return { ...base, kind: "none", perYear: null, perLgh: null, basis: "Ej publicerat", vat: pr.vat, status: null, note: "Inga prisexempel för den här storleken." };
  }

  if (pr.model === "rule_of_thumb") {
    const v = pr.perLgh * n;
    return {
      ...base,
      kind: "assumption",
      perYear: v,
      perLgh: pr.perLgh,
      basis: "Tumregel",
      vat: pr.vat,
      status: pr.periodStated ? "estimated" : "assumed",
      note: pr.periodStated
        ? "Förvaltarens tumregel per lägenhet gånger antal lägenheter."
        : "Förvaltaren anger en tumregel per lägenhet utan att säga per vilken period. Vi har räknat med per år.",
    };
  }

  return { ...base, kind: "none", perYear: null, perLgh: null, basis: "Pris på förfrågan", vat: "unknown", status: null, note: pr.text };
}

/** Rader sorterade: de med pris först, lägst först, sedan de utan pris i namnordning. */
export function priceRows(providers: PriceInput[], n: number): PriceRow[] {
  const rows = providers.map((p) => priceRow(p, n));
  const withPrice = rows.filter((r) => r.perYear !== null).sort((a, b) => (a.perYear as number) - (b.perYear as number));
  const without = rows.filter((r) => r.perYear === null).sort((a, b) => a.name.localeCompare(b.name, "sv"));
  return [...withPrice, ...without];
}

/** Snyggt skalmax för en axel, till exempel 37 375 -> 40 000. Stegen ger fyra jämna delar. */
export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / exp;
  const steps = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => f <= s + 1e-9) ?? 10;
  return step * exp;
}
