"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowIcon, ExternalIcon, MinusIcon, PlusIcon } from "./icons";
import { dateLong, num } from "@/lib/format";
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
  { key: "clients", label: "Antal kunder" },
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
    if (sort === "nki") return sortRows(list, (r) => r.nki?.value ?? null, "desc");
    return sortRows(list, (r) => r.clients?.value ?? null, "desc");
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
        Visar {shown.length} förvaltare. {priced} av {rows.length} publicerar ett pris för ekonomisk förvaltning som går att räkna på för {n} lägenheter.
        {sort !== "name" && " Förvaltare som saknar uppgiften ligger sist."}
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
  const reviews = r.ratings.filter((x) => x.kind !== "nki");
  return (
    <article className="ov-card" aria-labelledby={`ov-${r.slug}`}>
      <header className="ov-head">
        <h3 className="ov-name" id={`ov-${r.slug}`}>
          <Link href={`/forvaltare/${r.slug}`}>{r.name}</Link>
        </h3>
        <ul className="ov-tags" aria-label="Erbjuder">
          <li className={r.ekonomisk ? "ov-tag" : "ov-tag ov-tag-off"}>{r.ekonomisk ? "Ekonomisk" : "Ej ekonomisk"}</li>
          <li className={r.teknisk ? "ov-tag" : "ov-tag ov-tag-off"}>{r.teknisk ? "Teknisk" : "Ej teknisk"}</li>
          {r.region && <li className="ov-tag ov-tag-region">Bara {r.region}</li>}
        </ul>
      </header>

      <div className="ov-price">
        <span className="ov-k">Ekonomisk förvaltning, {n} lägenheter</span>
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
                <span className="ov-sub">
                  Prognoscentret {r.nki.year}. Snitt {r.nki.average ?? "okänt"}.
                </span>
              </>
            ) : (
              <>
                <span className="ov-v ov-none">Ej publicerat</span>
                <span className="ov-sub">Inget offentligt NKI-värde</span>
              </>
            )}
          </dd>
        </div>
        <Stat label="Kunder" fact={r.clients} value={r.clients ? num(r.clients.value) : null} sub="enligt förvaltaren" />
        <Stat label="Grundad" fact={r.founded} value={r.founded ? String(r.founded.year) : null} />
        <Stat label="Kontor" fact={r.offices} value={r.offices ? num(r.offices.count) : null} sub={r.employees ? `${num(r.employees.value)} anställda` : undefined} />
      </dl>

      {reviews.length > 0 && (
        <ul className="ov-reviews" aria-label="Omdömen">
          {reviews.map((x, i) => (
            <li key={i}>
              <Review x={x} />
            </li>
          ))}
        </ul>
      )}

      <div className="ov-terms">
        <span className="ov-k">Avtal och byte</span>
        {r.terms.length > 0 ? (
          <ul>
            {r.terms.map((t, i) => (
              <li key={i}>
                {t.text}{" "}
                <a className="ov-srclink" href={t.url} target="_blank" rel="noopener noreferrer" aria-label={`Källa, läst ${dateLong(t.checked)}`}>
                  <ExternalIcon size={10} />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ov-none">Inga villkor publicerade. Fråga efter avtalstid, uppsägningstid och uppstartsavgift.</p>
        )}
      </div>

      <footer className="ov-foot">
        <Link className="link ov-foot-link" href={`/forvaltare/${r.slug}`}>
          Hela profilen <ArrowIcon size={12} />
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
        <span className="ov-big ov-none">Endast offert</span>
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
        {num(Math.round(perLgh))} kr per lägenhet och år. {BASIS[price.kind]}, {VAT_TEXT[price.vat]}.
      </a>
    </>
  );
}

function Stat({ label, fact, value, sub }: { label: string; fact: { text: string; url: string } | null; value: string | null; sub?: string }) {
  return (
    <div className="ov-stat">
      <dt className="ov-k">{label}</dt>
      <dd>
        {fact && value ? (
          <>
            <a className="ov-v ov-src" href={fact.url} target="_blank" rel="noopener noreferrer" title={fact.text}>
              {value}
            </a>
            {sub && <span className="ov-sub">{sub}</span>}
          </>
        ) : (
          <span className="ov-v ov-none">Anges inte</span>
        )}
      </dd>
    </div>
  );
}

const REVIEW_SITE: Record<OverviewRating["kind"], string> = { nki: "NKI", reco: "Reco", trustpilot: "Trustpilot", google: "Google", egen: "Egen kundportal" };

function Review({ x }: { x: OverviewRating }) {
  const value = x.value.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  const few = x.count !== null && x.count < 20;
  return (
    <a className="ov-review ov-src" href={x.url} target="_blank" rel="noopener noreferrer" title={x.text}>
      <strong>{REVIEW_SITE[x.kind]}</strong> {value} av 5
      {x.count !== null ? ` (${num(x.count)} omdömen${few ? ", för få för slutsatser" : ""})` : ""}
      {x.ownClaim && <span className="ov-flag">enligt förvaltaren</span>}
    </a>
  );
}
