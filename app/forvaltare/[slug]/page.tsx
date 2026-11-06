import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { ExternalIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { PageHead } from "@/components/PageHead";
import { MissingSection, ServiceSection } from "@/components/ServiceSection";
import { SourceLink } from "@/components/SourceLink";
import { getProvider, getProviders, requireSource } from "@/lib/data";
import { dateLong, shortUrl } from "@/lib/format";
import { overviewRows } from "@/lib/overview";
import { priceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { CATEGORIES, CATEGORY } from "@/lib/schema";
import { NKI_AVERAGE, SITE } from "@/lib/site";
import type { Category, Provider, Service } from "@/lib/types";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getProviders().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProvider(slug);
  if (!p) return {};
  const services = [p.ekonomisk && "ekonomisk", p.teknisk && "teknisk"].filter(Boolean).join(" och ");
  const nki = p.facts.ratings.find((r) => r.kind === "nki");
  const bits = [
    `${p.name} erbjuder ${services} förvaltning för bostadsrättsföreningar.`,
    p.facts.clients ? `${p.facts.clients.value.toLocaleString("sv-SE")} kunder.` : "",
    nki ? `NKI ${nki.value} (${nki.year}).` : "",
    "Pris, kundnöjdhet, omdömen och avtalsvillkor med källa.",
  ].filter(Boolean);
  const title = `${p.name}: pris, omdömen och villkor för brf`;
  const description = bits.join(" ").replace(/\u00a0/g, " ");
  return { title, description, alternates: { canonical: `/forvaltare/${p.slug}` }, openGraph: { title, description, url: `/forvaltare/${p.slug}` } };
}

const SERVICE_LABEL = { ekonomisk: "Ekonomisk förvaltning", teknisk: "Teknisk förvaltning", fastighetsskotsel: "Fastighetsskötsel" } as const;
const SERVICE_STATE: Record<Service, string> = { yes: "Ja", no: "Nej", unknown: "Anges inte" };
const SCOPE_LABEL = { ekonomisk: "Ekonomisk förvaltning", teknisk: "Teknisk förvaltning", general: "Allmänt om förvaltaren" } as const;

function QuickFacts({ p }: { p: Provider }) {
  return (
    <dl className="facts">
      {CATEGORIES.map((c: Category) => {
        const b = p[c];
        if (!b) {
          return (
            <div key={c} className="facts-row">
              <dt className="facts-label">{CATEGORY[c].label}</dt>
              <dd className="facts-value">
                <span className="muted">{p.services[c] === "no" ? "Erbjuds inte" : "Ej funnet"}</span>
              </dd>
            </div>
          );
        }
        const quick = priceRow({ slug: p.slug, name: p.name, pricing: b.pricing }, 50);
        return (
          <Fragment key={c}>
            <div className="facts-row">
              <dt className="facts-label">Pris, {CATEGORY[c].label.toLowerCase()}, 50 lägenheter</dt>
              <dd className="facts-value">
                {quick.perYear !== null ? (
                  <>
                    <strong className="facts-big">{priceLabel(quick, quick.perYear, "year")}</strong>
                    <span className="fine">
                      {quick.basis}, {VAT_TEXT[quick.vat]}
                    </span>
                  </>
                ) : (
                  <strong className="facts-big">Pris på offert</strong>
                )}
              </dd>
            </div>
            <div className="facts-row">
              <dt className="facts-label">Uppsägningstid, {CATEGORY[c].label.toLowerCase()}</dt>
              <dd className="facts-value">{b.terms.notice ?? <span className="muted">Ej funnet</span>}</dd>
            </div>
          </Fragment>
        );
      })}
      <div className="facts-row">
        <dt className="facts-label">Webbplats</dt>
        <dd className="facts-value">
          <a className="link" href={p.website} target="_blank" rel="noopener noreferrer">
            {shortUrl(p.website)}
            <ExternalIcon />
          </a>
        </dd>
      </div>
      {p.legalName && (
        <div className="facts-row">
          <dt className="facts-label">Bolagsnamn</dt>
          <dd className="facts-value">{p.legalName}</dd>
        </div>
      )}
      {p.region && (
        <div className="facts-row">
          <dt className="facts-label">Region</dt>
          <dd className="facts-value">{p.region}</dd>
        </div>
      )}
      <div className="facts-row">
        <dt className="facts-label">Senast läst</dt>
        <dd className="facts-value">{dateLong(p.checked)}</dd>
      </div>
    </dl>
  );
}

export default async function ProviderPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = getProvider(slug);
  if (!p) notFound();

  const groupSrc = p.group ? requireSource(p, p.group.source) : null;
  const ov = overviewRows([p])[0];
  const facts = [
    { label: "Grundad", fact: ov.founded },
    { label: "Kunder", fact: ov.clients },
    { label: "Kontor", fact: ov.offices },
    { label: "Anställda", fact: ov.employees },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: p.legalName ?? p.name,
        alternateName: p.legalName ? p.name : undefined,
        url: p.website,
        description: p.summary,
        foundingDate: p.facts.founded ? String(p.facts.founded.year) : undefined,
        numberOfEmployees: p.facts.employees ? { "@type": "QuantitativeValue", value: p.facts.employees.value } : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Start", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Förvaltare", item: `${SITE.url}/forvaltare` },
          { "@type": "ListItem", position: 3, name: p.name, item: `${SITE.url}/forvaltare/${p.slug}` },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <PageHead title={p.name} lead={p.summary} crumbs={[{ href: "/forvaltare", label: "Förvaltare" }]} />

      <div className="page-body">
        <div className="container profile">
          <aside className="profile-aside" aria-label="Snabbfakta">
            <div className="tile profile-card">
              <h2 className="h4">Snabbfakta</h2>
              <QuickFacts p={p} />
              <nav aria-label="Hoppa till" className="jump">
                <p className="fine">Hoppa till</p>
                <ul className="jump-list small">
                  {CATEGORIES.map((c) => (
                    <li key={c}>
                      <a className="link" href={`#${c}`}>
                        {CATEGORY[c].label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a className="link" href="#kallor">
                      Källor
                    </a>
                  </li>
                </ul>
              </nav>
              <Link className="btn btn-dark profile-btn" href={`/jamfor?forvaltare=${p.slug}`}>
                Jämför med andra
              </Link>
              <p className="fine">
                Stämmer något inte? <Link className="link" href="/metod#rattelser">Så rättar vi</Link>.
              </p>
            </div>
          </aside>

          <div className="profile-main">
            <section className="pcat" id="oversikt" aria-labelledby="oversikt-title">
              <h2 className="h2 pcat-title" id="oversikt-title">
                Översikt
              </h2>
              <ul className="svc-list">
                {(Object.keys(SERVICE_LABEL) as (keyof typeof SERVICE_LABEL)[]).map((k) => (
                  <li key={k} className="svc" data-state={p.services[k]}>
                    <span className="svc-dot" aria-hidden="true" />
                    <span>{SERVICE_LABEL[k]}</span>
                    <strong className="svc-state">{SERVICE_STATE[p.services[k]]}</strong>
                  </li>
                ))}
              </ul>

              {p.group && groupSrc && (
                <div className="psub">
                  <h3 className="h4 psub-head">Ägare och organisation</h3>
                  <p className="psec-text">{p.group.text}</p>
                  <p className="fine psec-src">
                    Förvaltarens egen uppgift. <SourceLink url={groupSrc.url} checked={groupSrc.checked} />
                  </p>
                </div>
              )}

              <div className="psub">
                <h3 className="h4 psub-head">Storlek och erfarenhet</h3>
                <dl className="pfacts">
                  {facts.map((f) => (
                    <div key={f.label} className="pfacts-row">
                      <dt className="pfacts-label">{f.label}</dt>
                      <dd className="pfacts-value">
                        {f.fact ? (
                          <>
                            {f.fact.text} <SourceLink url={f.fact.url} checked={f.fact.checked} />
                          </>
                        ) : (
                          <span className="muted">Anges inte på sidorna vi läste.</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="psub">
                <h3 className="h4 psub-head">Kundnöjdhet och omdömen</h3>
                {ov.ratings.length > 0 ? (
                  <ul className="bullets">
                    {ov.ratings.map((r, i) => (
                      <li key={i}>
                        {r.text} {r.ownClaim && <span className="fine">(förvaltarens egen uppgift)</span>} <SourceLink url={r.url} checked={r.checked} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted psec-text">Inget offentligt NKI-värde och inga omdömen med antal som vi har hittat.</p>
                )}
                <p className="fine psec-src">
                  NKI kommer från Prognoscentrets årliga mätning bland bostadsrättsföreningar. Branschsnittet {NKI_AVERAGE.year} var {NKI_AVERAGE.value}.
                </p>
              </div>

              <div className="psub">
                <h3 className="h4 psub-head">Avtal och byte</h3>
                {ov.terms.length > 0 ? (
                  <ul className="bullets">
                    {ov.terms.map((t, i) => (
                      <li key={i}>
                        {t.text} <SourceLink url={t.url} checked={t.checked} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted psec-text">Förvaltaren publicerar inga avtalsvillkor. Fråga efter avtalstid, uppsägningstid, uppstartsavgift och hur priset räknas upp.</p>
                )}
              </div>
            </section>

            {CATEGORIES.map((c) => {
              const b = p[c];
              return b ? <ServiceSection key={c} provider={p} category={c} block={b} /> : <MissingSection key={c} provider={p} category={c} />;
            })}

            {(p.notes ?? []).length > 0 && (
              <section className="pcat" id="anteckningar" aria-labelledby="anteckningar-title">
                <h2 className="h2 pcat-title" id="anteckningar-title">
                  Anteckningar
                </h2>
                <ul className="bullets">
                  {(p.notes ?? []).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="pcat" id="kallor" aria-labelledby="kallor-title">
              <h2 className="h2 pcat-title" id="kallor-title">
                Källor
              </h2>
              <ul className="sources">
                {p.sources.map((s) => (
                  <li key={s.id} className="source-item">
                    <a className="link" href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                      <ExternalIcon />
                    </a>
                    <p className="fine">
                      {SCOPE_LABEL[s.scope]}. {shortUrl(s.url)}. Läst {dateLong(s.checked)}.{s.pageDate ? ` Sidan anger: ${s.pageDate}.` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
