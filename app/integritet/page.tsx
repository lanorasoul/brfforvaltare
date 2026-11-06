import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Integritet och personuppgifter",
  description: "Vad vi gör med uppgifterna när ni ber om offert, vem som får dem och hur länge de sparas.",
  alternates: { canonical: "/integritet" },
};

const OPEN_LATER = "läggs till innan förfrågningar öppnas";

export default function IntegritetPage() {
  const op = SITE.operator;
  return (
    <>
      <PageHead
        title="Integritet och personuppgifter"
        lead="Vad vi gör med uppgifterna när ni ber om offert, vem som får dem och hur länge de sparas."
        crumbs={[{ href: "/integritet", label: "Integritet" }]}
      />

      <div className="page-body">
        <div className="container">
          <div className="g-narrow">
            <section className="gsec" aria-labelledby="ansvar">
              <div className="gsec-head">
                <h2 className="h3" id="ansvar">
                  Vem som ansvarar
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  {op
                    ? `${op.name}${op.orgnr ? `, organisationsnummer ${op.orgnr}` : ""}${op.address ? `, ${op.address}` : ""}, är personuppgiftsansvarig för uppgifterna i en offertförfrågan.`
                    : `Uppgift om vem som är personuppgiftsansvarig ${OPEN_LATER}.`}
                </li>
                <li>
                  Frågor om uppgifterna, och begäran om utdrag, rättelse eller radering:{" "}
                  {SITE.contactEmail ? (
                    <a className="link" href={`mailto:${SITE.contactEmail}`}>
                      {SITE.contactEmail}
                    </a>
                  ) : (
                    `kontaktadress ${OPEN_LATER}.`
                  )}
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="insamling">
              <div className="gsec-head">
                <h2 className="h3" id="insamling">
                  Vad vi samlar in
                </h2>
              </div>
              <ul className="bullets">
                <li>
                  Bara det formuläret frågar efter: föreningens namn, ort och antal lägenheter, vad ni vill ha offert på, vilka tjänster ni vill ha och vad som är viktigast för er (valfritt), nuvarande förvaltare (valfritt), ert namn, er roll i föreningen (valfritt), e-postadress, telefonnummer (valfritt) och ett meddelande (valfritt).
                </li>
                <li>Skickar ni ingen förfrågan samlar vi inte in något om er. Jämförelsen kräver inga uppgifter, och Hitta förvaltare skickar ingenting förrän ni skickar i sista steget.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="skal">
              <div className="gsec-head">
                <h2 className="h3" id="skal">
                  Varför, och på vilken grund
                </h2>
              </div>
              <ul className="bullets">
                <li>För att skicka er förfrågan till de förvaltare ni har valt, eller till de förvaltare vi bedömer passar er när ni ber oss matcha er, så att de kan svara er.</li>
                <li>
                  Grunden är ert samtycke, som ni ger genom att kryssa i rutan innan ni skickar. Ni kan ta tillbaka samtycket, men det gäller inte det som redan har skickats vidare till en förvaltare.
                </li>
                <li>Vi använder inte uppgifterna till något annat, och aldrig som underlag för uppgifterna om förvaltarna på sajten.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="mottagare">
              <div className="gsec-head">
                <h2 className="h3" id="mottagare">
                  Vem som får uppgifterna
                </h2>
              </div>
              <ul className="bullets">
                <li>De förvaltare ni har valt, högst tre. Ber ni oss i stället matcha er får högst tre förvaltare som vi bedömer passar er förfrågan. Ingen annan förvaltare får den.</li>
                <li>
                  Den e-posttjänst som tar emot förfrågan åt oss och skickar den till vår brevlåda. Den behandlar uppgifterna för vår räkning.
                </li>
                <li>Sajten körs hos Vercel, som i sina driftloggar och sin brandvägg kan se tekniska uppgifter som IP-adress. Brandväggen använder IP-adressen för att stoppa den som skickar för många förfrågningar.</li>
                <li>Vercel och e-posttjänsten är amerikanska företag. Uppgifterna kan därför behandlas utanför EU, med de skyddsåtgärder som dataskyddsförordningen kräver, till exempel EU:s standardavtalsklausuler.</li>
                <li>Vi säljer inte uppgifterna och lämnar dem inte till andra.</li>
                <li>När en förvaltare har fått förfrågan ansvarar förvaltaren själv för hur den hanteras.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="lagring">
              <div className="gsec-head">
                <h2 className="h3" id="lagring">
                  Hur länge uppgifterna sparas
                </h2>
              </div>
              <ul className="bullets">
                <li>Sajten sparar ingenting. Det finns ingen databas, och formuläret lagrar ingenting i er webbläsare.</li>
                <li>Förfrågan finns som e-post i vår brevlåda. Vi raderar den senast tolv månader efter att vi tog emot den.</li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="ratt">
              <div className="gsec-head">
                <h2 className="h3" id="ratt">
                  Era rättigheter
                </h2>
              </div>
              <ul className="bullets">
                <li>Ni kan be om ett utdrag över vilka uppgifter vi har om er, få fel rättade och be oss radera uppgifterna.</li>
                <li>Ni kan invända mot hur vi hanterar uppgifterna och be om att hanteringen begränsas.</li>
                <li>
                  Ni kan lämna klagomål till Integritetsskyddsmyndigheten (IMY), som är tillsynsmyndighet för personuppgifter i Sverige.
                </li>
              </ul>
            </section>

            <section className="gsec" aria-labelledby="cookies">
              <div className="gsec-head">
                <h2 className="h3" id="cookies">
                  Cookies och mätning
                </h2>
              </div>
              <ul className="bullets">
                <li>Sajten använder inga cookies och ingen besöksstatistik.</li>
                <li>Checklistorna på sidan om att byta förvaltare sparar vad ni kryssat i i er egen webbläsare. Det skickas aldrig till oss.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
