import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHead } from "@/components/PageHead";
import { PostCards } from "@/components/PostCards";
import { plainText } from "@/lib/post-text";
import { getPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

const TITLE = "Kunskap om förvaltning för brf-styrelser";
const DESCRIPTION = "Korta guider för brf-styrelser: vad förvaltning kostar och innehåller, uppsägningstid, K3, underhållsplan och bostadsrättsregistret. Med källa till allt.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kunskap" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/kunskap" },
};

export default function KnowledgePage() {
  const posts = getPosts();
  // Fast ordning på grupperna: först det som ligger närmast ett val av förvaltare.
  const ORDER = ["Välja förvaltare", "Vad förvaltning innehåller och kostar", "Regler och krav"];
  const categories = [...new Set(posts.map((p) => p.category))].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE.url}/kunskap`,
        inLanguage: "sv-SE",
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: plainText(p.title),
          url: `${SITE.url}/kunskap/${p.slug}`,
          datePublished: p.published,
          dateModified: p.updated,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Kunskap", item: `${SITE.url}/kunskap` },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <PageHead
        title={TITLE}
        lead="Korta guider som svarar på frågan först och förklarar sedan. Varje sakuppgift har en källa: lagtext, myndigheter, Bostadsrätterna eller förvaltarnas egna sidor."
        crumbs={[{ href: "/kunskap", label: "Kunskap" }]}
      />
      <div className="page-body">
        <div className="container">
          {categories.map((c) => (
            <section key={c} className="post-group" aria-labelledby={`grupp-${categories.indexOf(c)}`}>
              <h2 className="post-group-title" id={`grupp-${categories.indexOf(c)}`}>
                {c}
              </h2>
              <PostCards posts={posts.filter((p) => p.category === c)} level="h3" />
            </section>
          ))}
          <p className="small muted post-index-note">
            Letar ni efter siffror i stället för text? Se <Link className="link" href="/prisguide">prisguiden</Link>, <Link className="link" href="/jamfor">jämför förvaltare sida vid sida</Link> eller läs{" "}
            <Link className="link" href="/metod">hur vi arbetar med källor</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
