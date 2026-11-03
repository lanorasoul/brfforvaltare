import "server-only";
import fs from "node:fs";
import path from "node:path";
import { buildCompareData, buildCompareDetails, type CompareData, type CompareDetail } from "./compare";
import { tidyDeep } from "./format";
import { SITE } from "./site";
import type { Provider, Reference, Source } from "./types";

const DIR = path.join(process.cwd(), "data", "providers");

let cache: Provider[] | null = null;

/** Läser alla förvaltare från data/providers. Sorterad i namnordning (ingen rangordning i v1). */
export function getProviders(): Provider[] {
  if (cache) return cache;
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const all = files.map((f) => tidyDeep(JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Provider));
  cache = all.sort((a, b) => a.name.localeCompare(b.name, "sv"));
  return cache;
}

/** Raderna som jämförelsen på startsidan och kategorisidorna ritas ur. */
export function getCompareData(): CompareData {
  return buildCompareData(getProviders(), SITE.dataCheckedAt);
}

/** Allt som jämför-sidan behöver för att lägga förvaltare bredvid varandra. */
export function getCompareDetails(): Record<"ekonomisk" | "teknisk", CompareDetail[]> {
  return buildCompareDetails(getProviders());
}

export function getProvider(slug: string): Provider | undefined {
  return getProviders().find((p) => p.slug === slug);
}

export function getSource(p: Provider, id: string): Source | undefined {
  return p.sources.find((s) => s.id === id);
}

/** Som getSource, men kastar om källan saknas. Datakontrollen (npm run validate) garanterar att varje källa finns. */
export function requireSource(p: Provider, id: string): Source {
  const s = getSource(p, id);
  if (!s) throw new Error(`Källa ${id} saknas för ${p.slug}`);
  return s;
}

/** Allmän vägledning från utomstående, till exempel Offerta. Ingen förvaltare och aldrig underlag för våra priser. */
export function getReference(): Reference {
  return tidyDeep(JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "reference.json"), "utf8")) as Reference);
}
