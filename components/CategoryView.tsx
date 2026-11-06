import Link from "next/link";
import { CategoryLabel, OpennessLead } from "./CategoryText";
import { CompareBar } from "./CompareBar";
import { CompareProvider } from "./CompareProvider";
import { FeatureMatrix } from "./FeatureMatrix";
import { ArrowIcon } from "./icons";
import { KeyFactsTable } from "./KeyFactsTable";
import { OpennessMatrix } from "./OpennessMatrix";
import { PageHead } from "./PageHead";
import { getCompareData, getProviders } from "@/lib/data";
import { pricedCount } from "@/lib/matrix";
import { QUESTIONS } from "@/lib/offer";
import { CATEGORY, withBlock } from "@/lib/schema";
import type { Category } from "@/lib/types";

/** Hela jämförelsen för en kategori: filter, nyckeluppgifter, tjänstematris och öppenhet. */
export function CategoryView({ category }: { category: Category }) {
  const providers = getProviders();
  const compare = getCompareData();
  const total = withBlock(providers, category).length;
  const priced = pricedCount(providers, category);
  const label = CATEGORY[category].label;
  const otherCategory: Category = category === "ekonomisk" ? "teknisk" : "ekonomisk";

  const priceSentence =
    priced === 0
      ? "Ingen av dem anger något pris för själva tjänsten på sin webbplats, så priset får ni genom offert."
      : `${priced} av dem anger något pris på sin webbplats. Resten svarar på förfrågan.`;

  return (
    <>
      <PageHead
        title={label}
        lead={`${CATEGORY[category].what} Här jämförs ${total} förvaltare på det de själva skriver. ${priceSentence}`}
        crumbs={[{ href: CATEGORY[category].path, label }]}
      />

      <CompareProvider data={compare} initialCategory={category} lockCategory>
        <div className="hub-region">
          <CompareBar />

          <section className="hub" id="jamfor-aktorer" aria-labelledby="kf-title">
            <div className="container">
              <div className="hub-head">
                <h2 className="h3" id="kf-title">
                  Nyckeluppgifter
                </h2>
                <p className="muted hub-lead">Raderna är sorterade efter namn. Ingen har betalat för sin plats.</p>
              </div>
              <KeyFactsTable />
            </div>
          </section>

          <section className="hub hub-last" id="tjanster" aria-labelledby="fm-title">
            <div className="container">
              <div className="hub-head">
                <h2 className="h3" id="fm-title">
                  Tjänster inom <CategoryLabel lower />
                </h2>
                <p className="muted hub-lead">Så beskriver varje förvaltare tjänsterna på sin egen sida.</p>
              </div>
              <FeatureMatrix />
            </div>
          </section>

          <section className="band section" id="oppenhet" aria-labelledby="matrix-title">
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

      <section className="section-tight" aria-labelledby="ask-title">
        <div className="container-narrow">
          <h2 className="h3" id="ask-title">
            Frågor att ställa till alla
          </h2>
          <p className="muted ask-lead">Det som saknas i tabellerna ovan går att få svar på genom en offert. Ställ samma frågor till alla förvaltare, så går svaren att jämföra.</p>
          <ol className="ask-list">
            {QUESTIONS[category].map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
          <div className="ask-actions">
            <Link className="btn btn-dark" href={`/byta-forvaltare?mall=${category}#offert`}>
              Offertmall
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
            <Link className="link" href={CATEGORY[otherCategory].path}>
              {CATEGORY[otherCategory].label}
            </Link>
            <Link className="link" href="/jamfor">
              Jämför sida vid sida
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
