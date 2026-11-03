import type { Point } from "./types.ts";

export interface Band {
  from: Point;
  to: Point;
}

/**
 * Delar en prislista i storleksband. En ny rad börjar när nästa antal lägenheter är exakt en mer än förra,
 * så att 3, 10, 11, 20, 21, 50 blir banden 3 till 10, 11 till 20 och 21 till 50. Returnerar null om punkterna inte följer det mönstret.
 */
export function bandsOf(anchors: Point[]): Band[] | null {
  const a = [...anchors].sort((x, y) => x.lgh - y.lgh);
  if (a.length < 2) return null;
  const bands: Band[] = [];
  let start = a[0];
  for (let i = 1; i < a.length; i++) {
    if (a[i].lgh - a[i - 1].lgh === 1) {
      bands.push({ from: start, to: a[i - 1] });
      start = a[i];
    }
  }
  bands.push({ from: start, to: a[a.length - 1] });
  // Varje band ska ha två olika ändpunkter, annars är det inget bandschema.
  return bands.every((b) => b.to.lgh > b.from.lgh) ? bands : null;
}
