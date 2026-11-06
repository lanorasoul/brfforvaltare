import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { PageHead } from "@/components/PageHead";
import { RequestForm } from "@/components/RequestForm";
import { getCompareData } from "@/lib/data";
import { guideQuery, matchGuide, parseGuide, parsePick } from "@/lib/guide";
import { currentMode } from "@/lib/launch";
import { MAX_PICK } from "@/lib/limits";
import { CATEGORIES, FEATURES } from "@/lib/schema";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Be om offert",
  description: "Skicka en förfrågan till de förvaltare ni valt.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/be-om-offert" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const FEATURE_KEYS = Object.fromEntries(CATEGORIES.map((c) => [c, FEATURES[c].map((f) => f.key)])) as Record<Category, string[]>;

const CRUMBS = [
  { href: "/", label: "Hitta förvaltare" },
  { href: "/be-om-offert", label: "Be om offert" },
];

// Valet ligger i adressen och formuläret ritas för den som kommer, så sidan renderas per anrop.
export default async function BeOmOffertPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const mode = currentMode();
  const g = parseGuide(sp, FEATURE_KEYS);
  const back = `/?${guideQuery(g)}#resultat`;

  if (mode === "off") {
    return (
      <>
        <PageHead
          title="Be om offert"
          lead="Förfrågningar är inte öppna ännu. Ni kan ändå se vilka förvaltare som passar och gå till deras egna sidor."
          crumbs={CRUMBS}
        />
        <div className="page-body">
          <div className="container">
            <div className="g-narrow">
              <div className="gsec-actions">
                <Link className="btn btn-dark" href={back}>
                  Tillbaka till förvaltarna
                  <span className="btn-icon">
                    <ArrowIcon size={12} />
                  </span>
                </Link>
                <Link className="btn btn-quiet" href="/byta-forvaltare">
                  Läs hur man byter förvaltare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Bara förvaltare som har den förvaltning som valts kan väljas. Ortsfiltret spelar ingen roll här.
  const outcome = matchGuide(getCompareData(), { need: g.need, ort: "" });
  const pick = parsePick(sp, outcome.results.map((r) => r.slug));
  const chosen = pick.slugs.map((slug) => outcome.results.find((r) => r.slug === slug)).filter((r) => r !== undefined);

  return (
    <>
      <PageHead
        title="Be om offert"
        lead="Fyll i uppgifterna så skickar vi förfrågan vidare till de förvaltare ni har valt. Den går inte till någon annan."
        crumbs={CRUMBS}
      />
      <div className="page-body">
        <div className="container">
          <div className="g-narrow">
            {chosen.length === 0 ? (
              <div className="panel rf-empty">
                <h2 className="h4">Ni har inte valt någon förvaltare</h2>
                <p className="muted">Gå tillbaka, kryssa i upp till {MAX_PICK === 3 ? "tre" : MAX_PICK} förvaltare och välj Be om offert.</p>
                <div className="gsec-actions">
                  <Link className="btn btn-dark" href={back}>
                    Tillbaka till förvaltarna
                    <span className="btn-icon">
                      <ArrowIcon size={12} />
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {mode === "preview" && (
                  <p className="g-preview small">Förhandsvisning: när ni skickar visas mejlet som skulle ha gått iväg. Ingenting skickas eller sparas.</p>
                )}
                <section className="panel rf-chosen" aria-labelledby="chosen-title">
                  <h2 className="h4" id="chosen-title">
                    Ni ber om offert från
                  </h2>
                  <ul className="rf-chosen-list">
                    {chosen.map((r) => (
                      <li key={r.slug}>
                        <Link className="link" href={`/forvaltare/${r.slug}`}>
                          {r.name}
                        </Link>
                        {r.region && <span className="fine"> {r.region}</span>}
                      </li>
                    ))}
                  </ul>
                  {pick.dropped > 0 && (
                    <p className="small muted">
                      {pick.dropped === 1 ? "En förvaltare" : `${pick.dropped} förvaltare`} togs inte med. Ni kan be om offert från högst {MAX_PICK === 3 ? "tre" : MAX_PICK}, och bara från förvaltare som har den förvaltning ni valt.
                    </p>
                  )}
                  <p className="small">
                    <Link className="link" href={back}>
                      Ändra urvalet
                    </Link>
                  </p>
                </section>

                <RequestForm
                  providers={chosen.map((r) => ({ slug: r.slug, name: r.name }))}
                  initial={{ ort: g.ort, lgh: String(g.lgh), behov: g.need }}
                  issuedAt={Date.now()}
                  mode={mode}
                  backHref={back}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
