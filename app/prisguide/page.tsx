import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, ExternalIcon, StatusMark } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { PriceCurve } from "@/components/PriceCurve";
import { SourceLink } from "@/components/SourceLink";
import { Toc } from "@/components/Toc";
import { fitLine } from "@/lib/fit";
import { dateLong, kr, num } from "@/lib/format";
import { getProviders, getReference, requireSource } from "@/lib/data";
import { priceRow, type PriceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { QUESTIONS } from "@/lib/offer";
import { CATEGORY, withBlock } from "@/lib/schema";
import type { Provider, ServiceBlock } from "@/lib/types";
import { ScrollRegion } from "@/components/ScrollRegion";

export const metadata: Metadata = {
  title: "Vad kostar ekonomisk förvaltning för en brf?",
  description:
    "Priser för ekonomisk förvaltning av bostadsrättsföreningar för 20, 50 och 100 lägenheter, hämtade från förvaltarnas egna sidor. Med källa, datum och vad som skiljer.",
  alternates: { canonical: "/prisguide" },
};

const SIZES = [20, 50, 100] as const;

const TOC = [
  { id: "storlekar", label: "Pris för tre storlekar" },
  { id: "storleken", label: "Storlek och pris" },
  { id: "lasratt", label: "Läs priset rätt" },
  { id: "teknisk", label: "Teknisk förvaltning" },
  { id: "offerta", label: "Vad en förmedlare skriver" },
  { id: "nasta", label: "Be om samma sak" },
  { id: "kallor", label: "Källor" },
];

const round100 = (n: number) => Math.round(n / 100) * 100;

interface Entry {
  p: Provider;
  b: ServiceBlock;
}

/** Tillägg med pris som rör en underhållsplan, oavsett om förvaltaren listar dem under ekonomisk eller teknisk förvaltning. */
interface PricedAddOn {
  p: Provider;
  label: string;
  price: string;
  sourceId: string;
  listedUnder: "ekonomisk" | "teknisk";
}

function Cell({ r }: { r: PriceRow }) {
  if (r.perYear === null) return <span className="muted">Inget pris</span>;
  return (
    <span className="pg-cell">
      <StatusMark status={r.status ?? "none"} />
      {priceLabel(r, r.perYear, "year")}
    </span>
  );
}

export default function PrisguidePage() {
  const providers = getProviders();
  const ref = getReference().offerta;

  // Räknaren och diagrammen gäller ekonomisk förvaltning. För teknisk förvaltning anger ingen förvaltare något pris.
  const eko: Entry[] = withBlock(providers, "ekonomisk").map(({ provider, block }) => ({ p: provider, b: block }));
  const tek: Entry[] = withBlock(providers, "teknisk").map(({ provider, block }) => ({ p: provider, b: block }));
  const inputs = eko.map(({ p, b }) => ({ slug: p.slug, name: p.name, pricing: b.pricing }));

  const rows = new Map<string, PriceRow[]>(eko.map(({ p, b }) => [p.slug, SIZES.map((n) => priceRow({ slug: p.slug, name: p.name, pricing: b.pricing }, n))]));
  const priced = eko.filter(({ p }) => (rows.get(p.slug) ?? []).some((r) => r.perYear !== null));
  const unpriced = eko.filter((x) => !priced.includes(x));

  const perLgh = priced.flatMap(({ p }) => (rows.get(p.slug) ?? []).map((r) => r.perLgh).filter((v): v is number => v !== null));
  const lo = Math.min(...perLgh);
  const hi = Math.max(...perLgh);
  const refVsData = lo > ref.generalPerLghYear.high ? "over" : hi < ref.generalPerLghYear.low ? "under" : "inom";

  const multi = priced.filter(({ b }) => b.pricing.model === "list" || b.pricing.model === "examples");
  const shrinking =
    multi.length > 0 &&
    multi.every(({ p }) => {
      const r = rows.get(p.slug) ?? [];
      const a = r[0]?.perLgh;
      const b = r[r.length - 1]?.perLgh;
      return a != null && b != null && b < a;
    });

  const fits = eko
    .map(({ p, b }) => (b.pricing.model === "list" ? { p, fit: fitLine(b.pricing.anchors) } : null))
    .filter((x): x is { p: Provider; fit: NonNullable<ReturnType<typeof fitLine>> } => x !== null && x.fit !== null && x.fit.maxError <= 1.5);

  const withExtrasPrice = eko.filter(({ b }) => b.extras.some((e) => e.price));
  const withVat = priced.filter(({ b }) => b.pricing.model !== "on_request" && b.pricing.vat !== "unknown");
  const unknownPeriod = eko.filter(({ b }) => b.pricing.model === "rule_of_thumb" && !b.pricing.periodStated);
  const includedCounts = eko.map(({ b }) => b.included.length).filter((n) => n > 0);
  const noList = eko.length - includedCounts.length;

  // Alla punkter i diagrammet, som tabell för den som inte kan eller vill läsa diagrammet.
  const points = eko.flatMap(({ p, b }) => {
    const pr = b.pricing;
    if (pr.model === "list") return pr.anchors.map((a) => ({ key: `${p.slug}${a.lgh}`, name: p.name, basis: "Prislista", lgh: String(a.lgh), value: kr(a.perYear) }));
    if (pr.model === "examples") {
      const base = pr.examples.map((a) => ({ key: `${p.slug}${a.lgh}`, name: p.name, basis: "Prisexempel", lgh: String(a.lgh), value: `ca ${kr(a.perYear)}` }));
      return typeof pr.fromPerYear === "number" ? [{ key: `${p.slug}fran`, name: p.name, basis: "Lägsta pris", lgh: "alla storlekar", value: `från ${kr(pr.fromPerYear)}` }, ...base] : base;
    }
    if (pr.model === "rule_of_thumb") return [{ key: `${p.slug}tumregel`, name: p.name, basis: "Tumregel, antagande", lgh: "varje lägenhet", value: `ca ${kr(pr.perLgh)} per lägenhet och år` }];
    return [];
  });

  // Teknisk förvaltning: ingen prismodell, men några förvaltare prissätter ett tillägg för underhållsplan.
  const tekPriced = tek.filter(({ b }) => b.pricing.model !== "on_request").length;
  const addOns: PricedAddOn[] = [
    ...tek.flatMap(({ p, b }) =>
      b.extras.flatMap((e) => (e.price ? [{ p, label: e.label, price: e.price, sourceId: e.source ?? b.pricing.source, listedUnder: "teknisk" as const }] : [])),
    ),
    ...eko.flatMap(({ p, b }) =>
      b.extras.flatMap((e) =>
        e.price && /underhållsplan/i.test(e.label) ? [{ p, label: e.label, price: e.price, sourceId: e.source ?? b.pricing.source, listedUnder: "ekonomisk" as const }] : [],
      ),
    ),
  ];
  const addOnProviders = [...new Map(addOns.map((a) => [a.p.slug, a.p])).values()];
  const groupNotes = addOnProviders.flatMap((p) => (p.group ? [{ name: p.name, text: p.group.text }] : []));

  const sourceRows = priced.map(({ p, b }) => ({ p, s: requireSource(p, b.pricing.source) }));
  const addOnSources = [...new Map(addOns.map((a) => [requireSource(a.p, a.sourceId).url, { p: a.p, s: requireSource(a.p, a.sourceId) }])).values()];
  const overTexts = { over: "ovanför", under: "under", inom: "delvis inom" } as const;

  return (
    <>
      <PageHead
        title="Vad kostar ekonomisk förvaltning för en brf?"
        lead={`${priced.length} av ${eko.length} förvaltare anger något pris för ekonomisk förvaltning. Det vi kan läsa ligger på ${num(lo)} till ${num(hi)} kr per lägenhet och år för föreningar med 20 till 100 lägenheter. Underlag och moms skiljer mellan förvaltarna, så läs siffrorna som riktlinjer och be om offert. För teknisk förvaltning anger ${tekPriced === 0 ? "ingen" : `bara ${tekPriced}`} ett pris.`}
        crumbs={[{ href: "/prisguide", label: "Prisguide" }]}
      />

      <div className="page-body">
        <div className="container guide-layout">
          <aside className="guide-aside">
            <Toc items={TOC} />
          </aside>
          <div className="guide-main">
          <section className="gsec" aria-labelledby="storlekar">
            <div className="gsec-head">
              <h2 className="h3" id="storlekar">
                Pris för 20, 50 och 100 lägenheter
              </h2>
              <p className="muted">Kr per år, så som förvaltarna själva anger det. Märket visar hur säker siffran är. Förvaltarna står i namnordning.</p>
            </div>

            <ScrollRegion label="Pris per år för 20, 50 och 100 lägenheter" className="dtable-wrap dtable-sticky">
              <table className="dtable">
                <caption className="sr-only">Pris per år för 20, 50 och 100 lägenheter</caption>
                <thead>
                  <tr>
                    <th scope="col">Förvaltare</th>
                    {SIZES.map((n) => (
                      <th key={n} scope="col" className="dtable-num">
                        {n} lägenheter
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priced.map(({ p }) => {
                    const r = rows.get(p.slug) ?? [];
                    return (
                      <tr key={p.slug}>
                        <th scope="row">
                          <Link className="pg-link" href={`/forvaltare/${p.slug}`}>
                            {p.name}
                          </Link>
                          <span className="pg-sub">
                            {r[0]?.basis}, {VAT_TEXT[r[0]?.vat ?? "unknown"]}
                          </span>
                        </th>
                        {r.map((x, i) => (
                          <td key={SIZES[i]} className="dtable-num">
                            <Cell r={x} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollRegion>

            <ul className="legend" aria-label="Teckenförklaring">
              <li>
                <StatusMark status="verified" /> Verifierat: står på förvaltarens sida
              </li>
              <li>
                <StatusMark status="estimated" /> Uppskattning: räknat av oss mellan publicerade punkter
              </li>
              <li>
                <StatusMark status="assumed" /> Antagande: vår tolkning av en oklar uppgift
              </li>
            </ul>

            <p className="small muted gsec-note">
              {unpriced.length > 0 && (
                <>
                  Anger inget pris:{" "}
                  {unpriced.map(({ p }, i) => (
                    <span key={p.slug}>
                      <Link className="link" href={`/forvaltare/${p.slug}`}>
                        {p.name}
                      </Link>
                      {i < unpriced.length - 2 ? ", " : i === unpriced.length - 2 ? " och " : ""}
                    </span>
                  ))}
                  .{" "}
                </>
              )}
              Se <Link className="link" href="/metod#priser">hur vi räknar</Link> eller <Link className="link" href="/#rakna">räkna för just er storlek</Link>.
            </p>
          </section>

          <section className="gsec" aria-labelledby="storleken">
            <div className="gsec-head">
              <h2 className="h3" id="storleken">
                Hur priset följer föreningens storlek
              </h2>
              <p className="muted">
                {shrinking
                  ? "Priset per år stiger med antal lägenheter, men inte lika fort. Hos förvaltarna som visar flera storlekar blir priset per lägenhet lägre ju större föreningen är."
                  : "Så här ser priset per år ut för olika storlekar, för de förvaltare som anger underlag."}
              </p>
            </div>

            <div className="gsec-chart tile">
              <p className="fine gchart-title">Kr per år mot antal lägenheter</p>
              <div className="curve-wide">
                <PriceCurve providers={inputs} size="full" withRuleOfThumb />
              </div>
              <div className="curve-narrow">
                <PriceCurve providers={inputs} size="tall" withRuleOfThumb />
              </div>
            </div>

            <details className="twin">
              <summary className="twin-sum">Visa diagrammets punkter som tabell</summary>
              <ScrollRegion label="Alla punkter i diagrammet" className="dtable-wrap">
                <table className="dtable">
                  <caption className="sr-only">Alla punkter i diagrammet</caption>
                  <thead>
                    <tr>
                      <th scope="col">Förvaltare</th>
                      <th scope="col">Underlag</th>
                      <th scope="col" className="dtable-num">
                        Antal lägenheter
                      </th>
                      <th scope="col" className="dtable-num">
                        Pris per år
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {points.map((x) => (
                      <tr key={x.key}>
                        <th scope="row">{x.name}</th>
                        <td>{x.basis}</td>
                        <td className="dtable-num">{x.lgh}</td>
                        <td className="dtable-num">{x.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>
            </details>

            <h3 className="h4 gsec-sub">Kr per lägenhet och år</h3>
            <ScrollRegion label="Pris per lägenhet och år för 20, 50 och 100 lägenheter" className="dtable-wrap dtable-sticky">
              <table className="dtable">
                <caption className="sr-only">Pris per lägenhet och år för 20, 50 och 100 lägenheter</caption>
                <thead>
                  <tr>
                    <th scope="col">Förvaltare</th>
                    {SIZES.map((n) => (
                      <th key={n} scope="col" className="dtable-num">
                        {n} lägenheter
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {priced.map(({ p }) => (
                    <tr key={p.slug}>
                      <th scope="row">{p.name}</th>
                      {(rows.get(p.slug) ?? []).map((r, i) => (
                        <td key={SIZES[i]} className="dtable-num">
                          {r.perLgh === null ? (
                            <span className="muted">Inget pris</span>
                          ) : (
                            <span className="pg-cell">
                              <StatusMark status={r.status ?? "none"} />
                              {r.kind === "estimate" || r.kind === "assumption" ? "ca " : ""}
                              {num(r.perLgh)}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>

            {fits.map(({ p, fit }) => (
              <p key={p.slug} className="gsec-text">
                Prislistan hos {p.name} följer en rak linje: en fast del på ca {num(round100(fit.base))} kr per år plus ca {num(fit.slope)} kr för varje lägenhet. Det är vår beräkning av
                listans punkter, med som mest {num(Math.ceil(fit.maxError))} kr avvikelse. Därför blir priset per lägenhet lägre ju större föreningen är: den fasta delen delas på fler
                lägenheter.
              </p>
            ))}
          </section>

          <section className="gsec" aria-labelledby="lasratt">
            <div className="gsec-head">
              <h2 className="h3" id="lasratt">
                Läs priset rätt
              </h2>
              <p className="muted">Fyra saker gör att två siffror som ser lika ut ändå inte är det.</p>
            </div>

            <ul className="read-list">
              <li className="read-item">
                <h3 className="h4">Moms</h3>
                <p>
                  {withVat.length === 0
                    ? "Ingen av förvaltarna med pris anger om priset är med eller utan moms."
                    : `Bara ${withVat.length} av ${priced.length} förvaltare med pris säger om priset är med eller utan moms (${withVat.map(({ p, b }) => `${p.name}: ${b.pricing.model !== "on_request" ? VAT_TEXT[b.pricing.vat] : ""}`).join(", ")}).`}{" "}
                  Nabo skriver att priset bland annat beror på om föreningen är momsregistrerad. Fråga därför alltid om priset gäller med eller utan moms, och berätta om ni är momsregistrerade.
                </p>
              </li>
              <li className="read-item">
                <h3 className="h4">Period</h3>
                <p>
                  {unknownPeriod.length > 0
                    ? `${unknownPeriod.map(({ p }) => p.name).join(" och ")} anger en tumregel per lägenhet utan att säga per vilken period. Vi har räknat med per år och märkt siffran som antagande.`
                    : "Alla priser vi visar anger vilken period de gäller."}{" "}
                  Be om pris per år i kronor, inte bara per lägenhet.
                </p>
              </li>
              <li className="read-item">
                <h3 className="h4">Vad som ingår</h3>
                <p>
                  Förvaltarna listar mellan {Math.min(...includedCounts)} och {Math.max(...includedCounts)} punkter i grundtjänsten
                  {noList > 0 ? `, och ${noList} ${noList === 1 ? "listar ingen" : "listar inga"}` : ""}. Fastum skriver själva att det kan skilja sig vad som ingår och vad som kostar extra mellan olika
                  förvaltare. Två lika stora priser kan därför betyda olika mycket arbete.
                </p>
              </li>
              <li className="read-item">
                <h3 className="h4">Tillval</h3>
                <p>
                  {withExtrasPrice.length} av {eko.length} förvaltare anger vad något tillval kostar.{" "}
                  {(() => {
                    const erf = eko.find(({ p }) => p.slug === "erf");
                    const find = (re: RegExp) => erf?.b.extras.find((e) => re.test(e.label) && e.price);
                    const a = find(/överlåtelse/i);
                    const b = find(/pantnotering/i);
                    const c = find(/andrahand/i);
                    if (!erf || !a || !b || !c) return null;
                    return `Hos ${erf.p.name} kostar överlåtelse ${a.price}, pantnotering ${b.price} och andrahandsuthyrning ${c.price}. De avgifterna kommer utöver årspriset.`;
                  })()}{" "}
                  Fråga efter priset på överlåtelse, pantnotering och andrahandsuthyrning innan ni jämför.
                </p>
              </li>
            </ul>
          </section>

          <section className="gsec" aria-labelledby="teknisk">
            <div className="gsec-head">
              <h2 className="h3" id="teknisk">
                Teknisk förvaltning
              </h2>
              <p className="muted">
                {tek.length} förvaltare har vi läst för teknisk förvaltning. {tekPriced === 0 ? "Ingen av dem anger ett pris för själva tjänsten" : `${tekPriced} av dem anger ett pris för själva tjänsten`}, så vi kan inte räkna fram något pris
                för er förening. Be om offert, och be om samma sak av alla.
              </p>
            </div>

            {addOns.length > 0 && (
              <>
                <p className="gsec-text">Det enda vi hittar med pris är tillägg som rör en digital underhållsplan:</p>
                <ScrollRegion label="Tillägg med pris som rör underhållsplan" className="dtable-wrap">
                  <table className="dtable">
                    <caption className="sr-only">Tillägg med pris som rör underhållsplan</caption>
                    <thead>
                      <tr>
                        <th scope="col">Förvaltare</th>
                        <th scope="col">Tillägg</th>
                        <th scope="col">Pris enligt förvaltaren</th>
                        <th scope="col">Källa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addOns.map((a) => {
                        const src = requireSource(a.p, a.sourceId);
                        return (
                          <tr key={`${a.p.slug}-${a.label}`}>
                            <th scope="row">
                              <Link className="pg-link" href={`/forvaltare/${a.p.slug}`}>
                                {a.p.name}
                              </Link>
                              {a.listedUnder === "ekonomisk" && <span className="pg-sub">Listas under {CATEGORY.ekonomisk.label.toLowerCase()}</span>}
                            </th>
                            <td>{a.label}</td>
                            <td>{a.price}</td>
                            <td className="dtable-nowrap">
                              <SourceLink url={src.url} checked={src.checked} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollRegion>
                {groupNotes.length > 0 && (
                  <p className="small muted gsec-note">
                    {groupNotes.map((g) => `${g.name}: ${g.text}`).join(" ")} Två förvaltare med samma pris är alltså inte nödvändigtvis två oberoende prisuppgifter.
                  </p>
                )}
              </>
            )}

            <p className="gsec-text">
              Utan publicerade priser går det inte att jämföra på kostnad. Jämför därför först vilka tjänster varje förvaltare listar och vilka nivåer de har, och be sedan om pris för just de delarna.
            </p>
            <div className="gsec-actions">
              <Link className="btn btn-quiet" href="/teknisk-forvaltning">
                Jämför teknisk förvaltning
                <span className="btn-icon">
                  <ArrowIcon size={12} />
                </span>
              </Link>
            </div>
          </section>

          <section className="gsec" aria-labelledby="offerta">
            <div className="gsec-head">
              <h2 className="h3" id="offerta">
                Vad en offertförmedlare skriver
              </h2>
              <p className="muted">{ref.note}</p>
            </div>

            <ScrollRegion label="Offertas allmänna nivåer för ekonomisk förvaltning" className="dtable-wrap">
              <table className="dtable">
                <caption className="sr-only">Offertas allmänna nivåer för ekonomisk förvaltning</caption>
                <thead>
                  <tr>
                    <th scope="col">Nivå enligt Offerta</th>
                    <th scope="col">Omfattning</th>
                    <th scope="col" className="dtable-num">
                      Kr per lägenhet och år
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ref.tiers.map((t) => (
                    <tr key={t.key}>
                      <th scope="row">{t.label}</th>
                      <td>{t.includes}</td>
                      <td className="dtable-num">
                        {num(t.perLghYear.low)} till {num(t.perLghYear.high)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollRegion>

            <p className="gsec-text">
              Offerta anger i allmänhet {num(ref.generalPerLghYear.low)} till {num(ref.generalPerLghYear.high)} kr per lägenhet och år, och {num(ref.totalPerYear.low)} till {num(ref.totalPerYear.high)} kr per år
              totalt. De priser vi läst hos förvaltarna för 20 till 100 lägenheter ligger på {num(lo)} till {num(hi)} kr per lägenhet och år, alltså {overTexts[refVsData]} det allmänna spannet. Offertas nivåer är en
              förmedlares riktlinje och bygger inte på de här förvaltarnas prislistor.
            </p>
            <p className="fine gsec-src">
              <a className="link" href={ref.url} target="_blank" rel="noopener noreferrer">
                {ref.title}
                <ExternalIcon />
              </a>
              . Läst {dateLong(ref.checked)}. {ref.pageDate}.
            </p>
          </section>

          <section className="gsec" aria-labelledby="nasta">
            <div className="gsec-head">
              <h2 className="h3" id="nasta">
                Be om samma sak av alla
              </h2>
              <p className="muted">
                Offerter går bara att jämföra om förvaltarna svarar på samma frågor. Vi har en mall med {QUESTIONS.ekonomisk.length} frågor för ekonomisk förvaltning och en med {QUESTIONS.teknisk.length} för teknisk
                förvaltning, som ni kan skicka till flera förvaltare.
              </p>
            </div>
            <div className="gsec-actions">
              <Link className="btn btn-dark" href="/byta-forvaltare#offert">
                Hämta offertmallen
                <span className="btn-icon">
                  <ArrowIcon size={12} />
                </span>
              </Link>
              <Link className="btn btn-quiet" href="/jamfor">
                Jämför förvaltare sida vid sida
              </Link>
            </div>
          </section>

          <section className="gsec" aria-labelledby="kallor">
            <div className="gsec-head">
              <h2 className="h3" id="kallor">
                Källor
              </h2>
            </div>
            <ul className="sources">
              {sourceRows.map(({ p, s }) => (
                <li key={p.slug} className="source-item">
                  <p>
                    <strong>{p.name}</strong>: {s.title}
                  </p>
                  <p className="fine">
                    <SourceLink url={s.url} checked={s.checked} />
                    {s.pageDate ? `. ${s.pageDate}` : ""}
                  </p>
                </li>
              ))}
              {addOnSources.map(({ p, s }) => (
                <li key={`tillagg-${s.url}`} className="source-item">
                  <p>
                    <strong>{p.name}</strong>, tillägg med pris: {s.title}
                  </p>
                  <p className="fine">
                    <SourceLink url={s.url} checked={s.checked} />
                    {s.pageDate ? `. ${s.pageDate}` : ""}
                  </p>
                </li>
              ))}
              <li className="source-item">
                <p>
                  <strong>Offerta</strong> (förmedlare, inte förvaltare): {ref.title}
                </p>
                <p className="fine">
                  <SourceLink url={ref.url} checked={ref.checked} />
                  {ref.pageDate ? `. ${ref.pageDate}` : ""}
                </p>
              </li>
            </ul>
          </section>
          </div>
        </div>
      </div>
    </>
  );
}
