import Link from "next/link";
import { Faq, type FaqItem } from "@/components/Faq";
import { HeroFacade } from "@/components/HeroFacade";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { LoopSection, type LoopData } from "@/components/LoopSection";
import type { CalcProvider } from "@/components/PriceCalculator";
import { ProviderOverview } from "@/components/ProviderOverview";
import { getProvider, getProviders, requireSource } from "@/lib/data";
import { dateLong } from "@/lib/format";
import { pricedCount } from "@/lib/matrix";
import { overviewRows } from "@/lib/overview";
import { priceRows } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { withBlock } from "@/lib/schema";
import { HSB_REGIONALS_TOTAL, NKI_AVERAGE, SITE } from "@/lib/site";

export default function Home() {
  const providers = getProviders();
  const rows = overviewRows(providers);

  const eko = withBlock(providers, "ekonomisk");
  const tek = withBlock(providers, "teknisk");

  // Räknaren och diagrammen bygger bara på ekonomisk förvaltning. Ingen förvaltare anger ett pris för teknisk förvaltning.
  const calc: CalcProvider[] = eko.map(({ provider: p, block: b }) => {
    const src = requireSource(p, b.pricing.source);
    return { slug: p.slug, name: p.name, pricing: b.pricing, sourceUrl: src.url, sourceTitle: src.title, sourceChecked: src.checked };
  });
  const rows50 = priceRows(calc, 50);

  const ekoPriced = pricedCount(providers, "ekonomisk");
  const tekPriced = pricedCount(providers, "teknisk");
  const withNki = rows.filter((r) => r.nki).length;

  // Vad förvaltare själva skriver om marknadens prisnivå. Det är inte deras egna priser.
  const market = [
    { slug: "nabo", source: "e3", text: "En förening med 20 lägenheter betalar ungefär 26 000 till 30 500 kr per år exklusive moms, och en med 100 lägenheter ungefär 64 000 till 77 000 kr." },
    { slug: "sbc", source: "e1", text: "För mindre och medelstora föreningar ligger priset vanligtvis på 1 100 till 1 300 kr per lägenhet och år. Ju fler lägenheter, desto lägre kostnad per lägenhet." },
  ].flatMap((m) => {
    const p = getProvider(m.slug);
    if (!p) return [];
    const s = requireSource(p, m.source);
    return [{ name: p.name, text: m.text, url: s.url, checked: s.checked }];
  });

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
      a: "Pris, villkor, antal kunder, grundår och kontor kommer från förvaltarnas egna webbplatser. Kundnöjdhet (NKI) kommer från analysföretaget Prognoscentrets årliga mätning bland bostadsrättsföreningar, och omdömen från Reco. Varje uppgift länkar till sidan vi läste.",
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
      a: `${eko.length - ekoPriced} av ${eko.length} förvaltare anger inget pris för ekonomisk förvaltning på sin webbplats, och ${tek.length - tekPriced} av ${tek.length} anger inget pris för teknisk förvaltning. Då visar vi Endast offert i stället för att gissa. Rutorna under jämförelsen visar vad förvaltare själva säger att det brukar kosta.`,
    },
    {
      q: "Vad är NKI?",
      a: `Nöjd Kund-Index, ett mått från 0 till 100 som analysföretaget Prognoscentret tar fram varje år genom att fråga styrelser i omkring 6 500 bostadsrättsföreningar. Värden mellan 65 och 75 är medelgod nöjdhet. Branschsnittet ${NKI_AVERAGE.year} var ${NKI_AVERAGE.value}. Bara förvaltare med minst 20 svar får ett eget värde, och bara en del av dem publiceras. ${withNki} av ${providers.length} förvaltare här har ett offentligt värde.`,
    },
    {
      q: "Varför är HSB bara en rad?",
      a: `HSB består av ${HSB_REGIONALS_TOTAL} fristående regionala föreningar. Förvaltningen sköts av föreningen där er brf ligger, så paket och villkor kan skilja sig. Vi visar HSB som en förvaltare och skriver ut när en uppgift bara gäller en region.`,
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
            Pris för er storlek, kundnöjdhet, antal kunder och avtalsvillkor för {providers.length} förvaltare. Varje uppgift länkar till sin källa.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-accent" href="#forvaltare">
              Se jämförelsen
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
            <Link className="btn btn-quiet" href="/hitta-forvaltare">
              Hitta förvaltare där ni bor
            </Link>
          </div>
        </div>
      </section>

      <section className="ov-section" id="forvaltare" aria-labelledby="ov-title">
        <div className="container">
          <div className="ov-section-head">
            <h2 className="h3" id="ov-title">
              {providers.length} förvaltare sida vid sida
            </h2>
            <p className="muted">
              Ange hur många lägenheter föreningen har så räknas priset om. Ingen förvaltare har betalat för sin plats. Uppgifterna lästes senast {dateLong(SITE.dataCheckedAt)}.
            </p>
          </div>
          <ProviderOverview rows={rows} />

          <div className="ov-market">
            {market.map((m) => (
              <div key={m.name} className="ov-market-item">
                <span className="ov-k">Vad brukar det kosta? Enligt {m.name}</span>
                <p>{m.text}</p>
                <a className="fine link" href={m.url} target="_blank" rel="noopener noreferrer">
                  Källa, läst {dateLong(m.checked)} <ExternalIcon />
                </a>
              </div>
            ))}
          </div>
          <p className="fine" style={{ marginTop: 12 }}>
            Rutorna ovan beskriver marknaden i stort och är inte förvaltarnas egna priser. Använd dem för att bedöma offerter från förvaltare som inte publicerar pris.
          </p>
        </div>
      </section>

      <LoopSection data={loop} />

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
