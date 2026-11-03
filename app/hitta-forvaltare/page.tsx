import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { PickForm } from "@/components/PickForm";
import { ResultsTable } from "@/components/ResultsTable";
import { WishMatrix } from "@/components/WishMatrix";
import type { CompareRow } from "@/lib/compare";
import { getCompareData } from "@/lib/data";
import { categoriesOf, guideQuery, matchGuide, NEED_LABEL, NEEDS, parseGuide, type GuideInput, type GuideOutcome } from "@/lib/guide";
import { currentMode, type RequestsMode } from "@/lib/launch";
import { GUIDE_LGH, MAX_PICK, ORT_MAX } from "@/lib/limits";
import { CATEGORIES, CATEGORY, FEATURES } from "@/lib/schema";
import { SITE } from "@/lib/site";
import type { Category } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FEATURE_KEYS = Object.fromEntries(CATEGORIES.map((c) => [c, FEATURES[c].map((f) => f.key)])) as Record<Category, string[]>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const g = parseGuide(await searchParams, FEATURE_KEYS);
  return {
    title: "Hitta förvaltare för er brf",
    description:
      "Svara på några frågor om föreningen och se alla förvaltare som har rätt förvaltning och verkar där ni finns, i namnordning och med källa. Be om offert från högst tre.",
    alternates: { canonical: "/hitta-forvaltare" },
    // Varje svar ger en egen adress. De ska delas, men inte hamna i sökmotorerna.
    ...(g.asked && SITE.indexable ? { robots: { index: false, follow: true } } : {}),
  };
}

function Names({ list }: { list: { slug: string; name: string }[] }) {
  return list.map((m, i) => (
    <span key={m.slug}>
      {i > 0 && (i === list.length - 1 ? " och " : ", ")}
      <Link className="link" href={`/forvaltare/${m.slug}`}>
        {m.name}
      </Link>
    </span>
  ));
}

const HOW = [
  { title: "Ni svarar", text: "Vad ni vill ha hjälp med, var föreningen ligger och hur många lägenheter ni är. Fler önskemål om tjänster är valfria." },
  { title: "Vi visar alla som passar", text: "Alla förvaltare som har rätt förvaltning på sina egna sidor och verkar där ni finns, i namnordning, med pris, villkor och källa." },
  { title: "Ni väljer högst tre", text: "Ni kryssar i vilka ni vill be om offert från. Förfrågan går bara till dem, och de svarar er direkt." },
];

export default async function HittaForvaltarePage({ searchParams }: { searchParams: SearchParams }) {
  const g = parseGuide(await searchParams, FEATURE_KEYS);
  const data = getCompareData();
  const mode = currentMode();
  const cats = categoriesOf(g.need);
  const outcome = g.asked ? matchGuide(data, g) : null;

  return (
    <>
      <PageHead
        title="Hitta förvaltare"
        lead="Svara på några frågor om föreningen. Vi visar alla förvaltare som har rätt förvaltning på sina egna sidor och verkar där ni finns, och ni väljer själva vilka ni vill be om offert från."
        crumbs={[{ href: "/hitta-forvaltare", label: "Hitta förvaltare" }]}
      />

      <div className="page-body">
        <div className="container">
          <form className="panel g-form" action="/hitta-forvaltare" method="get">
            <fieldset className="g-field">
              <legend className="g-legend">Vad vill ni ha hjälp med?</legend>
              <div className="g-choice">
                {NEEDS.map((n) => (
                  <label key={n} className="g-pill">
                    <input className="g-pill-input" type="radio" name="behov" value={n} defaultChecked={g.need === n} />
                    <span className="g-pill-text">{NEED_LABEL[n]}</span>
                  </label>
                ))}
              </div>
              <p className="g-help">
                Ekonomisk förvaltning: {CATEGORY.ekonomisk.what.toLowerCase()} Teknisk förvaltning: {CATEGORY.teknisk.what.toLowerCase()} Väljer ni båda visar vi förvaltare som har båda delarna på sina sidor.
              </p>
            </fieldset>

            <div className="g-row">
              <div className="g-field">
                <label className="g-legend" htmlFor="g-ort">
                  Var ligger föreningen?
                </label>
                <input id="g-ort" name="ort" className="g-input" type="text" list="g-orter" autoComplete="off" spellCheck={false} maxLength={ORT_MAX} defaultValue={g.ort} placeholder="Till exempel Malmö" aria-describedby="g-ort-help" />
                <datalist id="g-orter">
                  {data.places.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <p className="g-help" id="g-ort-help">
                  Vi döljer bara förvaltare vars sidor nämner andra orter. Lämna tomt för att se alla.
                </p>
              </div>
              <div className="g-field">
                <label className="g-legend" htmlFor="g-lgh">
                  Hur många lägenheter?
                </label>
                <input id="g-lgh" name="lgh" className="g-input g-input-short" type="number" inputMode="numeric" min={GUIDE_LGH.min} max={GUIDE_LGH.max} defaultValue={g.lgh} aria-describedby="g-lgh-help" />
                <p className="g-help" id="g-lgh-help">
                  Styr bara vilket pris som visas.
                </p>
              </div>
            </div>

            <details className="twin g-wishes" open={g.wishes.length > 0}>
              <summary className="twin-sum">Vad är extra viktigt för er? (valfritt)</summary>
              <p className="g-help g-wishes-help">
                Det här döljer ingen förvaltare. Önskemålen visas som märken i en egen tabell, så att ni ser vilka som nämner tjänsten på sina sidor. Önskemål för en del ni inte valt ovan räknas inte.
              </p>
              <div className="g-wish-groups">
                {CATEGORIES.map((c) => (
                  <fieldset key={c} className="g-wish-set">
                    <legend className="g-wish-legend">{CATEGORY[c].label}</legend>
                    <div className="g-checks">
                      {FEATURES[c].map((f) => (
                        <label key={f.key} className="g-check">
                          <input className="cbox" type="checkbox" name="onskar" value={f.key} defaultChecked={g.wishes.includes(f.key)} />
                          <span className="g-check-text">
                            <span>{f.label}</span>
                            <span className="fine">{f.help}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>
            </details>

            <div className="g-actions">
              <button type="submit" className="btn btn-dark">
                Visa förvaltare
                <span className="btn-icon">
                  <ArrowIcon size={12} />
                </span>
              </button>
              {outcome && (
                <Link className="link" href="/hitta-forvaltare">
                  Börja om
                </Link>
              )}
            </div>
          </form>

          {outcome ? <Results g={g} outcome={outcome} mode={mode} cats={cats} total={data.providerCount} /> : <How />}
        </div>
      </div>
    </>
  );
}

function How() {
  return (
    <section className="g-how" aria-labelledby="how-title">
      <h2 className="h3" id="how-title">
        Så fungerar guiden
      </h2>
      <ol className="g-steps">
        {HOW.map((s, i) => (
          <li key={s.title} className="tile g-step">
            <span className="step-n" aria-hidden="true">
              {i + 1}
            </span>
            <h3 className="h4">{s.title}</h3>
            <p className="muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <p className="small muted g-how-note">
        Guiden sorterar inte efter pris eller poäng, och ingen kan betala för en plats. Läs mer under <Link className="link" href="/metod#annonser">ordning och annonser</Link> och <Link className="link" href="/metod#finansiering">så finansieras sajten</Link>.
      </p>
    </section>
  );
}

interface ResultsProps {
  g: GuideInput;
  outcome: GuideOutcome<CompareRow>;
  mode: RequestsMode;
  cats: Category[];
  total: number;
}

function Results({ g, outcome, mode, cats, total }: ResultsProps) {
  const { results, hidden, missing } = outcome;
  const label = NEED_LABEL[g.need].toLowerCase();
  const have = results.length + hidden.length;
  const filtered = g.ort !== "";
  const count = (m: string) => results.filter((r) => r.match === m).length;

  const withoutOrt = `/hitta-forvaltare?${guideQuery({ ...g, ort: "" })}#resultat`;
  const compareHref = `/jamfor?kategori=${cats[0]}&lgh=${Math.min(g.lgh, 500)}`;

  const lacking = (c: Category, state: "no" | "other") =>
    missing.filter((m) => m.lacks.some((l) => l.category === c && (state === "no" ? l.state === "no" : l.state !== "no")));

  return (
    <section className="g-results" id="resultat" aria-labelledby="res-title">
      <h2 className="h3" id="res-title">
        Förvaltare för {g.need === "bada" ? "ekonomisk och teknisk förvaltning" : label}
      </h2>
      <p className="muted g-summary">
        Visar {results.length} av {have} förvaltare som har {g.need === "bada" ? "båda delarna" : "delen"} på sina egna sidor.
        {filtered && (
          <>
            {" "}
            Med orten {g.ort}: {count("listed")} nämner den, {count("national")} anger hela landet och {count("unknown")} anger inget verksamhetsområde.
          </>
        )}
        {cats.includes("ekonomisk") && <> Priset gäller {g.lgh} lägenheter.</>}
      </p>

      <div className="tile g-rules">
        <h3 className="h4">Så har vi valt ut och sorterat</h3>
        <ul className="bullets">
          <li>Vi visar alla förvaltare som har {g.need === "bada" ? "både ekonomisk och teknisk förvaltning" : label} på sina egna sidor, och bara då.</li>
          <li>Ordningen är namnordning. Vi räknar ingen poäng, rangordnar inte och ingen kan betala för en plats.</li>
          <li>Orten döljer bara förvaltare vars sidor nämner andra orter. De som anger hela landet eller inget verksamhetsområde visas, med märke.</li>
          <li>Önskemål om tjänster döljer ingen. En tom ruta betyder att sidan vi läste inte listar tjänsten, inte att förvaltaren saknar den.</li>
        </ul>
      </div>

      {mode !== "off" ? (
        <>
          {mode === "preview" && <p className="g-preview small">Förhandsvisning: förfrågningar skickas inte vidare i det här läget.</p>}
          <p className="small muted g-pick-lead">Kryssa i högst {MAX_PICK === 3 ? "tre" : MAX_PICK} förvaltare och be om offert längst ned. Förfrågan går bara till dem ni kryssar i.</p>
          <PickForm
            action="/be-om-offert"
            max={MAX_PICK}
            hidden={[
              { name: "behov", value: g.need },
              ...(g.ort ? [{ name: "ort", value: g.ort }] : []),
              { name: "lgh", value: String(g.lgh) },
              ...g.wishes.map((w) => ({ name: "onskar", value: w })),
            ]}
          >
            <ResultsTable
              results={results}
              categories={cats}
              n={g.lgh}
              ort={g.ort}
              selectable
              caption={`Nyckeluppgifter för ${label}: pris, uppsägningstid, paket och var förvaltaren verkar. Sorterad efter namn.`}
              emptyText={filtered ? `Ingen förvaltare med ${label} nämner orten ${g.ort} eller anger hela landet på sidorna vi läste.` : `Ingen förvaltare har ${label} på sina sidor.`}
            />
          </PickForm>
        </>
      ) : (
        <>
          <ResultsTable
            results={results}
            categories={cats}
            n={g.lgh}
            ort={g.ort}
            caption={`Nyckeluppgifter för ${label}: pris, uppsägningstid, paket och var förvaltaren verkar. Sorterad efter namn.`}
            emptyText={filtered ? `Ingen förvaltare med ${label} nämner orten ${g.ort} eller anger hela landet på sidorna vi läste.` : `Ingen förvaltare har ${label} på sina sidor.`}
          />
          <p className="small muted g-closed">
            Offertförfrågan öppnar när sajten lanseras. Tills dess kan ni gå till förvaltarnas egna sidor via länkarna i kolumnen Källa.
          </p>
        </>
      )}

      {g.wishes.length > 0 && (
        <div className="g-wish-result">
          <h3 className="h4">Det ni bad om</h3>
          <p className="small muted g-wish-lead">
            Så beskriver förvaltarna tjänsterna på sina egna sidor. Ingen har fått poäng och ingen döljs för att den saknar något.
          </p>
          <WishMatrix results={results} wishes={g.wishes} />
        </div>
      )}

      <div className="cnotes small muted">
        {hidden.length > 0 && (
          <p>
            {hidden.length === 1 ? "En förvaltare visas inte" : `${hidden.length} förvaltare visas inte`}, eftersom deras sidor bara nämner andra orter än {g.ort}: <Names list={hidden} />. Det betyder inte att de tackar nej, bara att orten inte står på sidorna vi läste.{" "}
            <Link className="link" href={withoutOrt}>
              Visa alla
            </Link>
          </p>
        )}
        {cats.map((c) => {
          const no = lacking(c, "no");
          const other = lacking(c, "other");
          const name = CATEGORY[c].label.toLowerCase();
          return (
            <div key={c} className="cnotes-group">
              {no.length > 0 && (
                <p>
                  <Names list={no} /> anger på sin egen sida att de inte erbjuder {name}.
                </p>
              )}
              {other.length > 0 && (
                <p>
                  Vi hittade ingen {name} på sidorna vi läste hos <Names list={other} />.
                </p>
              )}
            </div>
          );
        })}
        <p>
          {total} förvaltare finns i jämförelsen. Ni kan se alla på <Link className="link" href="/#jamfor-aktorer">startsidan</Link> eller <Link className="link" href="/forvaltare">förvaltarlistan</Link>.
        </p>
      </div>

      <div className="panel g-next">
        <h3 className="h4">Bra att veta innan ni ber om offert</h3>
        <ul className="bullets">
          <li>Priserna ovan är vad förvaltarna skriver på sina sidor. Det verkliga priset får ni först i en offert.</li>
          <li>
            <Link className="link" href={cats[0] === "teknisk" ? "/byta-forvaltare?mall=teknisk" : "/byta-forvaltare"}>
              Offertmallen
            </Link>{" "}
            hjälper er att få svar på samma frågor från alla.
          </li>
          <li>
            Vill ni se några sida vid sida, gå till <Link className="link" href={compareHref}>jämförelsen</Link>.
          </li>
        </ul>
      </div>
    </section>
  );
}
