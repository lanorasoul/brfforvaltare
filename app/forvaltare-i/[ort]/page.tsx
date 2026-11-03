import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { ResultsTable } from "@/components/ResultsTable";
import { getCompareData } from "@/lib/data";
import { matchGuide, type GuideOutcome } from "@/lib/guide";
import { GUIDE_LGH } from "@/lib/limits";
import { findPlace, placeIndex, placePages } from "@/lib/places";
import { CATEGORIES, CATEGORY } from "@/lib/schema";
import type { CompareRow } from "@/lib/compare";
import type { Category } from "@/lib/types";

type Params = { ort: string };

// Bara orter som minst två förvaltare nämner på sina egna sidor får en sida. Alla andra adresser ger 404.
export const dynamicParams = false;

function pages() {
  const data = getCompareData();
  const index = placeIndex([...data.rows.ekonomisk, ...data.rows.teknisk]);
  return { data, index, pages: placePages(index) };
}

export function generateStaticParams(): Params[] {
  return pages().pages.map((p) => ({ ort: p.slug }));
}

/** Hur många förvaltare som nämner orten, anger hela landet eller inget verksamhetsområde. Varje förvaltare räknas en gång, med det bästa läget i någon av delarna. */
function tally(outcomes: GuideOutcome<CompareRow>[]) {
  const best = new Map<string, "listed" | "national" | "unknown">();
  const rank = { listed: 3, national: 2, unknown: 1 } as const;
  for (const o of outcomes) {
    for (const r of o.results) {
      if (r.match !== "listed" && r.match !== "national" && r.match !== "unknown") continue;
      const prev = best.get(r.slug);
      if (!prev || rank[r.match] > rank[prev]) best.set(r.slug, r.match);
    }
  }
  const count = (m: string) => [...best.values()].filter((v) => v === m).length;
  return { listed: count("listed"), national: count("national"), unknown: count("unknown") };
}

function outcomesFor(name: string) {
  const { data } = pages();
  return Object.fromEntries(CATEGORIES.map((c) => [c, matchGuide(data, { need: c, ort: name })])) as Record<Category, GuideOutcome<CompareRow>>;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { ort } = await params;
  const place = findPlace(pages().index, ort);
  if (!place) return {};
  const t = tally(Object.values(outcomesFor(place.name)));
  return {
    title: `Förvaltare av bostadsrättsföreningar i ${place.name}`,
    description: `${t.listed} förvaltare nämner ${place.name} på sina egna webbplatser, ${t.national} anger hela landet och ${t.unknown} anger inget verksamhetsområde. Ekonomisk och teknisk förvaltning, med pris, uppsägningstid och källa.`,
    alternates: { canonical: `/forvaltare-i/${place.slug}` },
  };
}

export default async function OrtPage({ params }: { params: Promise<Params> }) {
  const { ort } = await params;
  const { index, pages: list } = pages();
  const place = findPlace(index, ort);
  if (!place || !list.some((p) => p.slug === place.slug)) notFound();

  const outcomes = outcomesFor(place.name);
  const t = tally(Object.values(outcomes));
  const others = list.filter((p) => p.slug !== place.slug);
  const n = GUIDE_LGH.default;

  return (
    <>
      <PageHead
        title={`Förvaltare i ${place.name}`}
        lead={`${t.listed} förvaltare nämner ${place.name} på sina egna webbplatser. ${t.national} anger att de verkar i hela landet och ${t.unknown} anger inget verksamhetsområde. Raderna står i namnordning och ingen har betalat för sin plats.`}
        crumbs={[
          { href: "/forvaltare", label: "Förvaltare" },
          { href: `/forvaltare-i/${place.slug}`, label: place.name },
        ]}
      />

      <div className="page-body">
        <div className="container">
          <p className="small muted list-note">
            Orterna är de som förvaltarens egen sida nämner. Att en ort saknas betyder inte att förvaltaren tackar nej, bara att den inte står på sidorna vi läste. Priset gäller {n} lägenheter.
          </p>

          {CATEGORIES.map((c) => {
            const o = outcomes[c];
            const label = CATEGORY[c].label;
            return (
              <section key={c} className="pl-section" aria-labelledby={`pl-${c}`}>
                <h2 className="h3" id={`pl-${c}`}>
                  {label} i {place.name}
                </h2>
                <p className="muted pl-lead">{CATEGORY[c].what}</p>
                <ResultsTable
                  results={o.results}
                  categories={[c]}
                  n={n}
                  ort={place.name}
                  caption={`${label} i ${place.name}: pris, uppsägningstid, paket och var förvaltaren verkar. Sorterad efter namn.`}
                  emptyText={`Ingen förvaltare med ${label.toLowerCase()} nämner ${place.name} eller anger hela landet på sidorna vi läste.`}
                />
                {o.hidden.length > 0 && (
                  <p className="small muted pl-note">
                    {o.hidden.length === 1 ? "En förvaltare visas inte" : `${o.hidden.length} förvaltare visas inte`}, eftersom deras sidor bara nämner andra orter. Se alla i <Link className="link" href="/#jamfor-aktorer">jämförelsen</Link>.
                  </p>
                )}
              </section>
            );
          })}

          <div className="panel pl-cta">
            <div>
              <h2 className="h4">Be om offert i {place.name}</h2>
              <p className="muted">Svara på några frågor om föreningen, se vilka som passar och välj högst tre att be om offert från.</p>
            </div>
            <Link className="btn btn-accent" href={`/hitta-forvaltare?behov=ekonomisk&ort=${encodeURIComponent(place.name)}&lgh=${n}`}>
              Hitta förvaltare
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
          </div>

          {others.length > 0 && (
            <nav className="pl-others" aria-labelledby="pl-others-title">
              <h2 className="h4" id="pl-others-title">
                Fler orter
              </h2>
              <ul className="chips">
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link className="pill pl-chip" href={`/forvaltare-i/${p.slug}`}>
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
