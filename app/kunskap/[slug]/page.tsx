import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { PageHead } from "@/components/PageHead";
import { PostBody, Rich } from "@/components/PostBody";
import { PostCards } from "@/components/PostCards";
import { Toc } from "@/components/Toc";
import { dateLong } from "@/lib/format";
import { plainText } from "@/lib/post-text";
import { getPost, getPosts } from "@/lib/posts";
import { SITE } from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getPosts().map((p) => ({ slug: p.slug }));
}

const flat = (s: string) => plainText(s).replace(/ /g, " ");

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `/kunskap/${post.slug}`;
  const description = flat(post.description);
  return {
    // Utan sajtnamnet efter, så att hela titeln får plats i sökresultatet.
    title: { absolute: flat(post.metaTitle) },
    description,
    keywords: [post.keyword, ...post.keywords],
    alternates: { canonical: url },
    openGraph: { type: "article", title: flat(post.metaTitle), description, url, publishedTime: post.published, modifiedTime: post.updated, section: post.category },
  };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE.url}/kunskap/${post.slug}`;
  const related = post.related.flatMap((s) => getPost(s) ?? []);
  const publisher = { "@type": "Organization", name: SITE.operator?.name ?? SITE.name, url: SITE.url };

  // Samma text som syns på sidan. Svaret står först så att en sökmotor kan visa det direkt.
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: flat(post.title),
        description: flat(post.description),
        abstract: flat(post.answer),
        datePublished: post.published,
        dateModified: post.updated,
        inLanguage: "sv-SE",
        articleSection: post.category,
        keywords: [post.keyword, ...post.keywords].join(", "),
        mainEntityOfPage: url,
        image: `${SITE.url}/opengraph-image.png`,
        author: publisher,
        publisher,
        citation: post.sources.map((s) => s.url),
      },
      {
        "@type": "FAQPage",
        mainEntity: post.faq.map((f) => ({ "@type": "Question", name: flat(f.q), acceptedAnswer: { "@type": "Answer", text: flat(f.a) } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Kunskap", item: `${SITE.url}/kunskap` },
          { "@type": "ListItem", position: 3, name: flat(post.title), item: url },
        ],
      },
    ],
  };

  return (
    <article>
      <JsonLd data={ld} />
      <PageHead title={post.title} crumbs={[{ href: "/kunskap", label: "Kunskap" }]}>
        <p className="post-meta small muted">
          {post.category}
          <span aria-hidden="true"> · </span>
          Uppdaterad <time dateTime={post.updated}>{dateLong(post.updated)}</time>
          <span aria-hidden="true"> · </span>
          {post.minutes} min läsning
        </p>
        <div className="post-answer">
          <p className="mono-label">Kort svar</p>
          <p className="post-answer-text">
            <Rich text={post.answer} />
          </p>
          <ul className="post-points">
            {post.points.map((pt) => (
              <li key={pt}>
                <Rich text={pt} />
              </li>
            ))}
          </ul>
        </div>
      </PageHead>

      <div className="page-body">
        <div className="container guide-layout">
          <aside className="guide-aside">
            <Toc items={post.toc} />
          </aside>

          <div className="guide-main post">
            <PostBody blocks={post.body} />

            <section className="post-sec" aria-labelledby="vanliga-fragor">
              <h2 className="post-h2" id="vanliga-fragor">
                Vanliga frågor
              </h2>
              <dl className="post-faq">
                {post.faq.map((f) => (
                  <div key={f.q} className="post-faq-item">
                    <dt>{f.q}</dt>
                    <dd>
                      <Rich text={f.a} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="post-cta">
              <div>
                <h2 className="post-cta-title">Vill ni ha hjälp att hitta rätt förvaltare?</h2>
                <p>Berätta i tre korta steg vad föreningen behöver, så matchar vi er med förvaltare som passar. Gratis och utan förpliktelser.</p>
              </div>
              <div className="post-cta-actions">
                <Link className="btn btn-accent" href="/hitta-forvaltare">
                  Få förslag på förvaltare
                  <span className="btn-icon">
                    <ArrowIcon />
                  </span>
                </Link>
                <Link className="btn btn-quiet" href={post.next.href}>
                  {post.next.label}
                </Link>
              </div>
            </section>

            <section className="post-sec" aria-labelledby="kallor">
              <h2 className="post-h2" id="kallor">
                Källor
              </h2>
              <p className="small muted">Varje sakuppgift i artikeln kommer från någon av källorna nedan. Datumet är dagen då vi läste sidan.</p>
              <ol className="post-sources">
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                      <ExternalIcon size={11} />
                    </a>
                    <span className="small muted">
                      {" "}
                      {s.publisher}. Läst {dateLong(s.checked)}.
                    </span>
                  </li>
                ))}
              </ol>
              <p className="small muted">
                Publicerad {dateLong(post.published)}. Hittar ni ett fel? Se <Link className="link" href="/metod#rattelser">hur vi rättar</Link>.
              </p>
            </section>

            {related.length > 0 && (
              <section className="post-sec" aria-labelledby="las-ocksa">
                <h2 className="post-h2" id="las-ocksa">
                  Läs också
                </h2>
                <PostCards posts={related} level="h3" />
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
