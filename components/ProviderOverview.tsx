"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowIcon, ExternalIcon, MinusIcon, PlusIcon } from "./icons";
import { ProviderLogo } from "./ProviderLogo";
import { num } from "@/lib/format";
import { sortRows, type OverviewRating, type OverviewRow, type SortKey } from "@/lib/overview";
import { priceRow, type PriceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";

interface Props {
  rows: OverviewRow[];
}

const MIN = 3;
const MAX = 500;
const QUICK = [20, 50, 100];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Namn" },
  { key: "price", label: "Pris" },
  { key: "nki", label: "Kundnöjdhet" },
];

const BASIS: Record<PriceRow["kind"], string> = {
  list: "Förvaltarens prislista",
  estimate: "Förvaltarens prisexempel",
  assumption: "Förvaltarens tumregel",
  from: "Förvaltarens lägsta pris",
  none: "",
};

type Filter = "alla" | "ekonomisk" | "teknisk";

export function ProviderOverview({ rows }: Props) {
  const uid = useId();
  const [n, setN] = useState(50);
  const [draft, setDraft] = useState("50");
  const [sort, setSort] = useState<SortKey>("name");
  const [filter, setFilter] = useState<Filter>("alla");

  const prices = useMemo(() => {
    const m = new Map<string, PriceRow | null>();
    for (const r of rows) m.set(r.slug, r.pricing ? priceRow({ slug: r.slug, name: r.name, pricing: r.pricing }, n) : null);
    return m;
  }, [rows, n]);

  const shown = useMemo(() => {
    const list = rows.filter((r) => filter === "alla" || r[filter]);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name, "sv"));
    if (sort === "price") return sortRows(list, (r) => prices.get(r.slug)?.perYear ?? null, "asc");
    return sortRows(list, (r) => r.nki?.value ?? null, "desc");
  }, [rows, filter, sort, prices]);

  const commit = (v: number) => {
    const c = Math.min(MAX, Math.max(MIN, Math.round(v)));
    setN(c);
    setDraft(String(c));
  };

  const priced = rows.filter((r) => (prices.get(r.slug)?.perYear ?? null) !== null).length;

  return (
    <div className="ov">
      <div className="ov-controls" role="group" aria-label="Anpassa jämförelsen">
        <div className="ov-control">
          <label className="ov-label" htmlFor={`${uid}-n`}>
            Antal lägenheter i er förening
          </label>
          <div className="ov-n">
            <button type="button" className="ov-step" aria-label="Färre lägenheter" onClick={() => commit(n - 5)}>
              <MinusIcon />
            </button>
            <input
              id={`${uid}-n`}
              className="ov-input"
              inputMode="numeric"
              value={draft}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                setDraft(v);
                const x = Number(v);
                if (x >= MIN && x <= MAX) setN(x);
              }}
              onBlur={() => commit(Number(draft) || n)}
            />
            <button type="button" className="ov-step" aria-label="Fler lägenheter" onClick={() => commit(n + 5)}>
              <PlusIcon />
            </button>
            <div className="ov-quick">
              {QUICK.map((q) => (
                <button key={q} type="button" className="ov-chip" aria-pressed={n === q} onClick={() => commit(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="ov-control">
          <span className="ov-label" id={`${uid}-f`}>
            Förvaltning
          </span>
          <div className="seg" role="group" aria-labelledby={`${uid}-f`}>
            {(["alla", "ekonomisk", "teknisk"] as Filter[]).map((f) => (
              <button key={f} type="button" className="seg-btn" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {f === "alla" ? "Alla" : f === "ekonomisk" ? "Ekonomisk" : "Teknisk"}
              </button>
            ))}
          </div>
        </div>
        <div className="ov-control">
          <span className="ov-label" id={`${uid}-s`}>
            Sortera efter
          </span>
          <div className="seg" role="group" aria-labelledby={`${uid}-s`}>
            {SORTS.map((s) => (
              <button key={s.key} type="button" className="seg-btn" aria-pressed={sort === s.key} onClick={() => setSort(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="ov-status small muted" aria-live="polite">
        {shown.length} förvaltare. {priced} publicerar ett pris för {n} lägenheter, övriga lämnar pris på offert.
        {sort !== "name" && " De som saknar uppgiften ligger sist."}
      </p>

      <ol className="ov-list">
        {shown.map((r) => (
          <li key={r.slug}>
            <Card r={r} n={n} price={prices.get(r.slug) ?? null} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function Card({ r, n, price }: { r: OverviewRow; n: number; price: PriceRow | null }) {
  const bestReview = r.ratings.filter((x) => x.kind !== "nki").filter((x) => !x.ownClaim && (x.count ?? 0) >= 20).sort((a, b) => (b.count ?? 0) - (a.count ?? 0))[0];
  return (
    <article className="ov-card" aria-labelledby={`ov-${r.slug}`}>
      <header className="ov-head">
        <Link className="ov-id" href={`/forvaltare/${r.slug}`}>
          <ProviderLogo name={r.name} logo={r.logo} />
          <h3 className="ov-name" id={`ov-${r.slug}`}>
            {r.name}
          </h3>
        </Link>
        <ul className="ov-tags" aria-label="Erbjuder">
          {r.ekonomisk && <li className="ov-tag">Ekonomisk</li>}
          {r.teknisk && <li className="ov-tag">Teknisk</li>}
          {r.region && <li className="ov-tag ov-tag-region">Bara {r.region}</li>}
        </ul>
      </header>

      <div className="ov-price">
        <span className="ov-k">Pris, ekonomisk förvaltning, {n} lgh</span>
        <PriceValue r={r} n={n} price={price} />
      </div>

      <dl className="ov-stats">
        <div className="ov-stat">
          <dt className="ov-k">Kundnöjdhet</dt>
          <dd>
            {r.nki ? (
              <>
                <a className="ov-v ov-src" href={r.nki.url} target="_blank" rel="noopener noreferrer" title={r.nki.text}>
                  NKI {r.nki.value}
                </a>
                <span className="ov-sub">Snitt {r.nki.average ?? "okänt"} ({r.nki.year})</span>
              </>
            ) : bestReview ? (
              <>
                <a className="ov-v ov-src" href={bestReview.url} target="_blank" rel="noopener noreferrer" title={bestReview.text}>
                  {bestReview.value.toLocaleString("sv-SE")} av 5
                </a>
                <span className="ov-sub">
                  {num(bestReview.count ?? 0)} omdömen på {REVIEW_SITE[bestReview.kind]}
                </span>
              </>
            ) : (
              <span className="ov-v ov-none">Inte mätt</span>
            )}
          </dd>
        </div>
      </dl>

      <footer className="ov-foot">
        <Link className="link ov-foot-link" href={`/forvaltare/${r.slug}`}>
          Läs hela profilen <ArrowIcon size={12} />
        </Link>
        <a className="link" href={r.website} target="_blank" rel="noopener noreferrer">
          Webbplats <ExternalIcon />
        </a>
      </footer>
    </article>
  );
}

function PriceValue({ r, n, price }: { r: OverviewRow; n: number; price: PriceRow | null }) {
  if (!r.pricing) return <span className="ov-big ov-none">Erbjuds inte</span>;
  if (!price || price.perYear === null) {
    return (
      <>
        <span className="ov-big ov-none">Pris på offert</span>
        {r.priceUrl && (
          <a className="ov-sub ov-src" href={r.priceUrl} target="_blank" rel="noopener noreferrer">
            {price?.kind === "none" && r.pricing.model !== "on_request" ? price.note : "Inget pris på sidan"}
          </a>
        )}
      </>
    );
  }
  const perLgh = price.perLgh ?? price.perYear / n;
  return (
    <>
      <span className="ov-big">{priceLabel(price, price.perYear, "year")}</span>
      <a className="ov-sub ov-src" href={r.priceUrl ?? r.website} target="_blank" rel="noopener noreferrer" title={price.note}>
        {num(Math.round(perLgh))} kr per lägenhet och år. {BASIS[price.kind]}
        {r.pricing?.model === "list" && r.pricing.package ? `, paketet ${r.pricing.package}` : ""}, {VAT_TEXT[price.vat]}.
      </a>
    </>
  );
}

const REVIEW_SITE: Record<OverviewRating["kind"], string> = { nki: "NKI", reco: "Reco", trustpilot: "Trustpilot", google: "Google", egen: "Egen kundportal" };
