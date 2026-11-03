import { ExternalIcon, StatusMark } from "./icons";
import type { CompareRow } from "@/lib/compare";
import type { PlaceMatch } from "@/lib/coverage";
import { dateShort } from "@/lib/format";
import { priceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";

// Cellerna i tabellerna med nyckeluppgifter. De används av startsidans jämförelse (klient) och av guiden och ortssidorna (server).

export function PriceCell({ row, n }: { row: CompareRow; n: number }) {
  const r = priceRow({ slug: row.slug, name: row.name, pricing: row.pricing }, n);
  if (r.perYear !== null) {
    return (
      <>
        <span className="kf-price">
          <StatusMark status={r.status ?? "none"} />
          <strong>{priceLabel(r, r.perYear, "year")}</strong>
        </span>
        <span className="kf-sub">
          {r.basis}, {VAT_TEXT[r.vat]}, per år, {n} lägenheter
        </span>
      </>
    );
  }
  const extra = row.pricedExtras[0];
  return (
    <>
      <span className="kf-price">
        <StatusMark status="none" />
        <span className="kf-none">{row.pricing.model === "on_request" ? "Pris på förfrågan" : `Inget pris för ${n} lägenheter`}</span>
      </span>
      {extra && (
        <span className="kf-sub">
          Tillägg med pris: {extra.label}, {extra.price}
          {row.pricedExtras.length > 1 ? ` och ${row.pricedExtras.length - 1} till` : ""}
        </span>
      )}
    </>
  );
}

/** Priset på ett tillägg kan stå på en annan sida än huvudsidan. Då länkar vi den sidan också. */
export function ExtraSource({ row, n }: { row: CompareRow; n: number }) {
  if (priceRow({ slug: row.slug, name: row.name, pricing: row.pricing }, n).perYear !== null) return null;
  const extra = row.pricedExtras[0];
  if (!extra || extra.source.url === row.source.url) return null;
  return (
    <a className="kf-src kf-src-extra" href={extra.source.url} target="_blank" rel="noopener noreferrer">
      Tillägget, läst {dateShort(extra.source.checked)}
      <ExternalIcon />
      <span className="sr-only"> ({row.name}, öppnas i ny flik)</span>
    </a>
  );
}

/** Länken till sidan uppgifterna kommer från, med läsdatum, och tilläggets sida när den är en annan. */
export function SourceCell({ row, n }: { row: CompareRow; n: number }) {
  return (
    <>
      <a className="kf-src" href={row.source.url} target="_blank" rel="noopener noreferrer">
        Läst {dateShort(row.source.checked)}
        <ExternalIcon />
        <span className="sr-only"> ({row.name}, öppnas i ny flik)</span>
      </a>
      <ExtraSource row={row} n={n} />
    </>
  );
}

export const SCOPE_LABEL = { national: "Hela landet", regional: "Regionalt", unknown: "Anges inte tydligt" } as const;

export function CoverageCell({ row, match, ort }: { row: CompareRow; match: PlaceMatch | null; ort: string }) {
  const c = row.coverage;
  const shownPlaces = c.places.slice(0, 3).join(", ");
  const rest = c.places.length - 3;
  return (
    <>
      <span className="kf-scope">{SCOPE_LABEL[c.scope]}</span>
      {c.scope !== "national" && c.places.length > 0 && (
        <span className="kf-sub">
          Nämner {shownPlaces}
          {rest > 0 ? ` och ${rest} till` : ""}
        </span>
      )}
      {match === "listed" && <span className="kf-match kf-match-yes">Nämner {ort.trim()}</span>}
      {match === "national" && <span className="kf-match kf-match-yes">Hela landet</span>}
      {match === "unknown" && <span className="kf-match kf-match-maybe">Orter anges inte, fråga dem</span>}
    </>
  );
}
