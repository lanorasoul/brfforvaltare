import type { Metadata } from "next";
import Link from "next/link";
import { Faq } from "@/components/Faq";
import { HeroFacade } from "@/components/HeroFacade";
import { ArrowIcon, ExternalIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { ProviderOverview } from "@/components/ProviderOverview";
import { getProvider, getProviders, requireSource } from "@/lib/data";
import { dateLong } from "@/lib/format";
import { overviewRows } from "@/lib/overview";
import { NKI_AVERAGE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function Home() {
  const providers = getProviders();
  const rows = overviewRows(providers);
  const withNki = rows.filter((r) => r.nki).length;

  const cite = (slug: string, source: string) => {
    const p = getProvider(slug);
    if (!p) return null;
    const s = requireSource(p, source);
    return { name: p.name, url: s.url, checked: s.checked };
  };

  // Vad förvaltare själva skriver om marknadens prisnivå. Det är inte deras egna priser.
  const market = [
    { cite: cite("nabo", "e3"), text: "En förening med 20 lägenheter betalar ungefär 26 000 till 30 500 kr per år exklusive moms, och en med 100 lägenheter ungefär 64 000 till 77 000 kr." },
    { cite: cite("sbc", "e1"), text: "För mindre och medelstora föreningar ligger priset vanligtvis på 1 100 till 1 300 kr per lägenhet och år. Ju fler lägenheter, desto lägre kostnad per lägenhet." },
  ];
  const noticeSrc = cite("nabo", "f1");

  const steps = [
    { t: "Läs ert avtal", d: "Hitta uppsägningstiden. Tre till tolv månader är vanligast, och avtalet förlängs ofta automatiskt om ni missar datumet." },
    { t: "Be om offerter", d: "Skicka samma frågor till minst tre förvaltare, så att priserna går att jämföra." },
    { t: "Jämför lika mot lika", d: "Pris med och utan moms, vad som ingår, tillval och hur priset räknas upp." },
    { t: "Säg upp skriftligt", d: "Styrelsen beslutar och säger upp avtalet. Spara bekräftelsen med slutdatum." },
    { t: "Låt den nya ta över", d: "Den nya förvaltaren hämtar underlag från den gamla. Hela bytet tar normalt fyra till tolv månader." },
  ];

  // Svaren är vanlig text så att samma text kan visas och läggas i den strukturerade datan.
  const faq = [
    {
      q: "Vad kostar ekonomisk förvaltning för en brf?",
      a: "Det beror mest på antal lägenheter. Förvaltare som publicerar priser ligger på ungefär 700 till 1 300 kr per lägenhet och år, lägre per lägenhet ju större föreningen är. För 50 lägenheter är ERF:s listpris 37 375 kr per år exklusive moms och SBC:s exempel ungefär 55 000 kr. De flesta förvaltare lämnar pris bara på offert.",
    },
    {
      q: "Hur fungerar Hitta förvaltare?",
      a: "Ni berättar i tre korta steg vad föreningen behöver, hur stor den är och hur vi når er. Vi skickar förfrågan till förvaltare som passar, och de kontaktar er med en offert. Det är gratis och ni är inte bundna till något.",
    },
    {
      q: "Vad är skillnaden mellan ekonomisk och teknisk förvaltning?",
      a: "Ekonomisk förvaltning är bokföring, avgiftsavier, leverantörsfakturor, budget och årsredovisning. Teknisk förvaltning är tillsyn av fastigheten, underhållsplan, besiktningar och upphandling av entreprenörer. Föreningen kan anlita olika förvaltare för de två delarna.",
    },
    {
      q: "Hur byter man förvaltare?",
      a: "Kontrollera uppsägningstiden i det nuvarande avtalet, be flera förvaltare om offert, fatta beslut i styrelsen och säg upp avtalet skriftligt. Den nya förvaltaren sköter sedan överlämningen. Räkna med fyra till tolv månader från beslut till färdigt byte.",
    },
    {
      q: "Vad är NKI?",
      a: `Nöjd Kund-Index, ett mått från 0 till 100 som analysföretaget Prognoscentret tar fram varje år genom att fråga styrelser i omkring 6 500 bostadsrättsföreningar. Värden mellan 65 och 75 är medelgod nöjdhet. Branschsnittet ${NKI_AVERAGE.year} var ${NKI_AVERAGE.value}. ${withNki} av ${providers.length} förvaltare här har ett offentligt värde.`,
    },
    {
      q: "Varför saknas pris hos många förvaltare?",
      a: "De flesta förvaltare publicerar inget pris utan lämnar offert. Då skriver vi Pris på offert i stället för att gissa. Rutorna om vad förvaltning brukar kosta hjälper er att bedöma en offert.",
    },
    {
      q: "Kan en förvaltare betala för att synas?",
      a: "Nej. Listan står i namnordning om ni inte själva väljer en annan sortering, och ingen förvaltare har betalat för plats, ordning eller uppgifter. Sajten är gratis för styrelser.",
    },
    {
      q: "Varifrån kommer uppgifterna?",
      a: `Pris, villkor, antal kunder, grundår och kontor kommer från förvaltarnas egna webbplatser. Kundnöjdhet kommer från Prognoscentret och omdömen från Reco. Varje uppgift länkar till sin källa. Uppgifterna lästes senast ${dateLong(SITE.dataCheckedAt)}.`,
    },
  ];

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        name: "Förvaltare för bostadsrättsföreningar",
        itemListElement: rows.map((r, i) => ({ "@type": "ListItem", position: i + 1, name: r.name, url: `${SITE.url}/forvaltare/${r.slug}` })),
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={ld} />
      <section className="top">
        <HeroFacade />
        <div className="container top-inner">
          <h1 className="display">
            Jämför förvaltare
            <br />
            för er brf
          </h1>
          <p className="lead top-lead">
            Pris, kundnöjdhet och villkor för {providers.length} förvaltare av ekonomisk och teknisk förvaltning. Gratis, oberoende och med källa till varje uppgift.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-accent" href="/hitta-forvaltare">
              Få förslag på förvaltare
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
            <Link className="btn btn-quiet" href="#forvaltare">
              Jämför själva
            </Link>
          </div>
        </div>
      </section>

      <section className="ov-section" id="forvaltare" aria-labelledby="ov-title">
        <div className="container">
          <div className="ov-section-head">
            <h2 className="h3" id="ov-title">
              Förvaltare för bostadsrättsföreningar
            </h2>
            <p className="muted">Ange antal lägenheter så räknas priset om. Tryck på Mer om för omdömen, kontor och avtalsvillkor.</p>
          </div>
          <ProviderOverview rows={rows} />
        </div>
      </section>

      <section className="home-band" aria-labelledby="kostnad-title">
        <div className="container">
          <h2 className="h3" id="kostnad-title">
            Vad brukar förvaltning kosta?
          </h2>
          <p className="muted home-band-lead">Bra att ha när ni får en offert från en förvaltare som inte publicerar pris. Siffrorna beskriver marknaden, inte förvaltarnas egna priser.</p>
          <div className="ov-market">
            {market.map((m) =>
              m.cite ? (
                <div key={m.cite.name} className="ov-market-item">
                  <span className="ov-k">Enligt {m.cite.name}</span>
                  <p>{m.text}</p>
                  <a className="fine link" href={m.cite.url} target="_blank" rel="noopener noreferrer">
                    Källa, läst {dateLong(m.cite.checked)} <ExternalIcon />
                  </a>
                </div>
              ) : null,
            )}
          </div>
          <p className="small">
            <Link className="link" href="/prisguide">
              Läs prisguiden
            </Link>
          </p>
        </div>
      </section>

      <section className="home-band" aria-labelledby="byta-title">
        <div className="container">
          <h2 className="h3" id="byta-title">
            Så byter ni förvaltare
          </h2>
          <ol className="home-steps">
            {steps.map((s, i) => (
              <li key={s.t}>
                <span className="home-step-n">{i + 1}</span>
                <strong>{s.t}</strong>
                <span className="muted">{s.d}</span>
              </li>
            ))}
          </ol>
          <p className="small">
            <Link className="link" href="/byta-forvaltare">
              Hela guiden med uppsägningskalender och offertmall
            </Link>
            {noticeSrc && (
              <>
                {" · "}
                <a className="link" href={noticeSrc.url} target="_blank" rel="noopener noreferrer">
                  Källa om uppsägningstider ({noticeSrc.name}) <ExternalIcon />
                </a>
              </>
            )}
          </p>
        </div>
      </section>

      <section className="home-band home-band-last" id="fragor" aria-labelledby="faq-title">
        <div className="container-narrow">
          <h2 className="h3" id="faq-title">
            Vanliga frågor
          </h2>
          <Faq items={faq} />
        </div>
      </section>
    </>
  );
}
