import Link from "next/link";
import { Bento } from "@/components/Bento";
import { CategoryLabel, CategoryWhat, OpennessLead } from "@/components/CategoryText";
import { CompareBar } from "@/components/CompareBar";
import { CompareProvider } from "@/components/CompareProvider";
import { Coverage, type CoverageData } from "@/components/Coverage";
import { Faq, type FaqItem } from "@/components/Faq";
import { FeatureMatrix } from "@/components/FeatureMatrix";
import { HeroFacade } from "@/components/HeroFacade";
import { ArrowIcon } from "@/components/icons";
import { KeyFactsTable } from "@/components/KeyFactsTable";
import { LoopSection, type LoopData } from "@/components/LoopSection";
import { OpennessMatrix } from "@/components/OpennessMatrix";
import { PriceCalculator, type CalcProvider } from "@/components/PriceCalculator";
import { getCompareData, getProviders, requireSource } from "@/lib/data";
import { dateLong } from "@/lib/format";
import { allMatrixStats, pricedCount } from "@/lib/matrix";
import { priceRows } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { withBlock } from "@/lib/schema";
import { HSB_REGIONALS_TOTAL, isHsb, SITE } from "@/lib/site";

export default function Home() {
  const providers = getProviders();
  const compare = getCompareData();

  const eko = withBlock(providers, "ekonomisk");
  const tek = withBlock(providers, "teknisk");

  // Räknaren och diagrammen bygger bara på ekonomisk förvaltning. Ingen förvaltare anger ett pris för teknisk förvaltning.
  const calc: CalcProvider[] = eko.map(({ provider: p, block: b }) => {
    const src = requireSource(p, b.pricing.source);
    return { slug: p.slug, name: p.name, pricing: b.pricing, sourceUrl: src.url, sourceTitle: src.title, sourceChecked: src.checked };
  });
  const rows50 = priceRows(calc, 50);

  const stats = allMatrixStats(providers);
  const ekoPriced = pricedCount(providers, "ekonomisk");
  const tekPriced = pricedCount(providers, "teknisk");
  const coverage: CoverageData = {
    providers: providers.length,
    hsb: { read: providers.filter(isHsb).length, total: HSB_REGIONALS_TOTAL },
    ekonomisk: { providers: eko.length, priced: ekoPriced },
    teknisk: { providers: tek.length, priced: tekPriced },
    published: stats.published,
    cells: stats.cells,
    checkedAt: SITE.dataCheckedAt,
  };

  // Underlag till stegsektionen: allt är hämtat ur datafilerna.
  const withNotice = eko.find((x) => x.block.terms.notice);
  const noticeSrc = withNotice ? requireSource(withNotice.provider, withNotice.block.terms.noticeSource ?? withNotice.block.source) : null;
  const loop: LoopData = {
    today: SITE.dataCheckedAt,
    defaultEnd: `${SITE.dataCheckedAt.slice(0, 4)}-12-31`,
    noticeExample:
      withNotice && noticeSrc
        ? { provider: withNotice.provider.name, text: withNotice.block.terms.notice as string, url: noticeSrc.url, checked: noticeSrc.checked }
        : null,
    compare: rows50
      .filter((r) => r.perYear !== null)
      .slice(0, 3)
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        value: priceLabel(r, r.perYear as number, "year"),
        basis: r.basis,
        vat: VAT_TEXT[r.vat],
        status: r.status ?? "assumed",
      })),
    compareFor: 50,
    claims: [...eko, ...tek].flatMap(({ provider: p, block: b }) =>
      b.claims
        .filter((c) => /byte|övergång/i.test(c.text))
        .map((c) => {
          const s = requireSource(p, c.source);
          return { provider: p.name, text: c.text, url: s.url, checked: s.checked };
        }),
    ),
  };

  const faq: FaqItem[] = [
    {
      q: "Varifrån kommer uppgifterna?",
      a: "Från förvaltarnas egna webbplatser. Varje uppgift har en länk till sidan vi läste och datumet då vi läste den. Siffror som vi har räknat fram själva märks Uppskattning eller Antagande.",
    },
    {
      q: "Hur hittar jag förvaltare som passar vår brf?",
      a: (
        <>
          Svara på några frågor i <Link className="link" href="/hitta-forvaltare">guiden</Link>. Den visar alla förvaltare som har rätt förvaltning på sina egna sidor och verkar där ni finns, i namnordning och utan poäng. Ni väljer själva vilka ni vill gå vidare med.
        </>
      ),
    },
    {
      q: "Vad är skillnaden mellan ekonomisk och teknisk förvaltning?",
      a: "Ekonomisk förvaltning är bokföring, avisering, fakturor, budget och årsredovisning. Teknisk förvaltning är tillsyn av fastigheten, underhållsplan, besiktningar och upphandling av entreprenörer. Det går att anlita olika förvaltare för de två delarna. ERF skriver till exempel att de bara erbjuder ekonomisk förvaltning och samarbetar med tekniska förvaltare vid behov.",
    },
    {
      q: "Varför saknas pris hos så många förvaltare?",
      a: `${eko.length - ekoPriced} av ${eko.length} förvaltare anger inget pris för ekonomisk förvaltning på sin webbplats, och ${tek.length - tekPriced} av ${tek.length} anger inget pris för teknisk förvaltning. Då visar vi Pris på förfrågan i stället för att gissa.`,
    },
    {
      q: "Hur fungerar filtret för ort?",
      a: "Vi har skrivit in de orter som förvaltarens egen sida nämner. Filtret döljer bara förvaltare vars sidor nämner andra orter. De som anger hela landet eller inga orter visas alltid. Att en ort saknas betyder inte att förvaltaren tackar nej, så fråga dem.",
    },
    {
      q: "Varför finns HSB med flera gånger?",
      a: `HSB består av ${HSB_REGIONALS_TOTAL} fristående regionala föreningar med egna tjänster, avtal och webbplatser. Vi har läst ${coverage.hsb.read} av dem och lägger till fler. Därför kan två HSB-föreningar skilja sig åt, till exempel i hur många timmar som ingår i ett paket.`,
    },
    {
      q: "Går priserna att jämföra rakt av?",
      a: "Inte alltid. Förvaltarna räknar olika: en anger en prislista exklusive moms, en annan en tumregel utan att säga om moms ingår. Vi visar underlag och moms vid varje siffra, och offertmallen hjälper er att få svar på samma frågor från alla.",
    },
    {
      q: "Kan en förvaltare betala för att synas högre upp?",
      a: (
        <>
          Nej. Listorna och guiden står i namnordning, och betalning påverkar aldrig ordning, märken eller vilka uppgifter som visas. Sajten har inga annonser i dag, och om vi inför dem märks de Annons och ligger i egna rutor. Läs mer under <Link className="link" href="/metod#finansiering">Så finansieras sajten</Link>.
        </>
      ),
    },
    {
      q: "Vad kostar det att använda sajten?",
      a: "Ingenting för styrelser. Vi planerar att ta betalt av förvaltare för offertförfrågningar de svarar på, men aldrig för plats, ordning eller märken.",
    },
    {
      q: "Hur aktuella är uppgifterna?",
      a: `Varje uppgift visar datum för när den senast lästes. Det senaste kontrolldatumet är ${dateLong(SITE.dataCheckedAt)}. Priser och villkor kan ändras, så fråga alltid förvaltaren innan ni bestämmer er.`,
    },
    {
      q: "Jag arbetar hos en förvaltare och något stämmer inte",
      a: (
        <>
          Skicka rättelsen tillsammans med en länk till sidan där det står. Är det ett fel hos oss rättar vi det och sätter nytt läsdatum. Ändrar ni uppgiften på er egen sida läser vi om den.{" "}
          {SITE.contactEmail ? <a className="link" href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> : "Kontaktuppgift läggs till innan sajten öppnas."}
        </>
      ),
    },
  ];

  return (
    <>
      <section className="top">
        <HeroFacade />
        <div className="container top-inner">
          <h1 className="display">
            Jämför förvaltare
            <br />
            för er brf
          </h1>
          <p className="lead top-lead">
            {providers.length} förvaltare av ekonomisk och teknisk förvaltning, jämförda på pris, uppsägningstid, tjänster och var de verkar. Vi läser deras egna sidor, och varje uppgift har källa och datum.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-accent" href="/hitta-forvaltare">
              Hitta förvaltare
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
            <Link className="btn btn-quiet" href="#jamfor-aktorer">
              Se jämförelsen
            </Link>
          </div>
        </div>
      </section>

      <CompareProvider data={compare}>
        <div className="hub-region">
          <CompareBar />

          <section className="hub" id="jamfor-aktorer" aria-labelledby="kf-title">
            <div className="container">
              <div className="hub-head">
                <h2 className="h3" id="kf-title">
                  Nyckeluppgifter, <CategoryLabel lower />
                </h2>
                <p className="muted hub-lead">
                  <CategoryWhat /> Raderna är sorterade efter namn. Ingen har betalat för sin plats.
                </p>
              </div>
              <KeyFactsTable />
            </div>
          </section>

          <section className="hub hub-last" id="tjanster" aria-labelledby="fm-title">
            <div className="container">
              <div className="hub-head">
                <h2 className="h3" id="fm-title">
                  Tjänster, <CategoryLabel lower />
                </h2>
                <p className="muted hub-lead">Så beskriver varje förvaltare tjänsterna på sin egen sida.</p>
              </div>
              <FeatureMatrix />
            </div>
          </section>

          <Coverage data={coverage} />

          <section className="night section" id="oppenhet" aria-labelledby="matrix-title">
            <div className="container">
              <div className="section-head center">
                <h2 className="h2" id="matrix-title">
                  Vad förvaltarna berättar öppet
                </h2>
                <p className="lead">
                  <OpennessLead />
                </p>
              </div>
              <OpennessMatrix />
            </div>
          </section>
        </div>
      </CompareProvider>

      <section className="calc-section section-tight" id="rakna" aria-labelledby="calc-title">
        <div className="container">
          <div className="section-head center">
            <h2 className="h2" id="calc-title">
              Vad kostar ekonomisk förvaltning för er storlek?
            </h2>
            <p className="lead">
              Bara {coverage.ekonomisk.priced} av {coverage.ekonomisk.providers} förvaltare anger något pris. Dra i reglaget för att se vad de säger för just er förening.
            </p>
          </div>
          <PriceCalculator providers={calc} checkedAt={SITE.dataCheckedAt} />
          <p className="calc-after center">
            <Link className="btn btn-quiet" href="/prisguide">
              Prisguiden
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
          </p>
        </div>
      </section>

      <LoopSection data={loop} />

      <Bento providers={compare.rows.ekonomisk} rows50={rows50} checkedAt={SITE.dataCheckedAt} />

      <section className="night faq-section" id="fragor" aria-labelledby="faq-title">
        <div className="container-narrow">
          <h2 className="h3 center" id="faq-title">
            Vanliga frågor
          </h2>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
