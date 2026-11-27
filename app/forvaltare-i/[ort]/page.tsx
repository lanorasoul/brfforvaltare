import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { PageHead } from "@/components/PageHead";
import { ResultsTable } from "@/components/ResultsTable";
import { getCompareData, getProviders } from "@/lib/data";
import { joinNames, placeFacts, type PlaceFacts } from "@/lib/place-facts";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
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

function factsFor(name: string, outcomes: Record<Category, GuideOutcome<CompareRow>>): PlaceFacts {
  const officeTexts = Object.fromEntries(
    getProviders().map((p) => [p.slug, [p.facts.offices?.text, p.ekonomisk?.coverage.text, p.teknisk?.coverage.text].filter((t): t is string => Boolean(t))]),
  );
  return placeFacts(name, outcomes, officeTexts, GUIDE_LGH.default);
}

/** Frågor och svar för orten. Samma text visas på sidan och läggs i den strukturerade datan. */
function faqFor(name: string, f: PlaceFacts, n: number): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const all = [...f.listed, ...f.national];
  out.push({
    q: `Vilka förvaltare finns för brf i ${name}?`,
    a:
      `${all.length} av förvaltarna i jämförelsen verkar i ${name} enligt sina egna sidor. ` +
      (f.listed.length > 0 ? `${joinNames(f.listed)} nämner ${name} uttryckligen. ` : "") +
      (f.national.length > 0 ? `${joinNames(f.national)} anger att de verkar i hela landet.` : ""),
  });
  out.push({
    q: `Vad kostar en förvaltare för en brf i ${name}?`,
    a:
      f.prices.length > 0
        ? `Bland förvaltarna som verkar i ${name} anger ${f.prices.length} ett pris för ekonomisk förvaltning. För ${n} lägenheter: ${f.prices
            .map((x) => `${x.name} ${priceLabel(x.row, x.perYear, "year")} per år (${VAT_TEXT[x.row.vat]})`)
            .join(", ")}. Övriga lämnar pris på offert.`
        : `Ingen av förvaltarna som verkar i ${name} anger ett pris på sin webbplats. Be flera om offert på samma underlag.`,
  });
  if (f.nki.length > 0) {
    out.push({
      q: `Vilken förvaltare i ${name} har nöjdast kunder?`,
      a: (() => {
        const [top, ...rest] = f.nki.slice(0, 3);
        const tail = rest.length > 0 ? `, följt av ${joinNames(rest.map((x) => `${x.name} (NKI ${x.value})`))}` : "";
        return `Högst kundnöjdhet bland förvaltarna som verkar i ${name} har ${top.name} med NKI ${top.value}${top.year ? ` (${top.year})` : ""}${tail}, enligt Prognoscentrets mätning bland brf-styrelser. Mätningen gäller hela landet, inte bara ${name}.`;
      })(),
    });
  }
  out.push({
    q: `Har förvaltarna kontor i ${name}?`,
    a:
      f.offices.length > 0
        ? `${joinNames(f.offices)} anger på sina sidor att de har kontor i ${name}. Det går att få förvaltning utan lokalt kontor, men fråga hur ofta förvaltaren är på plats.`
        : `Ingen av förvaltarna anger ett kontor i ${name} på sidorna vi läste. Fråga hur ofta förvaltaren är på plats och vem som är er kontaktperson.`,
  });
  return out;
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
    title: { absolute: `Brf förvaltare i ${place.name}: jämför förvaltare och pris` },
    description: `Brf förvaltare i ${place.name}: ${t.listed + t.national} förvaltare verkar i ${place.name} eller hela landet. Jämför pris, kundnöjdhet och tjänster för ekonomisk och teknisk förvaltning.`.slice(0, 160),
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
  const facts = factsFor(place.name, outcomes);
  const faq = faqFor(place.name, facts, n);

  return (
    <>
      <PageHead
        title={`Brf förvaltare i ${place.name}`}
        lead={`${t.listed} förvaltare nämner ${place.name} på sina egna webbplatser. ${t.national} anger att de verkar i hela landet och ${t.unknown} anger inget verksamhetsområde. Raderna står i namnordning och ingen har betalat för sin plats.`}
        crumbs={[
          { href: "/forvaltare", label: "Förvaltare" },
          { href: `/forvaltare-i/${place.slug}`, label: place.name },
        ]}
      />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <div className="page-body">
        <div className="container">
          <section className="pl-section" aria-labelledby="pl-kort">
            <h2 className="h3" id="pl-kort">
              Brf förvaltare i {place.name} i korthet
            </h2>
            <dl className="cv-stats pl-stats">
              <div className="cv-stat">
                <dt>Nämner {place.name}</dt>
                <dd>
                  <strong>{facts.listed.length}</strong>
                  <span>förvaltare på sina sidor</span>
                </dd>
              </div>
              <div className="cv-stat">
                <dt>Ekonomisk förvaltning</dt>
                <dd>
                  <strong>{facts.eko}</strong>
                  <span>förvaltare verkar här</span>
                </dd>
              </div>
              <div className="cv-stat">
                <dt>Teknisk förvaltning</dt>
                <dd>
                  <strong>{facts.tek}</strong>
                  <span>förvaltare verkar här</span>
                </dd>
              </div>
              <div className="cv-stat">
                <dt>Kontor i {place.name}</dt>
                <dd>
                  <strong>{facts.offices.length}</strong>
                  <span>enligt förvaltarnas sidor</span>
                </dd>
              </div>
            </dl>
            <ul className="post-list pl-facts">
              {facts.offices.length > 0 && (
                <li>
                  {joinNames(facts.offices)} anger kontor i {place.name}.
                </li>
              )}
              {facts.prices.length > 0 ? (
                <li>
                  Lägst publicerat pris för ekonomisk förvaltning, {n} lägenheter: {facts.prices[0].name}, {priceLabel(facts.prices[0].row, facts.prices[0].perYear, "year")} per år.{" "}
                  <Link className="link" href="/prisguide">
                    Se alla priser
                  </Link>
                  .
                </li>
              ) : (
                <li>Ingen av förvaltarna här anger ett pris på sin webbplats. Priset får ni genom offert.</li>
              )}
              {facts.nki.length > 0 && (
                <li>
                  Högst kundnöjdhet bland dem som verkar här: {facts.nki[0].name}, NKI {facts.nki[0].value}
                  {facts.nki[0].year ? ` (${facts.nki[0].year})` : ""}.
                </li>
              )}
            </ul>
          </section>

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

          <section className="pl-section" aria-labelledby="pl-faq">
            <h2 className="h3" id="pl-faq">
              Vanliga frågor om förvaltare i {place.name}
            </h2>
            <dl className="post-faq pl-faq">
              {faq.map((f) => (
                <div key={f.q}>
                  <dt>{f.q}</dt>
                  <dd>{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

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
