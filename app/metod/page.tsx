import type { Metadata } from "next";
import Link from "next/link";
import { FeatureMark, FEATURE_LABEL, PresenceMark, PRESENCE_LABEL, StatusMark, STATUS_LABEL } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { SourceLink } from "@/components/SourceLink";
import { Toc } from "@/components/Toc";
import { getProviders, requireSource } from "@/lib/data";
import { dateLong, kr, num } from "@/lib/format";
import { allMatrixStats, pricedCount } from "@/lib/matrix";
import { CATEGORY, DISCLOSURE_KEYS, FEATURE_STATE, FEATURE_STATE_ORDER, FEATURES, withBlock } from "@/lib/schema";
import { HSB_REGIONALS_TOTAL, isHsb, NKI_AVERAGE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Så räknar vi",
  description:
    "Vad vi läser, hur vi märker hur säkra siffrorna är, hur vi räknar priser, hur ordningen bestäms och hur annonser och rättelser hanteras.",
  alternates: { canonical: "/metod" },
};

const TOC = [
  { id: "vad-vi-laser", label: "Vad vi läser" },
  { id: "markena", label: "Vad märkena betyder" },
  { id: "priser", label: "Så räknar vi priser" },
  { id: "tjanster", label: "Tjänstematrisen" },
  { id: "orter", label: "Filter för ort" },
  { id: "matrisen", label: "Öppenhetsmatrisen" },
  { id: "annonser", label: "Ordning och annonser" },
  { id: "finansiering", label: "Så finansieras sajten" },
  { id: "rattelser", label: "Rättelser" },
  { id: "begransningar", label: "Begränsningar" },
];

export default function MetodPage() {
  const providers = getProviders();
  const stats = allMatrixStats(providers);
  const eko = withBlock(providers, "ekonomisk");
  const tek = withBlock(providers, "teknisk");
  const tekPriced = pricedCount(providers, "teknisk");
  const hsb = providers.filter(isHsb);
  const hsbOrg = hsb[0] ? requireSource(hsb[0], "g0") : null;

  // Räkneexempel hämtat ur ERF:s prislista, så att texten följer datan.
  const erf = eko.find(({ provider }) => provider.slug === "erf");
  const erfPricing = erf && erf.block.pricing.model === "list" ? erf.block.pricing : null;
  const N = 35;
  let example: { a: { lgh: number; perYear: number }; b: { lgh: number; perYear: number }; value: number } | null = null;
  if (erfPricing) {
    const sorted = [...erfPricing.anchors].sort((x, y) => x.lgh - y.lgh);
    const b = sorted.find((p) => p.lgh >= N);
    const a = [...sorted].reverse().find((p) => p.lgh <= N);
    if (a && b && a.lgh !== b.lgh) {
      example = { a, b, value: a.perYear + ((b.perYear - a.perYear) * (N - a.lgh)) / (b.lgh - a.lgh) };
    }
  }

  return (
    <>
      <PageHead
        title="Så räknar vi"
        lead="Vi läser förvaltarnas egna sidor om ekonomisk och teknisk förvaltning, skriver ner vad som står där och visar hur säkra vi är på varje siffra. Här är reglerna vi följer."
        crumbs={[{ href: "/metod", label: "Metod" }]}
      />

      <div className="page-body">
        <div className="container guide-layout">
          <aside className="guide-aside">
            <Toc items={TOC} />
          </aside>

          <div className="guide-main">
            <section className="gsec" aria-labelledby="vad-vi-laser">
              <div className="gsec-head">
                <h2 className="h3" id="vad-vi-laser">
                  Vad vi läser
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Vi läser förvaltarnas egna webbplatser: sidor om ekonomisk förvaltning, teknisk förvaltning, priser, vanliga frågor och kundportal. Allt vi visar kommer därifrån, med en länk till sidan och datumet då vi läste den.
                </li>
                <li>Vi har inte ringt förvaltarna, bett om offerter eller använt uppgifter som inte är offentliga. Offertförfrågningar och svar från förvaltare används aldrig som underlag för uppgifterna på sajten.</li>
                <li>
                  Ekonomisk förvaltning och teknisk förvaltning redovisas var för sig, eftersom förvaltare kan erbjuda bara den ena. Vad en förvaltare skriver om sig själv som helhet visas på förvaltarens egen sida hos oss.
                </li>
                <li>
                  Priset räknas bara för ekonomisk förvaltning.{" "}
                  {tekPriced === 0
                    ? `Ingen av de ${tek.length} förvaltare vi läst anger ett pris för teknisk förvaltning, så där visar vi inga priser. Anger en förvaltare ett pris för ett tillägg, till exempel en digital underhållsplan, visar vi det som förvaltaren skriver, med källa.`
                    : "För teknisk förvaltning visar vi bara priser som förvaltaren själv anger."}
                </li>
                <li>
                  Allmän vägledning från andra än förvaltare, till exempel en offertförmedlare, visas separat och med avsändare. Den används aldrig som underlag för en förvaltares pris.
                </li>
                <li>
                  Kundnöjdhet (NKI) kommer från analysföretaget Prognoscentret, som varje år frågar styrelser i omkring 6 500 bostadsrättsföreningar. Bara förvaltare med minst 20 svar får ett eget värde, och bara de värden som har publicerats visas här. Branschsnittet {NKI_AVERAGE.year} var {NKI_AVERAGE.value}.
                </li>
                <li>
                  Omdömen från Reco visas med antal omdömen. Under 20 omdömen märks betyget som för få för slutsatser. Betyg som bara förvaltaren själv anger, till exempel från Google, Trustpilot eller en egen kundportal, märks Enligt förvaltaren.
                </li>
                <li>
                  Just nu har vi {providers.length} förvaltare: {eko.length} med ekonomisk och {tek.length} med teknisk förvaltning. Vi har börjat med stora och välkända förvaltare och lägger till fler. Urvalet är ingen rangordning. Datan kontrollerades senast {dateLong(SITE.dataCheckedAt)}.
                </li>
                <li>
                  HSB består av {HSB_REGIONALS_TOTAL} fristående regionala föreningar med egna tjänster, avtal och webbplatser. Förvaltningen sköts av föreningen där brf:en ligger. Vi visar HSB som en förvaltare och skriver ut när en uppgift bara gäller en region, till exempel paketen hos HSB Stockholm eller avtalstiden hos HSB Mälardalarna.
                  {hsbOrg ? (
                    <>
                      {" "}
                      <SourceLink url={hsbOrg.url} checked={hsbOrg.checked} label="HSB om sin organisation" />.
                    </>
                  ) : null}
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="markena">
              <div className="gsec-head">
                <h2 className="h3" id="markena">
                  Vad märkena betyder
                </h2>
                <p className="muted">Tre sorters märken. Det första visar hur säker en siffra är, det andra hur en förvaltare beskriver en tjänst och det tredje om förvaltaren berättar något öppet.</p>
              </div>

              <div className="mark-grid">
                <div className="mark-card tile">
                  <h3 className="h4">Märken på siffror</h3>
                  <ul className="mark-list">
                    <li className="mark-item">
                      <StatusMark status="verified" size={16} />
                      <div>
                        <p>
                          <strong>{STATUS_LABEL.verified}</strong>
                        </p>
                        <p className="small muted">Siffran står på förvaltarens egen sida, så som vi visar den.</p>
                      </div>
                    </li>
                    <li className="mark-item">
                      <StatusMark status="estimated" size={16} />
                      <div>
                        <p>
                          <strong>{STATUS_LABEL.estimated}</strong>
                        </p>
                        <p className="small muted">Vi har räknat fram siffran mellan punkter som förvaltaren publicerat. Räkneexemplet längre ned visar hur.</p>
                      </div>
                    </li>
                    <li className="mark-item">
                      <StatusMark status="assumed" size={16} />
                      <div>
                        <p>
                          <strong>{STATUS_LABEL.assumed}</strong>
                        </p>
                        <p className="small muted">Förvaltarens sida är oklar och vi har tolkat den, till exempel att en tumregel gäller per år. Antagandet står utskrivet vid siffran.</p>
                      </div>
                    </li>
                    <li className="mark-item">
                      <StatusMark status="none" size={16} />
                      <div>
                        <p>
                          <strong>{STATUS_LABEL.none}</strong>
                        </p>
                        <p className="small muted">Förvaltaren anger inget pris att räkna på. Vi gissar inte.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="mark-card tile">
                  <h3 className="h4">Märken på tjänster</h3>
                  <ul className="mark-list">
                    {FEATURE_STATE_ORDER.map((st) => (
                      <li key={st} className="mark-item">
                        <FeatureMark state={st} size={20} />
                        <div>
                          <p>
                            <strong>{FEATURE_LABEL[st]}</strong>
                          </p>
                          <p className="small muted">{FEATURE_STATE[st].help}</p>
                        </div>
                      </li>
                    ))}
                    <li className="mark-item">
                      <FeatureMark state="none" size={20} />
                      <div>
                        <p>
                          <strong>{FEATURE_LABEL.none}</strong>
                        </p>
                        <p className="small muted">Sidan vi läste listar inte tjänsten. Det betyder inte att förvaltaren inte erbjuder den, bara att den inte står där. Fråga.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="mark-card tile">
                  <h3 className="h4">Märken på öppenhet</h3>
                  <ul className="mark-list">
                    <li className="mark-item">
                      <PresenceMark presence="published" size={20} />
                      <div>
                        <p>
                          <strong>{PRESENCE_LABEL.published}</strong>
                        </p>
                        <p className="small muted">Sidan säger det tydligt.</p>
                      </div>
                    </li>
                    <li className="mark-item">
                      <PresenceMark presence="partial" size={20} />
                      <div>
                        <p>
                          <strong>{PRESENCE_LABEL.partial}</strong>
                        </p>
                        <p className="small muted">Uppgiften finns delvis eller indirekt, till exempel prisexempel men ingen prislista.</p>
                      </div>
                    </li>
                    <li className="mark-item">
                      <PresenceMark presence="notfound" size={20} />
                      <div>
                        <p>
                          <strong>{PRESENCE_LABEL.notfound}</strong>
                        </p>
                        <p className="small muted">
                          Vi hittade inte uppgiften på sidorna vi läste. Det betyder inte att den inte finns, bara att den inte är offentlig där. Fråga förvaltaren.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="gsec" aria-labelledby="priser">
              <div className="gsec-head">
                <h2 className="h3" id="priser">
                  Så räknar vi priser
                </h2>
                <p className="muted">
                  Alla priser för ekonomisk förvaltning räknas fram på samma sätt ur de uppgifter vi läst. Fem regler gäller.{" "}
                  {tekPriced === 0 ? "För teknisk förvaltning finns inget pris att räkna på." : ""}
                </p>
              </div>

              <ol className="rules">
                <li className="rule">
                  <h3 className="h4">Prislista</h3>
                  <p>
                    Mellan två publicerade storlekar räknar vi rakt mellan punkterna. Ett värde som står i prislistan visas som verifierat och ett värde däremellan som uppskattning. Priset per lägenhet är priset per år delat på antal lägenheter, avrundat nedåt, som ERF gör i sin egen tabell.
                  </p>
                </li>
                <li className="rule">
                  <h3 className="h4">Prisexempel</h3>
                  <p>
                    Några förvaltare anger exempel i stället för en lista, till exempel för 20, 50 och 100 lägenheter. Ett exempel för exakt er storlek visas som verifierat. Mellan två exempel räknar vi rakt mellan punkterna och märker det uppskattning. Förvaltarens förbehåll, att exempel inte är fasta prisnivåer, står bredvid siffran.
                  </p>
                </li>
                <li className="rule">
                  <h3 className="h4">Tumregel</h3>
                  <p>
                    En tumregel är ett belopp per lägenhet. Anger förvaltaren inte per vilken period räknar vi med per år och märker siffran antagande. Då står antagandet utskrivet vid siffran. Anges perioden räknar vi beloppet gånger antal lägenheter och märker det uppskattning.
                  </p>
                </li>
                <li className="rule">
                  <h3 className="h4">Aldrig utanför det publicerade</h3>
                  <p>
                    Vi extrapolerar inte. Utanför den storleksskala förvaltaren publicerat visar vi förvaltarens eget från-pris om det finns, annars inget pris.
                  </p>
                </li>
                <li className="rule">
                  <h3 className="h4">Moms</h3>
                  <p>
                    Vid varje pris står om det är exklusive moms, inklusive moms eller om moms inte anges. Priser med olika momsgrund går inte att jämföra rakt av, och jämförelsen varnar när de skiljer.
                  </p>
                </li>
              </ol>

              {example && (
                <>
                  <h3 className="h4 gsec-sub">Räkneexempel: ERF, {N} lägenheter</h3>
                  <p className="small muted gsec-lead">
                    ERF anger själva att {N} lägenheter kostar {kr(Math.round(example.value))} per år. Så här kommer vi fram till samma siffra ur prislistan.
                  </p>
                  <ol className="work">
                    <li className="work-row">
                      <p className="work-label">Närmaste publicerade storlekar</p>
                      <p className="work-how">
                        {example.a.lgh} lägenheter kostar {kr(example.a.perYear)} och {example.b.lgh} lägenheter kostar {kr(example.b.perYear)}.
                      </p>
                    </li>
                    <li className="work-row">
                      <p className="work-label">Prisskillnad mellan dem</p>
                      <p className="work-how">
                        {num(example.b.perYear)} minus {num(example.a.perYear)}
                      </p>
                      <p className="work-res">{kr(example.b.perYear - example.a.perYear)}</p>
                    </li>
                    <li className="work-row">
                      <p className="work-label">Hur långt {N} ligger mellan dem</p>
                      <p className="work-how">
                        {N - example.a.lgh} av {example.b.lgh - example.a.lgh} lägenheter
                      </p>
                      <p className="work-res">{((N - example.a.lgh) / (example.b.lgh - example.a.lgh)).toFixed(4).replace(".", ",")}</p>
                    </li>
                    <li className="work-row work-final">
                      <p className="work-label">Pris för {N} lägenheter</p>
                      <p className="work-how">
                        {num(example.a.perYear)} plus {num(example.b.perYear - example.a.perYear)} gånger {N - example.a.lgh} delat på {example.b.lgh - example.a.lgh}
                      </p>
                      <p className="work-res">{kr(Math.round(example.value))}</p>
                    </li>
                  </ol>
                </>
              )}
            </section>

            <section className="gsec" aria-labelledby="tjanster">
              <div className="gsec-head">
                <h2 className="h3" id="tjanster">
                  Så fungerar tjänstematrisen
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  För varje kategori listar vi {FEATURES.ekonomisk.length} tjänster för ekonomisk förvaltning ({FEATURES.ekonomisk.map((f) => f.label.toLowerCase()).slice(0, 4).join(", ")} och så vidare) och {FEATURES.teknisk.length} för teknisk förvaltning (
                  {FEATURES.teknisk.map((f) => f.label.toLowerCase()).slice(0, 4).join(", ")} och så vidare). Varje ruta visar hur förvaltarens egen sida beskriver tjänsten: ingår, ingår i vissa nivåer, tillval eller bara nämnd.
                </li>
                <li>
                  En tom ruta betyder att sidan vi läste inte listar tjänsten, inte att förvaltaren saknar den. Förvaltare vars sidor är korta eller bygger på bilder får fler tomma rutor än de borde.
                </li>
                <li>
                  Vi räknar inte ihop rutorna till en poäng och sorterar inte efter dem. Längst ned i varje kolumn står bara hur många förvaltare som nämner tjänsten alls.
                </li>
                <li>Samma namn betyder inte alltid samma innehåll. Paket med samma namn kan innehålla olika mycket hos olika HSB-föreningar, och Förvaltare Bas har till exempel olika många timmar hos HSB Skåne och HSB Mölndal.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="orter">
              <div className="gsec-head">
                <h2 className="h3" id="orter">
                  Så fungerar filtret för ort
                </h2>
              </div>
              <ul className="bullets">
                <li>Orterna är de som förvaltarens egen sida nämner. Vi lägger inte till orter som vi tror att förvaltaren verkar i.</li>
                <li>
                  Filtret döljer bara förvaltare vars sidor nämner andra orter. De som anger att de verkar i hela landet visas alltid, och likaså de som inte nämner några orter, märkta med att orten inte anges.
                </li>
                <li>
                  Att en ort saknas betyder inte att förvaltaren tackar nej till er. Fråga också förvaltare som är dolda, om det är viktigt för er. Det går att visa alla igen under tabellen.
                </li>
                <li>
                  Vi matchar ortens namn utan hänsyn till versaler eller å, ä och ö, och från tre bokstäver. Skriver ni Hels hittar ni de som nämner Helsingborg.
                </li>
                <li>
                  <Link className="link" href="/hitta-forvaltare">Guiden</Link> använder samma regler. Där anger ni också vad ni vill ha hjälp med, och vi visar alla förvaltare som har den förvaltningen på sina sidor. Önskemål om tjänster döljer ingen, de visas som märken i en egen tabell. Orter som minst två förvaltare nämner på sina egna sidor har en egen sida under adressen /forvaltare-i.
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="matrisen">
              <div className="gsec-head">
                <h2 className="h3" id="matrisen">
                  Så fungerar öppenhetsmatrisen
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Matrisen ställer {DISCLOSURE_KEYS.ekonomisk.length} frågor till varje förvaltare, för varje kategori. För ekonomisk förvaltning: {DISCLOSURE_KEYS.ekonomisk.map((k) => k.label.toLowerCase()).join(", ")}. För teknisk förvaltning:{" "}
                  {DISCLOSURE_KEYS.teknisk.map((k) => k.label.toLowerCase()).join(", ")}. Svaret är publicerat, delvis eller ej funnet, och varje fråga har en beskrivning av vad som räknas som publicerat.
                </li>
                <li>
                  Den visar vad en förvaltare berättar öppet, inte hur bra förvaltaren är. En förvaltare kan vara mycket bra och ändå inte publicera sin prislista.
                </li>
                <li>
                  Vi räknar inte ihop frågorna till en poäng och rangordnar inte förvaltare efter matrisen. Vi räknar bara hur många svar som är publicerade: just nu {stats.published} av {stats.cells}, räknat över båda kategorierna.
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="annonser">
              <div className="gsec-head">
                <h2 className="h3" id="annonser">
                  Ordning och annonser
                </h2>
              </div>
              <ul className="bullets">
                <li>Förvaltarlistan, nyckeluppgifterna, tjänstematrisen, guiden och ortssidorna står i namnordning.</li>
                <li>
                  Prisräknaren sorterar efter pris för den storlek ni anger: de som anger pris först, lägst pris först, och därefter de utan pris i namnordning. I jämförelsen ligger kolumnerna i den ordning ni valde förvaltarna. Det är de enda ordningarna vi använder.
                </li>
                <li>Ingen förvaltare har betalat för att synas eller för sin plats. Sajten har i dag inga annonser och inga intäkter från förvaltare.</li>
                <li>
                  Om vi någon gång tar betalt för synlighet gäller det här: annonser märks med ordet Annons, ligger i egna rutor utanför listor och jämförelser, och påverkar aldrig ordning, märken eller vilka uppgifter som visas.
                </li>
                <li>Sajten är gratis för styrelser.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="finansiering">
              <div className="gsec-head">
                <h2 className="h3" id="finansiering">
                  Så finansieras sajten
                </h2>
              </div>
              <ul className="bullets">
                <li>Sajten är gratis för styrelser och har i dag inga intäkter.</li>
                <li>
                  Vi planerar att ta betalt av förvaltare för varje offertförfrågan de svarar på. Pris och villkor är inte bestämda, och ingen faktura skickas innan förvaltaren skriftligen har godkänt villkoren.
                </li>
                <li>
                  Betalning påverkar aldrig vilka förvaltare som visas, i vilken ordning, vilka märken de får eller vilka uppgifter som visas. Guiden visar alla förvaltare som passar styrelsens svar, oavsett om de betalar.
                </li>
                <li>En offertförfrågan går bara till de förvaltare styrelsen själv har valt. Vi säljer inte kontaktuppgifter till andra.</li>
                <li>{SITE.operator ? `Sajten drivs av ${SITE.operator.name}.` : "Uppgift om vem som driver sajten läggs till innan sajten öppnas."}</li>
                {SITE.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="gsec-text">
                Det som gäller för förvaltare står på sidan <Link className="link" href="/for-forvaltare">För förvaltare</Link>. Hur uppgifter från formuläret hanteras står under <Link className="link" href="/integritet">Integritet</Link>.
              </p>
            </section>

            <section className="gsec" aria-labelledby="rattelser">
              <div className="gsec-head">
                <h2 className="h3" id="rattelser">
                  Rättelser
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Hittar ni ett fel eller en uppgift som är gammal? Skicka rättelsen tillsammans med en länk till sidan där det står.{" "}
                  {SITE.contactEmail ? (
                    <a className="link" href={`mailto:${SITE.contactEmail}`}>
                      {SITE.contactEmail}
                    </a>
                  ) : (
                    "Kontaktuppgift läggs till innan sajten öppnas."
                  )}
                </li>
                <li>Är det ett fel hos oss rättar vi det och sätter nytt läsdatum på uppgiften.</li>
                <li>
                  Ändrar en förvaltare sin sida läser vi om den och uppdaterar uppgiften med nytt datum, även om ingen har hört av sig. Vill en förvaltare att en uppgift ändras ska den stå på förvaltarens egen sida. Då läser vi om den.
                </li>
                <li>Står uppgiften inte på förvaltarens egen sida kan vi inte visa den som verifierad. Rättelser kostar ingenting.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="begransningar">
              <div className="gsec-head">
                <h2 className="h3" id="begransningar">
                  Begränsningar
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Vi har {providers.length} förvaltare hittills. Det finns fler, och vi lägger till dem med källa och datum.
                </li>
                <li>
                  Vi har läst webbsidor, inte avtal. Vad som står i ett avtal kan skilja sig från vad sidan säger, och teknisk förvaltning är ofta skräddarsydd efter fastigheten.
                </li>
                <li>Priser och villkor ändras. Varje uppgift visar när vi läste den, men fråga alltid förvaltaren innan ni bestämmer er.</li>
                <li>Vi tolkar sidor som människor har skrivit för människor. Kan en uppgift läsas på två sätt skriver vi det och märker den antagande.</li>
                <li>
                  Vi jämför inte kvalitet eller nöjdhet. Nöjdhetssiffror som en förvaltare själv anger visas som förvaltarens eget påstående, med källa.
                </li>
                <li>Sajten ger ingen juridisk eller ekonomisk rådgivning.</li>
              </ul>
              <p className="gsec-text">
                Fortsätt till <Link className="link" href="/forvaltare">förvaltarna</Link>, <Link className="link" href="/jamfor">jämförelsen</Link> eller <Link className="link" href="/prisguide">prisguiden</Link>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
