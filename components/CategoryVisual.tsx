"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCompare } from "./CompareProvider";
import { ArrowIcon, CheckIcon, StatusMark } from "./icons";
import { ProviderLogo } from "./ProviderLogo";
import type { CompareRow } from "@/lib/compare";
import { num } from "@/lib/format";
import { priceRow, type PriceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { DISCLOSURE_KEYS, FEATURES } from "@/lib/schema";

// Den visuella delen av kategorisidorna: nyckeltal, prisdiagram och ett kort per förvaltare.
// Allt räknas ur samma data som tabellerna, som finns kvar längre ned för den som vill se varje uppgift.

const priceOf = (r: CompareRow, n: number): PriceRow => priceRow({ slug: r.slug, name: r.name, pricing: r.pricing }, n);

/** Antal tjänster som förvaltaren listar, och hur många av dem som uttryckligen ingår. */
function featureCount(r: CompareRow) {
  const keys = FEATURES[r.category];
  const listed = keys.filter((f) => r.features[f.key] !== undefined).length;
  const included = keys.filter((f) => r.features[f.key] === "included").length;
  return { listed, included, total: keys.length };
}

function openCount(r: CompareRow) {
  const keys = DISCLOSURE_KEYS[r.category];
  return { published: keys.filter((k) => r.disclosure[k.key] === "published").length, total: keys.length };
}

/** Fyra siffror överst som sammanfattar läget för vald ort och storlek. */
export function CategoryStats() {
  const { shown, n, category } = useCompare();
  const rows = shown.map((s) => s.row);
  const prices = rows.map((r) => priceOf(r, n).perYear).filter((v): v is number => v !== null);
  const notice = rows.filter((r) => r.notice).length;
  const nki = rows.filter((r) => r.nki).length;
  const low = prices.length > 0 ? Math.min(...prices) : null;
  const high = prices.length > 1 ? Math.max(...prices) : null;

  const tiles = [
    { k: "Förvaltare", v: String(rows.length), sub: "i jämförelsen" },
    { k: "Anger pris", v: `${prices.length} av ${rows.length}`, sub: "resten lämnar offert" },
    category === "ekonomisk"
      ? { k: `Lägsta publicerade pris, ${n} lgh`, v: low === null ? "Inget" : `${num(low)} kr`, sub: high === null ? "per år" : `per år, högsta ${num(high)} kr` }
      : { k: "Har kundnöjdhet (NKI)", v: `${nki} av ${rows.length}`, sub: "mätt av Prognoscentret" },
    { k: "Anger uppsägningstid", v: `${notice} av ${rows.length}`, sub: "på sina egna sidor" },
  ];

  return (
    <dl className="cv-stats">
      {tiles.map((t) => (
        <div key={t.k} className="cv-stat">
          <dt>{t.k}</dt>
          <dd>
            <strong>{t.v}</strong>
            <span>{t.sub}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Liggande staplar för de förvaltare som anger ett pris, billigast först. Övriga står under som namn. */
export function PriceChart() {
  const { shown, n, category } = useCompare();
  const rows = shown.map((s) => ({ r: s.row, p: priceOf(s.row, n) }));
  const priced = rows.filter((x) => x.p.perYear !== null).sort((a, b) => (a.p.perYear ?? 0) - (b.p.perYear ?? 0));
  const offer = rows.filter((x) => x.p.perYear === null);
  const max = Math.max(1, ...priced.map((x) => x.p.perYear ?? 0));

  if (priced.length === 0) {
    return (
      <div className="cv-chart cv-chart-empty">
        <p className="cv-chart-title">Pris</p>
        <p>
          Ingen av förvaltarna anger ett pris för {category === "teknisk" ? "teknisk förvaltning" : `${n} lägenheter`} på sin webbplats. Priset beror på fastigheten, så be om offert på samma underlag
          från flera.
        </p>
      </div>
    );
  }

  return (
    <figure className="cv-chart">
      <figcaption className="cv-chart-title">
        Pris per år för {n} lägenheter <span>enligt förvaltarnas egna uppgifter</span>
      </figcaption>
      <ol className="cv-bars">
        {priced.map(({ r, p }) => (
          <li key={r.slug} className="cv-bar-row">
            <Link className="cv-bar-name" href={`/forvaltare/${r.slug}`}>
              {r.name}
            </Link>
            <span className="cv-bar-track" aria-hidden="true">
              <span className="cv-bar-fill" style={{ width: `${((p.perYear ?? 0) / max) * 100}%` }} />
            </span>
            <span className="cv-bar-value">
              <StatusMark status={p.status ?? "none"} />
              {priceLabel(p, p.perYear ?? 0, "year")}
            </span>
            <span className="cv-bar-note">
              {p.basis}, {VAT_TEXT[p.vat]}
            </span>
          </li>
        ))}
      </ol>
      {offer.length > 0 && (
        <p className="cv-offer">
          <span className="cv-offer-k">Pris på offert</span> {offer.map((x) => x.r.name).join(", ")}
        </p>
      )}
    </figure>
  );
}

/** En mätare med etikett, siffra och stapel. */
function Meter({ label, value, total, strong, hint }: { label: string; value: number; total: number; strong?: number; hint: string }) {
  return (
    <div className="pc-meter" title={hint}>
      <div className="pc-meter-top">
        <span>{label}</span>
        <strong>
          {value} av {total}
        </strong>
      </div>
      <span className="pc-meter-track" aria-hidden="true">
        {strong !== undefined && <span className="pc-meter-strong" style={{ width: `${(strong / total) * 100}%` }} />}
        <span className="pc-meter-fill" style={{ width: `${((value - (strong ?? 0)) / total) * 100}%` }} />
      </span>
      <span className="sr-only">{hint}</span>
    </div>
  );
}

type Sort = "name" | "price" | "nki" | "open";
const SORTS: { key: Sort; label: string }[] = [
  { key: "name", label: "Namn" },
  { key: "price", label: "Pris" },
  { key: "nki", label: "Kundnöjdhet" },
  { key: "open", label: "Öppenhet" },
];

/** Ett kort per förvaltare med det viktigaste: pris, kundnöjdhet, tjänster och hur mycket de berättar. */
export function ProviderCards() {
  const { shown, n, ort } = useCompare();
  const [sort, setSort] = useState<Sort>("name");

  const list = useMemo(() => {
    const rows = shown.map((s) => ({ ...s, price: priceOf(s.row, n) }));
    const last = (v: number | null) => (v === null ? Number.POSITIVE_INFINITY : v);
    if (sort === "price") return [...rows].sort((a, b) => last(a.price.perYear) - last(b.price.perYear));
    if (sort === "nki") return [...rows].sort((a, b) => (b.row.nki?.value ?? -1) - (a.row.nki?.value ?? -1));
    if (sort === "open") return [...rows].sort((a, b) => openCount(b.row).published - openCount(a.row).published);
    return rows;
  }, [shown, n, sort]);

  if (shown.length === 0) return <p className="cv-empty">Ingen förvaltare nämner orten {ort.trim()} på sidorna vi läste.</p>;

  return (
    <>
      <div className="pc-sort" role="group" aria-label="Sortera förvaltarna">
        <span className="pc-sort-k">Sortera</span>
        <div className="seg">
          {SORTS.filter((s) => s.key !== "price" || list.some((x) => x.price.perYear !== null)).map((s) => (
            <button key={s.key} type="button" className="seg-btn" aria-pressed={sort === s.key} onClick={() => setSort(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <ul className="pc-grid">
        {list.map(({ row: r, price: p }) => {
          const f = featureCount(r);
          const o = openCount(r);
          return (
            <li key={r.slug} className="pc">
              <div className="pc-head">
                <Link className="pc-id logo-link" href={`/forvaltare/${r.slug}`}>
                  <ProviderLogo name={r.name} logo={r.logo} size="sm" />
                  <span className="pc-name">{r.name}</span>
                </Link>
                {r.region && <span className="pc-pill">{r.region}</span>}
              </div>

              <div className="pc-price">
                {p.perYear !== null ? (
                  <>
                    <strong>{priceLabel(p, p.perYear, "year")}</strong>
                    <span>
                      per år, {n} lgh. {p.basis}
                    </span>
                  </>
                ) : (
                  <>
                    <strong className="pc-muted">Pris på offert</strong>
                    <span>{r.pricedExtras[0] ? `Tillägg med pris: ${r.pricedExtras[0].label}` : "Inget pris på sidan"}</span>
                  </>
                )}
              </div>

              <div className="pc-nki">
                <span className="pc-nki-k">Kundnöjdhet</span>
                {r.nki ? (
                  <a className="pc-nki-v" href={r.nki.url} target="_blank" rel="noopener noreferrer">
                    NKI {r.nki.value}
                    {r.nki.average !== null && (
                      <span className={r.nki.value >= r.nki.average ? "pc-up" : "pc-down"}>
                        {r.nki.value >= r.nki.average ? "över" : "under"} snittet {r.nki.average}
                      </span>
                    )}
                  </a>
                ) : (
                  <span className="pc-muted">Inte mätt</span>
                )}
              </div>

              <Meter
                label="Tjänster listade"
                value={f.listed}
                strong={f.included}
                total={f.total}
                hint={`${f.listed} av ${f.total} tjänster står på förvaltarens sida, ${f.included} av dem som ingår.`}
              />
              <Meter label="Berättar öppet" value={o.published} total={o.total} hint={`${o.published} av ${o.total} uppgifter står tydligt på förvaltarens sida.`} />

              <ul className="pc-chips">
                <li data-on={r.notice ? "yes" : "no"}>
                  {r.notice ? <CheckIcon size={11} /> : null}Uppsägningstid {r.notice ? "angiven" : "anges inte"}
                </li>
                <li data-on="yes">{r.coverage.scope === "national" ? "Hela landet" : r.coverage.scope === "regional" ? "Regionalt" : "Område anges inte"}</li>
                {r.levelNames.length > 0 && <li data-on="yes">{r.levelNames.length} paket</li>}
              </ul>

              <Link className="pc-go" href={`/forvaltare/${r.slug}`}>
                Se profil <ArrowIcon size={12} />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
