import { ProviderLogo } from "./ProviderLogo";
import Link from "next/link";
import { CoverageCell, PriceCell, SourceCell } from "./FactCells";
import { ScrollRegion } from "./ScrollRegion";
import type { CompareRow } from "@/lib/compare";
import type { GuideResult } from "@/lib/guide";
import { CATEGORY } from "@/lib/schema";
import type { Category } from "@/lib/types";

interface Props {
  results: GuideResult<CompareRow>[];
  categories: Category[];
  /** Antal lägenheter som priset räknas för. */
  n: number;
  /** Orten som valts, för märkena i kolumnen Verkar i. Tom när ingen ort är vald. */
  ort: string;
  /** Visar en ruta före varje namn som styrelsen kan kryssa i för att be om offert. Tabellen måste ligga i ett formulär. */
  selectable?: boolean;
  /** Text för skärmläsare om vad tabellen visar. */
  caption: string;
  emptyText: string;
}

/**
 * Nyckeluppgifter för de förvaltare som guiden eller en ortssida visar. Samma kolumner som jämförelsen på startsidan,
 * men ritad på servern. Raderna kommer redan i namnordning och sorteras aldrig om här.
 * När flera delar efterfrågas står varje del för sig i cellen, med namnet på delen.
 */
export function ResultsTable({ results, categories, n, ort, selectable = false, caption, emptyText }: Props) {
  const multi = categories.length > 1;

  const part = (c: Category, content: React.ReactNode) =>
    multi ? (
      <div key={c} className="rt-part">
        <span className="rt-part-label">{CATEGORY[c].short}</span>
        {content}
      </div>
    ) : (
      <div key={c}>{content}</div>
    );

  return (
    <div className="kf-wrap">
      <ScrollRegion label={`${caption}, rulla i sidled`} className="kf-scroll" hint>
        <table className="kf">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="kf-corner">
                Förvaltare
                {selectable && <span className="sr-only">. Kryssa i rutan före namnet för att be om offert.</span>}
              </th>
              <th scope="col">Pris</th>
              <th scope="col">Uppsägningstid</th>
              <th scope="col">Paket och nivåer</th>
              <th scope="col">Verkar i</th>
              <th scope="col">Källa</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 && (
              <tr>
                <td colSpan={6} className="kf-empty">
                  {emptyText}
                </td>
              </tr>
            )}
            {results.map((r) => (
              <tr key={r.slug} className="rt-row">
                <th scope="row" className="kf-name">
                  <div className="rt-namecell">
                    {selectable && <input className="cbox rt-box" type="checkbox" name="f" value={r.slug} aria-label={`Be ${r.name} om offert`} />}
                    <div>
                      <Link className="kf-link logo-link" href={`/forvaltare/${r.slug}`}>
                        <ProviderLogo name={r.name} logo={(r.rows.ekonomisk ?? r.rows.teknisk)?.logo ?? null} size="sm" />
                        {r.name}
                      </Link>
                      {r.region && <span className="kf-region">{r.region}</span>}
                    </div>
                  </div>
                </th>
                <td>
                  {categories.map((c) => {
                    const row = r.rows[c];
                    return row ? part(c, <PriceCell row={row} n={n} />) : null;
                  })}
                </td>
                <td>
                  {categories.map((c) => {
                    const row = r.rows[c];
                    return row ? part(c, row.notice ? <span>{row.notice}</span> : <span className="kf-none">Ej funnet</span>) : null;
                  })}
                </td>
                <td>
                  {categories.map((c) => {
                    const row = r.rows[c];
                    return row ? part(c, row.levelNames.length > 0 ? <span>{row.levelNames.join(", ")}</span> : <span className="kf-none">Inga angivna</span>) : null;
                  })}
                </td>
                <td>
                  {categories.map((c) => {
                    const row = r.rows[c];
                    return row ? part(c, <CoverageCell row={row} match={r.matches[c] ?? null} ort={ort} />) : null;
                  })}
                </td>
                <td>
                  {categories.map((c) => {
                    const row = r.rows[c];
                    return row ? part(c, <SourceCell row={row} n={n} />) : null;
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </div>
  );
}
