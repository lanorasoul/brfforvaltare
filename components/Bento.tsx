import Link from "next/link";
import { ArrowIcon, PresenceMark, StatusMark } from "./icons";
import { PriceCurve } from "./PriceCurve";
import type { CompareRow } from "@/lib/compare";
import { dateLong } from "@/lib/format";
import { priceLabel } from "@/lib/price-label";
import type { PriceRow } from "@/lib/price";
import { DISCLOSURE_KEYS } from "@/lib/schema";

interface Props {
  /** Raderna för ekonomisk förvaltning. Teknisk förvaltning har inga priser att räkna på. */
  providers: CompareRow[];
  /** Prisrader för 50 lägenheter, redan sorterade. */
  rows50: PriceRow[];
  checkedAt: string;
}

function TileLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="bento-link" href={href}>
      {children}
      <span className="bento-arrow">
        <ArrowIcon size={12} />
      </span>
    </Link>
  );
}

/** Verktygen, var och en med en liten bild ritad ur verkliga data. */
export function Bento({ providers, rows50, checkedAt }: Props) {
  const priced = rows50.filter((r) => r.perYear !== null).slice(0, 3);
  const maxBar = Math.max(1, ...priced.map((r) => r.perYear as number));
  const matrixRows = providers.slice(0, 7);

  // Jämförelsen: de två första förvaltarna med pris, med verkliga uppgifter.
  const cmp = priced.slice(0, 2).map((r) => ({ row: r, p: providers.find((p) => p.slug === r.slug) as CompareRow }));

  return (
    <section className="bento-section section" id="verktyg" aria-labelledby="bento-title">
      <div className="container">
        <div className="section-head center">
          <h2 className="h2" id="bento-title">
            Verktyg för styrelsen
          </h2>
          <p className="lead">Allt bygger på samma öppna data. Ingen siffra utan källa.</p>
        </div>

        <div className="bento">
          <article className="bento-tile bento-a panel">
            <div className="bento-text">
              <h3 className="h4">Se vad förvaltning kostar för just er storlek</h3>
              <p className="muted small">Dra i reglaget från 5 till 100 lägenheter. Förvaltare som inte anger pris visas som tomma rader.</p>
              <TileLink href="/#rakna">Räkna på er förening</TileLink>
            </div>
            <div className="mini-bars">
              <div className="mini-slider-row" aria-hidden="true">
                <span>Antal lägenheter</span>
                <span className="mini-slider">
                  <span className="mini-slider-fill" style={{ width: "47%" }} />
                  <span className="mini-slider-thumb" style={{ left: "47%" }} />
                </span>
                <span className="num">50</span>
              </div>
              <ul aria-label="Exempel: pris för 50 lägenheter">
                {priced.map((r) => (
                  <li key={r.slug} className="mini-bar">
                    <span className="mini-bar-name">{r.name}</span>
                    <span className="mini-bar-track">
                      <span className="mini-bar-fill" style={{ width: `${((r.perYear as number) / maxBar) * 100}%` }} />
                    </span>
                    <span className="mini-bar-val">{priceLabel(r, r.perYear as number, "year")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article className="bento-tile bento-b panel">
            <div className="bento-text">
              <h3 className="h4">Se vad förvaltarna berättar öppet</h3>
              <p className="muted small">Pris, uppsägningstid, vad som ingår, tillval, kundportal och antal kunder, för ekonomisk och teknisk förvaltning.</p>
              <TileLink href="/#oppenhet">Öppna matrisen</TileLink>
            </div>
            <div className="mini-matrix" aria-hidden="true">
              {matrixRows.map((p) => (
                <div key={p.slug} className="mini-matrix-row">
                  {DISCLOSURE_KEYS.ekonomisk.map((k) => (
                    <span key={k.key} className="mini-mark">
                      <PresenceMark presence={p.disclosure[k.key]} size={14} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </article>

          <article className="bento-tile bento-c panel">
            <div className="bento-text">
              <h3 className="h4">Jämför två eller tre sida vid sida</h3>
              <TileLink href="/jamfor">Jämför förvaltare</TileLink>
            </div>
            {cmp.length === 2 && (
              <div className="mini-cmp" aria-hidden="true">
                <div className="mini-cmp-head">
                  <span />
                  <span>{cmp[0].p.name}</span>
                  <span>{cmp[1].p.name}</span>
                </div>
                <div className="mini-cmp-row">
                  <span>Pris, 50 lgh</span>
                  <span>{priceLabel(cmp[0].row, cmp[0].row.perYear as number, "year")}</span>
                  <span>{priceLabel(cmp[1].row, cmp[1].row.perYear as number, "year")}</span>
                </div>
                <div className="mini-cmp-row">
                  <span>Uppsägning</span>
                  <span>{cmp[0].p.notice ? "Anges" : "Ej funnet"}</span>
                  <span>{cmp[1].p.notice ? "Anges" : "Ej funnet"}</span>
                </div>
                <div className="mini-cmp-row">
                  <span>Ingår</span>
                  <span>{cmp[0].p.counts.included} punkter</span>
                  <span>{cmp[1].p.counts.included} punkter</span>
                </div>
              </div>
            )}
          </article>

          <article className="bento-tile bento-d panel">
            <div className="bento-text">
              <h3 className="h4">Så växer priset med storleken</h3>
              <TileLink href="/prisguide">Öppna prisguiden</TileLink>
            </div>
            <div className="mini-curve">
              <PriceCurve providers={providers.map((r) => ({ slug: r.slug, name: r.name, pricing: r.pricing }))} size="mini" />
            </div>
          </article>

          <article className="bento-tile bento-e panel">
            <div className="bento-text">
              <h3 className="h4">Räkna ut sista dagen att säga upp</h3>
              <TileLink href="/byta-forvaltare#kalender">Öppna kalendern</TileLink>
            </div>
            <div className="mini-cal" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => {
                const cls = i < 8 ? "nd nd-open" : i === 8 ? "nd nd-deadline" : i < 11 ? "nd nd-notice" : "nd nd-end";
                return <span key={i} className={cls} />;
              })}
            </div>
          </article>

          <article className="bento-tile bento-f panel">
            <div className="bento-text">
              <h3 className="h4">Varje siffra har källa och datum</h3>
              <p className="muted small">
                Verifierat betyder att uppgiften står på förvaltarens egen sida. Uppskattning och antagande märks särskilt, så att ni ser vad som är vårt och vad som är förvaltarens.
              </p>
              <TileLink href="/metod">Så räknar vi</TileLink>
            </div>
            {priced[0] && (
              <div className="source-card" aria-hidden="true">
                <p className="source-card-top">
                  <StatusMark status={priced[0].status ?? "verified"} /> {priced[0].name}
                  <strong>{priceLabel(priced[0], priced[0].perYear as number, "year")} per år</strong>
                </p>
                <dl className="source-card-list">
                  <div>
                    <dt>Underlag</dt>
                    <dd>
                      {priced[0].basis} för 50 lägenheter
                    </dd>
                  </div>
                  <div>
                    <dt>Läst</dt>
                    <dd>{dateLong(checkedAt)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{priced[0].status === "verified" ? "Verifierat på förvaltarens sida" : "Beräknat av oss"}</dd>
                  </div>
                </dl>
              </div>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
