import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getProviders } from "./data";
import { dateLong, tidy } from "./format";
import { allStrings, countWords, fillTokens, mapStrings, readingMinutes, type PostFactKey } from "./post-text";
import { withBlock } from "./schema";
import { SITE } from "./site";
import type { Provider } from "./types";

/** Tabeller som ritas ur förvaltardatan när sidan byggs, så att artikeln och jämförelsen alltid säger samma sak. */
export type PostDataKey = "nki" | "features-ekonomisk" | "features-teknisk" | "services" | "notice" | "teknisk-priser" | "underhallsplan-priser";

export type PostBlock =
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; caption: string; head: string[]; rows: string[][]; note?: string }
  | { type: "note"; title?: string; text: string }
  | { type: "data"; key: PostDataKey };

export interface PostSource {
  title: string;
  publisher: string;
  url: string;
  /** ISO-datum då vi läste sidan. */
  checked: string;
}

export interface Post {
  slug: string;
  /** Sidans rubrik (h1). */
  title: string;
  /** Titeln i sökresultatet, högst 60 tecken. */
  metaTitle: string;
  /** Beskrivningen i sökresultatet, högst 160 tecken. */
  description: string;
  /** Sökfrasen artikeln svarar på, och närliggande fraser. */
  keyword: string;
  keywords: string[];
  category: string;
  published: string;
  updated: string;
  /** Svaret på frågan i två till tre meningar. Står överst på sidan. */
  answer: string;
  /** Det viktigaste i punktform, direkt under svaret. */
  points: string[];
  body: PostBlock[];
  faq: { q: string; a: string }[];
  sources: PostSource[];
  related: string[];
  /** Nästa steg för läsaren, utöver Hitta förvaltare. */
  next: { href: string; label: string };
}

export interface LoadedPost extends Post {
  minutes: number;
  toc: { id: string; label: string }[];
}

const DIR = path.join(process.cwd(), "data", "posts");

/** Tal ur förvaltardatan som artiklarna får hänvisa till med {{nyckel}}. Samma räknesätt som på övriga sidor. */
export function postFacts(providers: Provider[]): Record<PostFactKey, string | number> {
  const eko = withBlock(providers, "ekonomisk");
  const tek = withBlock(providers, "teknisk");
  const priced = (list: typeof eko) => list.filter(({ block }) => block.pricing.model !== "on_request").length;
  const notice = (list: typeof eko) => list.filter(({ block }) => block.terms.notice).length;
  return {
    providers: providers.length,
    "eko.total": eko.length,
    "tek.total": tek.length,
    "eko.priced": priced(eko),
    "tek.priced": priced(tek),
    "eko.notice": notice(eko),
    "tek.notice": notice(tek),
    both: providers.filter((p) => p.ekonomisk && p.teknisk).length,
    "nki.count": providers.filter((p) => p.facts.ratings.some((r) => r.kind === "nki")).length,
    checked: dateLong(SITE.dataCheckedAt),
  };
}

let cache: LoadedPost[] | null = null;

/** Alla artiklar, senast uppdaterad först och därefter i bokstavsordning. */
export function getPosts(): LoadedPost[] {
  if (cache) return cache;
  const facts = postFacts(getProviders());
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const all = files.map((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as Post;
    // Adresser lämnas orörda. All annan text får siffrorna ifyllda och hårda mellanrum i belopp.
    const post = mapStrings(raw, (s) => (/^https?:\/\/\S+$/.test(s) ? s : tidy(fillTokens(s, facts))));
    const words = allStrings([post.answer, post.points, post.body, post.faq]).reduce((n, s) => n + countWords(s), 0);
    const toc = post.body.flatMap((b) => (b.type === "h2" ? [{ id: b.id, label: b.text }] : []));
    return { ...post, minutes: readingMinutes(words), toc: [...toc, { id: "vanliga-fragor", label: "Vanliga frågor" }, { id: "kallor", label: "Källor" }] };
  });
  cache = all.sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title, "sv"));
  return cache;
}

export function getPost(slug: string): LoadedPost | undefined {
  return getPosts().find((p) => p.slug === slug);
}
