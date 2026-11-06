import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "För förvaltare",
  description: "Så visas ni på sajten, hur offertförfrågningar fungerar och vad som gäller för pengar och oberoende.",
  alternates: { canonical: "/for-forvaltare" },
};

export default function ForForvaltarePage() {
  return (
    <>
      <PageHead
        title="För förvaltare"
        lead="Så visas ni på sajten, hur offertförfrågningar fungerar och vad som gäller för pengar och oberoende."
        crumbs={[{ href: "/for-forvaltare", label: "För förvaltare" }]}
      />

      <div className="page-body">
        <div className="container">
          <div className="g-narrow">
            <section className="gsec" aria-labelledby="visas">
              <div className="gsec-head">
                <h2 className="h3" id="visas">
                  Så visas ni
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Vi skriver ner vad era egna webbplatser säger om ekonomisk och teknisk förvaltning: pris, uppsägningstid, tjänster, var ni verkar och vad ni berättar öppet. Varje uppgift har en länk till sidan och datumet då vi läste den.
                </li>
                <li>Alla förvaltare visas på samma sätt och i namnordning. Vi räknar ingen poäng och rangordnar inte.</li>
                <li>Loggan visas i samma storlek för alla och är hämtad från er egen webbplats. Vill ni byta den eller inte visas med logga, hör av er så ändrar vi.</li>
                <li>
                  Ni behöver inte göra något. Är något fel, eller har ni ändrat era sidor, se <a className="link" href="#rattelser">rättelser</a> nedan. Hur vi läser och räknar står på <Link className="link" href="/metod">metodsidan</Link>.
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="forfragningar">
              <div className="gsec-head">
                <h2 className="h3" id="forfragningar">
                  Offertförfrågningar
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Styrelser beskriver i tre steg vad föreningen behöver, hur stor den är och hur de nås. Förfrågan går till högst tre förvaltare som passar svaren. Väljer en styrelse själv förvaltare går förfrågan bara till dem.
                </li>
                <li>
                  En förfrågan innehåller föreningens namn, ort och antal lägenheter, vilken förvaltning de vill ha, vilka tjänster om de har valt sådana, vad som är viktigast för dem, kontaktuppgifter och ett eget meddelande. Vi redigerar den inte.
                </li>
                <li>I början skickar vi förfrågningarna vidare själva, via e-post. Ni svarar styrelsen direkt. Vi är inte part i något avtal mellan er och föreningen.</li>
                <li>Vi lovar inga förfrågningar och inga svarstider åt någon. Vi vet inte i förväg hur många styrelser som kommer att använda Hitta förvaltare.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="pengar">
              <div className="gsec-head">
                <h2 className="h3" id="pengar">
                  Pengar
                </h2>
              </div>
              <ul className="bullets">
                <li>Det kostar ingenting att finnas med, och sajten är gratis för styrelser.</li>
                <li>
                  Vi planerar att ta betalt av förvaltare för varje förfrågan ni svarar på. Pris och villkor är inte bestämda, och ingenting faktureras innan ni skriftligen har godkänt villkoren.
                </li>
                <li>
                  Betalning påverkar aldrig vilka förvaltare som visas på sajten, i vilken ordning eller vilka märken och uppgifter de får.
                </li>
                <li>Vi säljer inte styrelsernas kontaktuppgifter till andra, och vi visar inga omdömen eller betyg.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="intressen">
              <div className="gsec-head">
                <h2 className="h3" id="intressen">
                  Vem som driver sajten
                </h2>
              </div>
              <ul className="bullets">
                <li>{SITE.operator ? `Sajten drivs av ${SITE.operator.name}.` : "Uppgift om vem som driver sajten läggs till innan sajten öppnas."}</li>
                {SITE.conflicts.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
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
                <li>Är det ett fel hos oss rättar vi det och sätter nytt läsdatum. Ändrar ni uppgiften på er egen sida läser vi om den.</li>
                <li>Står uppgiften inte på er egen sida kan vi inte visa den som verifierad. Rättelser kostar ingenting.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
