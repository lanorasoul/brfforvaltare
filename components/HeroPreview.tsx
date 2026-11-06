import Link from "next/link";
import { ArrowIcon } from "./icons";
import { ProviderLogo } from "./ProviderLogo";
import { num } from "@/lib/format";
import type { OverviewRow } from "@/lib/overview";
import { priceRow } from "@/lib/price";
import { priceLabel } from "@/lib/price-label";

/**
 * Ett utdrag ur jämförelsen i hjälten, ritat som en app-ruta. Raderna står i namnordning, precis som i listan,
 * så att ingen förvaltare lyfts fram. Allt är riktiga uppgifter ur datafilerna.
 */
export function HeroPreview({ rows, total, lgh = 50 }: { rows: OverviewRow[]; total: number; lgh?: number }) {
  return (
    <div className="hp ui-panel">
      <div className="hp-bar">
        <span className="mono-label">
          Jämförelse · {lgh} lgh<span className="hp-hide-sm"> · namnordning</span>
        </span>
        <span className="hp-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <div className="hp-table ui-tile" role="table" aria-label={`Utdrag ur jämförelsen för ${lgh} lägenheter`}>
        <div className="hp-row hp-head" role="row">
          <span role="columnheader">Förvaltare</span>
          <span role="columnheader">Pris per år</span>
          <span role="columnheader" className="hp-hide-xs">
            Kundnöjdhet
          </span>
          <span role="columnheader" className="hp-hide-sm">
            Kunder
          </span>
        </div>
        {rows.map((r) => {
          const price = r.pricing ? priceRow({ slug: r.slug, name: r.name, pricing: r.pricing }, lgh) : null;
          const review = r.ratings.filter((x) => x.kind !== "nki" && !x.ownClaim && (x.count ?? 0) >= 20).sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
          return (
            <div key={r.slug} className="hp-row" role="row">
              <span role="cell" className="hp-name">
                <ProviderLogo name={r.name} logo={r.logo} size="sm" />
                <span>{r.name}</span>
              </span>
              <span role="cell" className="hp-num">
                {price && price.perYear !== null ? priceLabel(price, price.perYear, "year") : <span className="hp-muted">Offert</span>}
              </span>
              <span role="cell" className="hp-hide-xs">
                {r.nki ? (
                  <span className="hp-chip hp-chip-nki">NKI {r.nki.value}</span>
                ) : review ? (
                  <span className="hp-chip">{review.value.toLocaleString("sv-SE")} av 5</span>
                ) : (
                  <span className="hp-muted">Inte mätt</span>
                )}
              </span>
              <span role="cell" className="hp-num hp-hide-sm">
                {r.clients ? num(r.clients.value) : <span className="hp-muted">Anges inte</span>}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hp-foot">
        <span className="mono-label">
          Visar {rows.length} av {total}
        </span>
        <Link className="hp-link" href="#forvaltare">
          Se alla förvaltare <ArrowIcon size={12} />
        </Link>
      </div>
    </div>
  );
}
