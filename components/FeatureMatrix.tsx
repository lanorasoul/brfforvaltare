"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { FeatureMark, FEATURE_LABEL } from "./icons";
import { ScrollRegion } from "./ScrollRegion";
import { featureTally, mentioned } from "@/lib/matrix";
import { CATEGORY, FEATURES, FEATURE_STATE_ORDER } from "@/lib/schema";

/** Vilka tjänster förvaltarna listar, och om de ingår, ingår i vissa nivåer, är tillval eller bara nämns. */
export function FeatureMatrix() {
  const { category, shown, ort } = useCompare();
  const features = FEATURES[category];
  const label = CATEGORY[category].label.toLowerCase();
  const tally = featureTally(shown.map((s) => s.row), category);

  return (
    <div className="fm-wrap">
      <ScrollRegion label={`Tjänstematris för ${label}, rulla i sidled`} className="fm-scroll" hint>
        <table className="fm">
          <caption className="sr-only">
            Vilka tjänster varje förvaltare listar inom {label}. Läget är ingår, ingår i vissa nivåer, tillval, nämns eller inte listad.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="fm-corner">
                Förvaltare
              </th>
              {features.map((f) => (
                <th key={f.key} scope="col" className="fm-col" title={f.help}>
                  <span className="fm-col-text">{f.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={features.length + 1} className="kf-empty">
                  Ingen förvaltare nämner orten {ort.trim()} på sidorna vi läste.
                </td>
              </tr>
            )}
            {shown.map(({ row }) => (
              <tr key={row.slug}>
                <th scope="row" className="fm-row">
                  <Link href={`/forvaltare/${row.slug}`}>{row.name}</Link>
                </th>
                {features.map((f) => {
                  const state = row.features[f.key] ?? "none";
                  return (
                    <td key={f.key} className={`fm-cell fm-${state}`}>
                      <FeatureMark state={state} />
                      <span className="sr-only">{FEATURE_LABEL[state]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {shown.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" className="fm-row">
                  Nämns av
                </th>
                {features.map((f) => (
                  <td key={f.key} className="fm-total num">
                    {mentioned(tally[f.key])} av {shown.length}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </ScrollRegion>

      <ul className="fm-key" aria-label="Teckenförklaring">
        {[...FEATURE_STATE_ORDER, "none" as const].map((s) => (
          <li key={s}>
            <FeatureMark state={s} size={18} /> <span>{FEATURE_LABEL[s]}</span>
          </li>
        ))}
      </ul>
      <p className="fine fm-help">
        Matrisen följer förvaltarens egen text. Ingår betyder att sidan säger det. Nämns betyder att sidan listar tjänsten utan att säga om den ingår eller kostar extra. Inte listad betyder att den inte står på sidorna vi läste,
        inte att förvaltaren saknar den.
      </p>
    </div>
  );
}
