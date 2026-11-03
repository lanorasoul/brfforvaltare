import type { Metadata } from "next";
import Link from "next/link";
import { Checklist } from "@/components/Checklist";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { NoticeTool } from "@/components/NoticeTool";
import { OfferTemplates } from "@/components/OfferTemplates";
import { PageHead } from "@/components/PageHead";
import { SourceLink } from "@/components/SourceLink";
import { Toc } from "@/components/Toc";
import { getProviders, requireSource } from "@/lib/data";
import { dateLong } from "@/lib/format";
import { CONTRACT_CHECKLIST, SWITCH_CHECKLIST } from "@/lib/offer";
import { CATEGORY, withBlock } from "@/lib/schema";
import { SITE } from "@/lib/site";
import type { Category } from "@/lib/types";
import { ScrollRegion } from "@/components/ScrollRegion";

export const metadata: Metadata = {
  title: "Så byter ni förvaltare",
  description:
    "Fem steg för att byta förvaltare i en bostadsrättsförening: läs avtalet, räkna ut sista dagen för uppsägning, be om samma offert av alla, jämför och planera övergången.",
  alternates: { canonical: "/byta-forvaltare" },
};

const TOC = [
  { id: "avtalet", label: "Läs avtalet" },
  { id: "datum", label: "Räkna ut sista dagen" },
  { id: "offert", label: "Be alla om samma sak" },
  { id: "jamfor", label: "Jämför lika mot lika" },
  { id: "byt", label: "Säg upp och planera" },
];

const CATEGORY_KEYS: Category[] = ["ekonomisk", "teknisk"];

export default function ByttaPage() {
  const providers = getProviders();
  const blocks = {
    ekonomisk: withBlock(providers, "ekonomisk"),
    teknisk: withBlock(providers, "teknisk"),
  };
  const stated = {
    ekonomisk: blocks.ekonomisk.filter(({ block }) => block.terms.notice).length,
    teknisk: blocks.teknisk.filter(({ block }) => block.terms.notice).length,
  };
  const tekPriced = blocks.teknisk.filter(({ block }) => block.pricing.model !== "on_request").length;
  // Förvaltare som anger en uppsägningstid för minst en av delarna. De andra räknas upp under tabellen.
  const withNotice = providers.filter((p) => p.ekonomisk?.terms.notice || p.teknisk?.terms.notice);

  const claims = CATEGORY_KEYS.flatMap((category) =>
    blocks[category].flatMap(({ provider: p, block: b }) =>
      b.claims
        .filter((c) => /byte|övergång|uppsägning/i.test(c.text))
        .map((c) => ({ key: `${p.slug}-${category}-${c.text}`, provider: p.name, category, text: c.text, source: requireSource(p, c.source) })),
    ),
  );

  return (
    <>
      <PageHead
        title="Så byter ni förvaltare"
        lead="Ett byte styrs av datum. Här är fem steg, ett verktyg som räknar ut sista dagen för uppsägning och mallar att skicka till flera förvaltare, för ekonomisk och för teknisk förvaltning."
        crumbs={[{ href: "/byta-forvaltare", label: "Byta förvaltare" }]}
      />

      <div className="page-body">
        <div className="container guide-layout">
          <aside className="guide-aside">
            <Toc items={TOC} />
          </aside>

          <div className="guide-main">
            <section className="gsec" aria-labelledby="avtalet">
              <div className="gsec-head">
                <h2 className="h3 step-title" id="avtalet">
                  <span className="step-n">1</span>
                  Läs avtalet
                </h2>
                <p className="muted">
                  Hitta det här i avtalet med nuvarande förvaltare och skriv ner det. Uppsägningstiden avgör när ni kan byta, så börja där.
                </p>
              </div>
              <Checklist id="avtalet" items={CONTRACT_CHECKLIST} />
              <p className="small muted gsec-note">
                Hittar ni inte något av det: be förvaltaren om en kopia av avtalet och om ett skriftligt svar på hur uppsägningstiden räknas.
              </p>
            </section>

            <section className="gsec" aria-labelledby="datum">
              <div className="gsec-head">
                <h2 className="h3 step-title" id="datum">
                  <span className="step-n">2</span>
                  Räkna ut sista dagen
                </h2>
                <p className="muted">
                  Uppsägningstiden räknas bakåt från den dag avtalet slutar. Om avtalet förnyas automatiskt och uppsägningen kommer för sent gäller det en period till. Fyll i ert eget avtal. Tiden mellan i dag och sista dagen är den ni har för att jämföra och välja.
                </p>
              </div>
              <div className="tile tool" id="kalender">
                <NoticeTool today={SITE.dataCheckedAt} defaultEnd={`${SITE.dataCheckedAt.slice(0, 4)}-12-31`} />
              </div>
            </section>

            <section className="gsec" aria-labelledby="offert">
              <div className="gsec-head">
                <h2 className="h3 step-title" id="offert">
                  <span className="step-n">3</span>
                  Be alla om samma sak
                </h2>
                <p className="muted">
                  Priser går inte att jämföra om förvaltarna räknar olika. Skicka samma frågor till flera förvaltare och skriv ut hur många lägenheter ni har och om föreningen är momsregistrerad. Då får ni svar på samma grund.
                  {tekPriced === 0
                    ? ` Ingen av de ${blocks.teknisk.length} förvaltare vi läst anger ett pris för teknisk förvaltning, så där är offerten enda vägen till ett pris.`
                    : ""}
                </p>
              </div>
              <div className="tile tool">
                <OfferTemplates rows={17} fit sync />
              </div>
            </section>

            <section className="gsec" aria-labelledby="jamfor">
              <div className="gsec-head">
                <h2 className="h3 step-title" id="jamfor">
                  <span className="step-n">4</span>
                  Jämför lika mot lika
                </h2>
                <p className="muted">
                  Lägg svaren bredvid varandra: pris med moms utskrivet, uppsägningstid, vad som ingår och vad tillvalen kostar. Det som saknas i ett svar är också information.
                </p>
              </div>

              <div className="gsec-actions">
                <Link className="btn btn-dark" href="/jamfor">
                  Jämför förvaltare sida vid sida
                  <span className="btn-icon">
                    <ArrowIcon size={12} />
                  </span>
                </Link>
                <Link className="btn btn-quiet" href="/ekonomisk-forvaltning">
                  {CATEGORY.ekonomisk.label}
                </Link>
                <Link className="btn btn-quiet" href="/teknisk-forvaltning">
                  {CATEGORY.teknisk.label}
                </Link>
              </div>

              <h3 className="h4 gsec-sub">Vad förvaltarna skriver om sin egen uppsägningstid</h3>
              <p className="small muted gsec-lead">
                För ekonomisk förvaltning anger {stated.ekonomisk} av {blocks.ekonomisk.length} förvaltare uppsägningstiden för sitt eget avtal på sidorna vi läste, för teknisk förvaltning {stated.teknisk} av{" "}
                {blocks.teknisk.length}. Det betyder inte att de andra saknar en, bara att den inte står där. Fråga alltid och be om svaret skriftligt.
              </p>
              {withNotice.length > 0 && (
                <ScrollRegion label="Uppsägningstid enligt förvaltarna själva" className="dtable-wrap">
                  <table className="dtable">
                    <caption className="sr-only">Uppsägningstid enligt förvaltarna själva, för ekonomisk och teknisk förvaltning</caption>
                    <thead>
                      <tr>
                        <th scope="col">Förvaltare</th>
                        {CATEGORY_KEYS.map((c) => (
                          <th key={c} scope="col">
                            {CATEGORY[c].label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {withNotice.map((p) => (
                        <tr key={p.slug}>
                          <th scope="row">
                            <Link className="pg-link" href={`/forvaltare/${p.slug}`}>
                              {p.name}
                            </Link>
                          </th>
                          {CATEGORY_KEYS.map((c) => {
                            const b = p[c];
                            if (!b) {
                              return (
                                <td key={c} className="dtable-muted">
                                  {p.services[c] === "no" ? "Erbjuds inte enligt förvaltaren" : "Ingen sida funnen"}
                                </td>
                              );
                            }
                            const src = b.terms.notice ? requireSource(p, b.terms.noticeSource ?? b.source) : null;
                            return src ? (
                              <td key={c}>
                                <span className="nt-text">{b.terms.notice}</span>
                                <a className="link nt-src" href={src.url} target="_blank" rel="noopener noreferrer">
                                  Läst {dateLong(src.checked)}
                                  <ExternalIcon />
                                  <span className="sr-only">
                                    {" "}
                                    ({p.name}, {CATEGORY[c].label.toLowerCase()}, öppnas i ny flik)
                                  </span>
                                </a>
                              </td>
                            ) : (
                              <td key={c} className="dtable-muted">
                                Ej funnet på sidorna vi läste
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollRegion>
              )}
              <ul className="nt-missing small muted">
                {CATEGORY_KEYS.map((c) => {
                  const none = blocks[c].filter(({ block }) => !block.terms.notice).map(({ provider }) => provider);
                  if (none.length === 0) return null;
                  return (
                    <li key={c}>
                      {none.length === blocks[c].length ? (
                        <>Ingen av de {none.length} förvaltarna anger en uppsägningstid för {CATEGORY[c].label.toLowerCase()} på sidorna vi läste.</>
                      ) : (
                        <>
                          Ingen uppsägningstid för {CATEGORY[c].label.toLowerCase()} på sidorna vi läste hos:{" "}
                          {none.map((p, i) => (
                            <span key={p.slug}>
                              <Link className="link" href={`/forvaltare/${p.slug}`}>
                                {p.name}
                              </Link>
                              {i < none.length - 2 ? ", " : i === none.length - 2 ? " och " : ""}
                            </span>
                          ))}
                          .
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="gsec" aria-labelledby="byt">
              <div className="gsec-head">
                <h2 className="h3 step-title" id="byt">
                  <span className="step-n">5</span>
                  Säg upp och planera övergången
                </h2>
                <p className="muted">
                  Säg upp skriftligt och spara kvittot. Be den nya förvaltaren lägga upp en plan för bokföring, avier och bankkontakter innan den gamla förvaltaren slutar. Kontrollera i era stadgar och i avtalet vem som får besluta om uppsägningen och hur den ska skickas.
                </p>
              </div>
              <Checklist id="byt" items={SWITCH_CHECKLIST} />

              {claims.length > 0 && (
                <>
                  <h3 className="h4 gsec-sub">Vad förvaltarna skriver om byten</h3>
                  <p className="small muted gsec-lead">Det här är förvaltarnas egna uppgifter. De vill ha er som kund och vi har inte kontrollerat dem.</p>
                  <ul className="claims">
                    {claims.map((c) => (
                      <li key={c.key} className="claim">
                        <p>{c.text}</p>
                        <p className="fine claim-src">
                          {c.provider}, {CATEGORY[c.category].label.toLowerCase()}. <SourceLink url={c.source.url} checked={c.source.checked} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
