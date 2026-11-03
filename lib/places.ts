// Orter som förvaltarna själva nämner, och vilka som får en egen sida. Ren logik, testad i scripts/places.test.mjs.
// Orterna är de som förvaltarens egen sida nämner. Vi lägger inte till orter som vi tror att förvaltaren verkar i.
import { fold } from "./coverage.ts";

/** En ort måste nämnas av så många förvaltare för att få en egen sida. En sida med en enda förvaltare är inget att jämföra. */
export const MIN_PROVIDERS_FOR_PLACE_PAGE = 2;

/** Adress för en ort: "Södertälje" blir "sodertalje" och "Upplands Väsby" blir "upplands-vasby". */
export function placeSlug(name: string): string {
  return fold(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface PlaceEntry {
  slug: string;
  /** Stavningen som första förvaltaren använder. */
  name: string;
  /** Vilka förvaltare som nämner orten, i någon av delarna. */
  providers: string[];
}

/** Vilka förvaltare som nämner varje ort, oavsett om det är på sidan om ekonomisk eller teknisk förvaltning. */
export function placeIndex(rows: { slug: string; coverage: { places: string[] } }[]): PlaceEntry[] {
  const map = new Map<string, { name: string; providers: Set<string> }>();
  for (const row of rows) {
    for (const place of row.coverage.places) {
      const slug = placeSlug(place);
      if (slug === "") continue;
      const entry = map.get(slug) ?? { name: place.trim(), providers: new Set<string>() };
      entry.providers.add(row.slug);
      map.set(slug, entry);
    }
  }
  return [...map]
    .map(([slug, e]) => ({ slug, name: e.name, providers: [...e.providers].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

/** Orterna som får en egen sida. */
export function placePages(index: PlaceEntry[], min: number = MIN_PROVIDERS_FOR_PLACE_PAGE): PlaceEntry[] {
  return index.filter((e) => e.providers.length >= min);
}

export function findPlace(index: PlaceEntry[], slug: string): PlaceEntry | undefined {
  return index.find((e) => e.slug === slug);
}
