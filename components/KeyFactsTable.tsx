"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { CompareNotes } from "./CompareNotes";
import { CoverageCell, PriceCell, SourceCell } from "./FactCells";
import { ProviderLogo } from "./ProviderLogo";
import { ScrollRegion } from "./ScrollRegion";
import { CATEGORY } from "@/lib/schema";

/** Nyckeluppgifter för varje förvaltare i vald kategori. Raderna är sorterade efter namn och aldrig efter någon bedömning. */
export function KeyFactsTable() {
  const { category, shown, ort, n } = useCompare();
  const label = CATEGORY[category].label.toLowerCase();

  return (
    <div className="kf-wrap">
      <ScrollRegion label={`Nyckeluppgifter för ${label}, rulla i sidled`} className="kf-scroll" hint>
        <table className="kf">
          <caption className="sr-only">
            Nyckeluppgifter för {label}: pris, uppsägningstid, paket och var förvaltaren verkar. Sorterad efter namn.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="kf-corner">
                Förvaltare
              </th>
              <th scope="col">Pris</th>
              <th scope="col">Uppsägningstid</th>
              <th scope="col">Paket och nivåer</th>
              <th scope="col">Verkar i</th>
              <th scope="col">Källa</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="kf-empty">
                  Ingen förvaltare nämner orten {ort.trim()} på sidorna vi läste.
                </td>
              </tr>
            )}
            {shown.map(({ row, match }) => (
              <tr key={row.slug}>
                <th scope="row" className="kf-name">
                  <Link className="kf-link logo-link" href={`/forvaltare/${row.slug}`}>
                    <ProviderLogo name={row.name} logo={row.logo} size="sm" />
                    {row.name}
                  </Link>
                  {row.region && <span className="kf-region">{row.region}</span>}
                </th>
                <td>
                  <PriceCell row={row} n={n} />
                </td>
                <td>{row.notice ? <span>{row.notice}</span> : <span className="kf-none">Ej funnet</span>}</td>
                <td>{row.levelNames.length > 0 ? <span>{row.levelNames.join(", ")}</span> : <span className="kf-none">Inga angivna</span>}</td>
                <td>
                  <CoverageCell row={row} match={match} ort={ort} />
                </td>
                <td>
                  <SourceCell row={row} n={n} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
      <CompareNotes />
    </div>
  );
}
