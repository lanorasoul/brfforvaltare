// Ren logik utan beroenden, testad i scripts/fit.test.mjs.
import type { Point } from "./types.ts";

export interface Fit {
  /** Fast del i kr per år, där linjen skär lägenhetsaxeln vid noll. */
  base: number;
  /** Tillägg i kr per år för varje extra lägenhet. */
  slope: number;
  /** Största avvikelse i kr mellan linjen och någon av punkterna. */
  maxError: number;
}

/** Minsta kvadrat-linje genom prislistans punkter. Används bara för att förklara hur en prislista är uppbyggd. */
export function fitLine(points: Point[]): Fit | null {
  const n = points.length;
  if (n < 3) return null;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (const p of points) {
    sx += p.lgh;
    sy += p.perYear;
    sxx += p.lgh * p.lgh;
    sxy += p.lgh * p.perYear;
  }
  const d = n * sxx - sx * sx;
  if (d === 0) return null;
  const slope = (n * sxy - sx * sy) / d;
  const base = (sy - slope * sx) / n;
  const maxError = Math.max(...points.map((p) => Math.abs(base + slope * p.lgh - p.perYear)));
  return { base, slope, maxError };
}
