import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Stängd för alla sökmotorer tills NEXT_PUBLIC_INDEXABLE=true sätts i Vercel. Därefter hålls API:t och offertformuläret utanför. */
export default function robots(): MetadataRoute.Robots {
  if (!SITE.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/be-om-offert"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
