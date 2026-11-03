// Frågeguiden: vad styrelsen svarar och vilka förvaltare som visas. Ren logik, testad i scripts/guide.test.mjs.
//
// Guiden rangordnar aldrig. Den visar alla förvaltare som har den förvaltning som efterfrågas på sina egna sidor,
// i namnordning, och döljer bara de vars sidor nämner andra orter än föreningens. Önskemål om tjänster döljer ingen:
// de visas som märken, eftersom en tom ruta bara betyder att sidan vi läste inte listar tjänsten.
import type { MissingRow } from "./compare.ts";
import { fold, matchPlace, type PlaceMatch } from "./coverage.ts";
import { GUIDE_LGH, MAX_PICK, ORT_MAX } from "./limits.ts";
import type { Category, Coverage, Service } from "./types.ts";

/** Vad styrelsen vill ha hjälp med. Båda betyder att förvaltaren ska ha båda delarna på sina sidor. */
export type Need = "ekonomisk" | "teknisk" | "bada";

export const NEEDS: Need[] = ["ekonomisk", "teknisk", "bada"];

export const NEED_LABEL: Record<Need, string> = { ekonomisk: "Ekonomisk förvaltning", teknisk: "Teknisk förvaltning", bada: "Båda" };

export function categoriesOf(need: Need): Category[] {
  return need === "bada" ? ["ekonomisk", "teknisk"] : [need];
}

export interface GuideInput {
  need: Need;
  /** Fritext. Tom sträng betyder att ingen ort är vald och att ingen förvaltare döljs. */
  ort: string;
  /** Antal lägenheter som priset räknas för. */
  lgh: number;
  /** Nycklar ur schema.json, i schemats ordning. De döljer ingen förvaltare. */
  wishes: string[];
}

export interface ParsedGuide extends GuideInput {
  /** Sant när formuläret har skickats, det vill säga när adressen har ett giltigt val av förvaltning. */
  asked: boolean;
}

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

/** Ett värde som upprepats (?f=a&f=b) eller kommaseparerats (?f=a,b), utan tomma poster. */
export function listParam(v: string | string[] | undefined): string[] {
  return (Array.isArray(v) ? v : v === undefined ? [] : [v])
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

/**
 * Läser svaren ur adressen. Allt som inte går att tolka faller tillbaka på ett säkert värde, så en trasig länk visar en sida.
 * features är nycklarna per kategori ur schema.json, så att okända önskemål tas bort.
 */
export function parseGuide(params: Params, features: Record<Category, string[]>): ParsedGuide {
  const raw = first(params.behov);
  const asked = raw === "ekonomisk" || raw === "teknisk" || raw === "bada";
  const need: Need = asked ? raw : "ekonomisk";

  const ort = (first(params.ort) ?? "").replace(/\s+/g, " ").trim().slice(0, ORT_MAX);

  const l = Number(first(params.lgh));
  const lgh = Number.isFinite(l) && l >= 1 ? Math.min(GUIDE_LGH.max, Math.max(GUIDE_LGH.min, Math.round(l))) : GUIDE_LGH.default;

  const wanted = new Set(listParam(params.onskar));
  const wishes = categoriesOf(need)
    .flatMap((c) => features[c])
    .filter((k) => wanted.has(k));

  return { need, ort, lgh, wishes, asked };
}

/** Svaren som adress, utan inledande frågetecken. Samma svar ger alltid samma adress. */
export function guideQuery(input: GuideInput): string {
  const q = new URLSearchParams();
  q.set("behov", input.need);
  if (input.ort !== "") q.set("ort", input.ort);
  q.set("lgh", String(input.lgh));
  for (const w of input.wishes) q.append("onskar", w);
  return q.toString();
}

export interface GuideRow {
  slug: string;
  name: string;
  region: string | null;
  coverage: Pick<Coverage, "scope" | "places">;
}

export interface GuideResult<R extends GuideRow> {
  slug: string;
  name: string;
  region: string | null;
  /** Förvaltarens rad för varje efterfrågad del. */
  rows: Partial<Record<Category, R>>;
  /** Ortsmatchning per del. Null när ingen ort är vald. */
  matches: Partial<Record<Category, PlaceMatch | null>>;
  /** Den samlade matchningen för märket i tabellen. Null när ingen ort är vald. */
  match: PlaceMatch | null;
}

export interface GuideMissing {
  slug: string;
  name: string;
  /** Vilka efterfrågade delar förvaltarens sidor saknar, och vad sidan säger om dem. */
  lacks: { category: Category; state: Service }[];
}

export interface GuideOutcome<R extends GuideRow> {
  categories: Category[];
  /** Förvaltare som visas, i namnordning. */
  results: GuideResult<R>[];
  /** Förvaltare som har delen men vars sidor bara nämner andra orter. */
  hidden: { slug: string; name: string }[];
  /** Förvaltare som saknar någon efterfrågad del på sina sidor. */
  missing: GuideMissing[];
}

/**
 * Samlad matchning när flera delar efterfrågas. Nej om någon del bara nämner andra orter, annars okänd om någon del inte
 * anger orter, annars hela landet om alla delar gör det, annars nämnd.
 */
export function combineMatches(matches: (PlaceMatch | null)[]): PlaceMatch | null {
  if (matches.length === 0 || matches.some((m) => m === null)) return null;
  const list = matches as PlaceMatch[];
  if (list.includes("no")) return "no";
  if (list.includes("unknown")) return "unknown";
  if (list.every((m) => m === "national")) return "national";
  return "listed";
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, "sv");

/** Delar upp förvaltarna i de som visas, de som döljs på ort och de som saknar delen. Ordningen är alltid namnordning. */
export function matchGuide<R extends GuideRow>(
  data: { rows: Record<Category, R[]>; missing: Record<Category, MissingRow[]> },
  input: Pick<GuideInput, "need" | "ort">,
): GuideOutcome<R> {
  const categories = categoriesOf(input.need);
  const filtering = fold(input.ort) !== "";

  const rowsBy = Object.fromEntries(categories.map((c) => [c, new Map(data.rows[c].map((r) => [r.slug, r]))])) as Record<Category, Map<string, R>>;
  const missingBy = Object.fromEntries(categories.map((c) => [c, new Map(data.missing[c].map((m) => [m.slug, m]))])) as Record<Category, Map<string, MissingRow>>;

  // Varje förvaltare finns i rows eller missing för varje del. Namnen hämtas därifrån.
  const names = new Map<string, string>();
  for (const c of categories) {
    for (const r of data.rows[c]) names.set(r.slug, r.name);
    for (const m of data.missing[c]) names.set(m.slug, m.name);
  }

  const results: GuideResult<R>[] = [];
  const hidden: GuideOutcome<R>["hidden"] = [];
  const missing: GuideMissing[] = [];

  for (const [slug, name] of names) {
    const lacks = categories.filter((c) => !rowsBy[c].has(slug));
    if (lacks.length > 0) {
      missing.push({ slug, name, lacks: lacks.map((category) => ({ category, state: missingBy[category].get(slug)?.state ?? "unknown" })) });
      continue;
    }

    const rows: Partial<Record<Category, R>> = {};
    const matches: Partial<Record<Category, PlaceMatch | null>> = {};
    for (const c of categories) {
      const row = rowsBy[c].get(slug) as R;
      rows[c] = row;
      matches[c] = filtering ? matchPlace(row.coverage, input.ort) : null;
    }
    const match = combineMatches(categories.map((c) => matches[c] ?? null));
    if (match === "no") {
      hidden.push({ slug, name });
      continue;
    }
    const head = rows[categories[0]] as R;
    results.push({ slug, name, region: head.region, rows, matches, match });
  }

  return { categories, results: results.sort(byName), hidden: hidden.sort(byName), missing: missing.sort(byName) };
}

/** Förvaltarna som styrelsen kryssat i, bara de som finns bland dem som visas, högst max. dropped är de som inte kom med. */
export function parsePick(params: Params, allowed: Iterable<string>, max: number = MAX_PICK): { slugs: string[]; dropped: number } {
  const ok = new Set(allowed);
  const asked = [...new Set(listParam(params.f))];
  const valid = asked.filter((s) => ok.has(s));
  const slugs = valid.slice(0, max);
  return { slugs, dropped: asked.length - slugs.length };
}
