import Link from "next/link";
import { FeatureMark, FEATURE_LABEL } from "./icons";
import { ScrollRegion } from "./ScrollRegion";
import type { CompareRow } from "@/lib/compare";
import type { GuideResult } from "@/lib/guide";
import { CATEGORIES, FEATURES, FEATURE_STATE_ORDER } from "@/lib/schema";
import type { Category, FeatureState } from "@/lib/types";

/** Tjänsterna styrelsen bad om, för de förvaltare som visas. Samma märken som tjänstematrisen. Ingen förvaltare döljs eller får poäng. */
export function WishMatrix({ results, wishes }: { results: GuideResult<CompareRow>[]; wishes: string[] }) {
  const cols = wishes.flatMap((key) => {
    for (const category of CATEGORIES) {
      const f = FEATURES[category].find((x) => x.key === key);
      if (f) return [{ ...f, category }];
    }
    return [];
  });

  const state = (r: GuideResult<CompareRow>, category: Category, key: string): FeatureState | "none" => r.rows[category]?.features[key] ?? "none";

  return (
    <div className="fm-wrap">
      <ScrollRegion label="Tjänster ni bad om, rulla i sidled" className="fm-scroll fm-scroll-fit" hint>
        <table className="fm fm-fit">
          <caption className="sr-only">
            Vilka av tjänsterna ni bad om som varje förvaltare listar. Läget är ingår, ingår i vissa nivåer, tillval, nämns eller inte listad.
          </caption>
          <thead>
            <tr>
              <th scope="col" className="fm-corner">
                Förvaltare
              </th>
              {cols.map((f) => (
                <th key={f.key} scope="col" className="fm-col" title={f.help}>
                  <span className="fm-col-text">{f.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.slug}>
                <th scope="row" className="fm-row">
                  <Link href={`/forvaltare/${r.slug}`}>{r.name}</Link>
                </th>
                {cols.map((f) => {
                  const s = state(r, f.category, f.key);
                  return (
                    <td key={f.key} className={`fm-cell fm-${s}`}>
                      <FeatureMark state={s} />
                      <span className="sr-only">{FEATURE_LABEL[s]}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {results.length > 0 && (
            <tfoot>
              <tr>
                <th scope="row" className="fm-row">
                  Nämns av
                </th>
                {cols.map((f) => (
                  <td key={f.key} className="fm-total num">
                    {results.filter((r) => state(r, f.category, f.key) !== "none").length} av {results.length}
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
    </div>
  );
}
