import type { MetadataRoute } from "next";
import { getCompareData, getProviders } from "@/lib/data";
import { placeIndex, placePages } from "@/lib/places";
import { getPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

const PAGES = ["", "/hitta-forvaltare", "/ekonomisk-forvaltning", "/teknisk-forvaltning", "/forvaltare", "/prisguide", "/byta-forvaltare", "/kunskap", "/jamfor", "/metod", "/for-forvaltare", "/integritet"];

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Tom så länge sajten är stängd för sökmotorer. Offertformuläret och API:t ligger inte med. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!SITE.indexable) return [];
  const data = getCompareData();
  const places = placePages(placeIndex([...data.rows.ekonomisk, ...data.rows.teknisk]));
  return [
    ...PAGES.map((p) => ({ url: `${SITE.url}${p}`, lastModified: day(SITE.dataCheckedAt) })),
    ...places.map((p) => ({ url: `${SITE.url}/forvaltare-i/${p.slug}`, lastModified: day(SITE.dataCheckedAt) })),
    ...getPosts().map((p) => ({ url: `${SITE.url}/kunskap/${p.slug}`, lastModified: day(p.updated) })),
    ...getProviders().map((p) => ({
      url: `${SITE.url}/forvaltare/${p.slug}`,
      lastModified: day([...p.sources.map((s) => s.checked)].sort().at(-1) ?? p.checked),
    })),
  ];
}
