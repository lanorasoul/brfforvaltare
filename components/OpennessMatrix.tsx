"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { PresenceMark, PRESENCE_LABEL } from "./icons";
import { ScrollRegion } from "./ScrollRegion";
import { matrixStats } from "@/lib/matrix";
import { CATEGORY, DISCLOSURE_KEYS } from "@/lib/schema";

/** Vad förvaltarna berättar öppet på sina egna sidor. Samma ort och kategori som i tabellerna ovanför. */
export function OpennessMatrix() {
  const { category, shown, ort } = useCompare();
  const keys = DISCLOSURE_KEYS[category];
  const label = CATEGORY[category].label.toLowerCase();
  const stats = matrixStats(shown.map((s) => s.row), category);

  return (
    <div className="matrix-wrap">
      <ScrollRegion label={`Öppenhetsmatris för ${label}, rulla i sidled`} className="matrix-scroll" hint>
        <table className="matrix">
          <caption className="sr-only">
            Vilka uppgifter varje förvaltare publicerar på sin egen webbplats om {label}. Publicerat, delvis eller ej funnet.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="matrix-corner">
                Förvaltare
              </th>
              {keys.map((k) => (
                <th key={k.key} scope="col" className="matrix-col" title={k.help}>
                  {k.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={keys.length + 1} className="matrix-empty">
                  Ingen förvaltare nämner orten {ort.trim()} på sidorna vi läste.
                </td>
              </tr>
            )}
            {shown.map(({ row }) => (
              <tr key={row.slug}>
                <th scope="row" className="matrix-row">
                  <Link href={`/forvaltare/${row.slug}`}>{row.name}</Link>
                </th>
                {keys.map((k) => {
                  const v = row.disclosure[k.key];
                  return (
                    <td key={k.key} className={`matrix-cell matrix-${v}`}>
                      <PresenceMark presence={v} />
                      <span className="sr-only">{PRESENCE_LABEL[v]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {shown.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" className="matrix-row">
                  Tydligt publicerat
                </th>
                {keys.map((k) => (
                  <td key={k.key} className="matrix-total num">
                    {stats.byKey[k.key].published} av {stats.providers}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </ScrollRegion>

      <ul className="matrix-key" aria-label="Teckenförklaring">
        <li>
          <PresenceMark presence="published" size={18} /> Publicerat: sidan säger det tydligt
        </li>
        <li>
          <PresenceMark presence="partial" size={18} /> Delvis: indirekt eller bara för en del
        </li>
        <li>
          <PresenceMark presence="notfound" size={18} /> Ej funnet: står inte på sidorna vi läste
        </li>
      </ul>
    </div>
  );
}
