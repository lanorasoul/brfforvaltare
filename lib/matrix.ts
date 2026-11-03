import { DISCLOSURE_KEYS, FEATURES, FEATURE_STATE_ORDER, withBlock } from "./schema";
import type { Category, FeatureState, Presence, Provider } from "./types";

export interface Tally {
  published: number;
  partial: number;
  notfound: number;
}

export interface MatrixStats {
  providers: number;
  cells: number;
  total: Tally;
  byKey: Record<string, Tally>;
}

const empty = (): Tally => ({ published: 0, partial: 0, notfound: 0 });

/** Räknar hur mycket förvaltarna berättar öppet inom en kategori. Allt härleds ur data, inget skrivs för hand. */
export function matrixStats(items: { disclosure: Record<string, Presence> }[], category: Category): MatrixStats {
  const keys = DISCLOSURE_KEYS[category];
  const byKey: Record<string, Tally> = Object.fromEntries(keys.map((k) => [k.key, empty()]));
  const total = empty();
  for (const it of items) {
    for (const { key } of keys) {
      const v = it.disclosure[key];
      byKey[key][v]++;
      total[v]++;
    }
  }
  return { providers: items.length, cells: items.length * keys.length, total, byKey };
}

/** Samma räkning för båda kategorierna tillsammans. */
export function allMatrixStats(providers: Provider[]): { cells: number; published: number } {
  let cells = 0;
  let published = 0;
  for (const category of ["ekonomisk", "teknisk"] as const) {
    const s = matrixStats(withBlock(providers, category).map((x) => x.block), category);
    cells += s.cells;
    published += s.total.published;
  }
  return { cells, published };
}

/** Antal förvaltare som anger något pris alls (prislista, exempel eller tumregel) för kategorin. */
export function pricedCount(providers: Provider[], category: Category): number {
  return withBlock(providers, category).filter((x) => x.block.pricing.model !== "on_request").length;
}

export type FeatureTally = Record<FeatureState, number> & { none: number; total: number };

/** För varje funktion: hur många förvaltare som har den i vilket läge. none är förvaltare som har kategorin men inte listar funktionen. */
export function featureTally(items: { features: Record<string, FeatureState> }[], category: Category): Record<string, FeatureTally> {
  const out: Record<string, FeatureTally> = {};
  for (const f of FEATURES[category]) {
    const t = { included: 0, level: 0, optional: 0, listed: 0, none: 0, total: items.length } as FeatureTally;
    for (const it of items) {
      const s = it.features[f.key];
      if (s) t[s]++;
      else t.none++;
    }
    out[f.key] = t;
  }
  return out;
}

/** Hur många förvaltare som alls nämner funktionen, oavsett läge. */
export function mentioned(t: FeatureTally): number {
  return FEATURE_STATE_ORDER.reduce((n, s) => n + t[s], 0);
}
