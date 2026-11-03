// Ren logik utan beroenden, testad i scripts/coverage.test.mjs.
// Orterna är de som förvaltarens egen sida nämner. Att en ort saknas betyder inte att förvaltaren tackar nej där.
import type { Coverage } from "./types.ts";

/** Gemener och utan accenter, så att "malmo" hittar "Malmö" och "goteborg" hittar "Göteborg". */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * national: förvaltaren anger att den verkar i hela landet.
 * listed: orten står på förvaltarens sida.
 * unknown: sidan anger inga orter, så vi kan inte säga ja eller nej.
 * no: sidan anger andra orter men inte den här.
 */
export type PlaceMatch = "national" | "listed" | "unknown" | "no";

export function matchPlace(c: Pick<Coverage, "scope" | "places">, query: string): PlaceMatch {
  if (c.scope === "national") return "national";
  const q = fold(query);
  if (q !== "") {
    for (const p of c.places) {
      const f = fold(p);
      if (f === q || (q.length >= 3 && f.startsWith(q))) return "listed";
    }
  }
  if (c.scope === "unknown" || c.places.length === 0) return "unknown";
  return "no";
}

export interface PlaceSplit<T> {
  /** Rader som ska visas. match är null när inget ortsfilter är satt. */
  shown: { row: T; match: PlaceMatch | null }[];
  /** Rader vars sidor anger andra orter. */
  hidden: T[];
}

/** Delar rader efter ort. Utan sökord visas alla, i oförändrad ordning. */
export function splitByPlace<T extends { coverage: Pick<Coverage, "scope" | "places"> }>(rows: T[], query: string): PlaceSplit<T> {
  if (fold(query) === "") return { shown: rows.map((row) => ({ row, match: null })), hidden: [] };
  const shown: PlaceSplit<T>["shown"] = [];
  const hidden: T[] = [];
  for (const row of rows) {
    const match = matchPlace(row.coverage, query);
    if (match === "no") hidden.push(row);
    else shown.push({ row, match });
  }
  return { shown, hidden };
}

/** Alla orter som någon förvaltare nämner, utan dubbletter, i svensk alfabetisk ordning. */
export function placeOptions(list: { places: string[] }[]): string[] {
  const seen = new Map<string, string>();
  for (const c of list) {
    for (const p of c.places) {
      const k = fold(p);
      if (!seen.has(k)) seen.set(k, p);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "sv"));
}
