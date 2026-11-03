"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { DotBuilding } from "./DotBuilding";
import { ExternalIcon, MinusIcon, PlusIcon, StatusMark, STATUS_LABEL } from "./icons";
import { dateLong, num } from "@/lib/format";
import { priceLabel, valueOf, VAT_TEXT, type Unit } from "@/lib/price-label";
import { niceMax, priceRows, type PriceInput, type PriceRow } from "@/lib/price";

export interface CalcProvider extends PriceInput {
  sourceUrl: string;
  sourceTitle: string;
  sourceChecked: string;
}

interface Props {
  providers: CalcProvider[];
  checkedAt: string;
}

const MIN = 5;
const MAX = 100;

export function PriceCalculator({ providers, checkedAt }: Props) {
  const uid = useId();
  const [n, setN] = useState(50);
  // Texten i rutan hålls separat, så att man kan skriva "20" utan att "2" först tvingas upp till minimivärdet.
  const [draft, setDraft] = useState("50");
  const [unit, setUnit] = useState<Unit>("year");
  const [table, setTable] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1800);
    return () => window.clearTimeout(t);
  }, []);

  const rows = useMemo(() => priceRows(providers, n), [providers, n]);
  const byslug = useMemo(() => new Map(providers.map((p) => [p.slug, p])), [providers]);

  // Förvaltare som inte anger något pris ritas inte som staplar. De listas under diagrammet.
  const priced = rows.filter((r) => r.perYear !== null);
  const unpriced = rows.filter((r) => r.perYear === null);
  const values = priced.map((r) => valueOf(r, unit, n));
  const rangeRows = priced.filter((r) => r.kind !== "from");
  const rangeVals = rangeRows.map((r) => valueOf(r, unit, n) as number);
  const lo = rangeVals.length ? Math.min(...rangeVals) : null;
  const hi = rangeVals.length ? Math.max(...rangeVals) : null;

  const maxVal = Math.max(1, ...values.filter((v): v is number => v !== null));
  const axisMax = niceMax(maxVal);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * axisMax);
  const pct = ((n - MIN) / (MAX - MIN)) * 100;

  const activeRow = rows.find((r) => r.slug === active) ?? null;
  const activeProv = activeRow ? byslug.get(activeRow.slug) : undefined;

  const unitText = unit === "year" ? "kr per år" : "kr per lägenhet och år";
  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v)));
  const setSize = (v: number) => {
    const c = clamp(v);
    setN(c);
    setDraft(String(c));
  };

  const summary =
    lo === null || hi === null
      ? "Inga angivna priser för den här storleken"
      : lo === hi
        ? num(lo)
        : `${num(lo)} till ${num(hi)}`;

  return (
    <section className="calc" aria-label="Prisräknare för ekonomisk förvaltning">
      <div className="calc-controls tile">
        <label className="calc-label" htmlFor={`${uid}-range`}>
          Antal lägenheter
        </label>

        <input
          id={`${uid}-range`}
          className="calc-range"
          type="range"
          min={MIN}
          max={MAX}
          step={1}
          value={n}
          style={{ ["--pct" as string]: `${pct}%` }}
          aria-valuetext={`${n} lägenheter`}
          onChange={(e) => setSize(Number(e.target.value))}
        />

        <div className="calc-stepper">
          <button type="button" className="calc-step" aria-label="En lägenhet färre" onClick={() => setSize(n - 1)}>
            <MinusIcon />
          </button>
          <input
            className="calc-num"
            type="number"
            inputMode="numeric"
            min={MIN}
            max={MAX}
            value={draft}
            aria-label="Antal lägenheter, skriv in en siffra"
            onChange={(e) => {
              setDraft(e.target.value);
              const v = Number(e.target.value);
              if (e.target.value !== "" && Number.isInteger(v) && v >= MIN && v <= MAX) setN(v);
            }}
            onBlur={() => setSize(draft === "" ? n : Number(draft))}
          />
          <button type="button" className="calc-step" aria-label="En lägenhet fler" onClick={() => setSize(n + 1)}>
            <PlusIcon />
          </button>
        </div>

        <div className="seg" role="group" aria-label="Visa pris">
          <button type="button" className="seg-btn" aria-pressed={unit === "year"} onClick={() => setUnit("year")}>
            Per år
          </button>
          <button type="button" className="seg-btn" aria-pressed={unit === "lgh"} onClick={() => setUnit("lgh")}>
            Per lägenhet
          </button>
        </div>
      </div>

      <div className="calc-body">
        <div className="calc-house tile">
          <DotBuilding count={n} intro={intro} />
          <p className="calc-house-legend">
            <span className="calc-dot-sample" aria-hidden="true" /> En prick är en lägenhet
          </p>
          <p className="calc-house-n">
            <span className="calc-house-num dotnum">{n}</span> lägenheter
          </p>
        </div>

        <div className="calc-chart tile" onMouseLeave={() => setActive(null)}>
          <div className="calc-sum" aria-live="polite">
            <p className="calc-kicker">Angivna priser för {n} lägenheter</p>
            <p className="calc-sumnum">
              {summary}
              {lo !== null && <span className="calc-sumunit"> {unitText}</span>}
            </p>
            <p className="fine">
              {priced.length} av {rows.length} förvaltare anger ett pris. Lägsta pris till högsta pris bland de angivna.
            </p>
          </div>

          {!table ? (
            <div className="chart">
              <div className="chart-axis" aria-hidden="true">
                <span />
                <span className="chart-axis-track">
                  {ticks.map((t, i) => (
                    <span key={i} className="chart-axis-tick" style={{ left: `${(t / axisMax) * 100}%` }}>
                      {num(t)}
                    </span>
                  ))}
                </span>
                <span />
              </div>

              <div className="chart-rows" role="list" aria-label={`Angivna priser, ${unitText}, för ${n} lägenheter, per förvaltare`}>
                <div className="chart-grid" aria-hidden="true">
                  {ticks.map((t, i) => (
                    <span key={i} className={i === 0 ? "chart-line chart-line-zero" : "chart-line"} style={{ left: `${(t / axisMax) * 100}%` }} />
                  ))}
                </div>

                {priced.map((r, idx) => {
                  const v = values[idx];
                  const w = v === null ? 0 : Math.max(1.5, (v / axisMax) * 100);
                  const st = r.status ?? "none";
                  const cls =
                    r.kind === "none"
                      ? ""
                      : r.kind === "from"
                        ? "chart-bar chart-bar-from"
                        : r.status === "assumed"
                          ? "chart-bar chart-bar-assume"
                          : r.status === "estimated"
                            ? "chart-bar chart-bar-est"
                            : "chart-bar";
                  return (
                    <div
                      key={r.slug}
                      className="chart-row"
                      role="listitem"
                      data-active={active === r.slug}
                      onMouseEnter={() => setActive(r.slug)}
                      onFocus={() => setActive(r.slug)}
                      onClick={() => setActive(r.slug)}
                    >
                      <Link className="chart-name" href={`/forvaltare/${r.slug}`}>
                        <StatusMark status={st} />
                        {r.name}
                      </Link>
                      <div className="chart-track">
                        {v === null ? <span className="chart-none" /> : <span className={cls} style={{ width: `${w}%` }} />}
                      </div>
                      <div className="chart-val">
                        {v === null ? (
                          <strong className="chart-val-none">Inget pris</strong>
                        ) : (
                          <>
                            <strong>{priceLabel(r, v, unit)}</strong>
                            <small>
                              {r.basis}, {VAT_TEXT[r.vat]}
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {unpriced.length > 0 && (
                <p className="calc-nopr small">
                  <strong>
                    {unpriced.length} av {rows.length} anger inget pris:
                  </strong>{" "}
                  {unpriced.map((r, i) => (
                    <span key={r.slug}>
                      {i > 0 && ", "}
                      <Link className="link" href={`/forvaltare/${r.slug}`}>
                        {r.name}
                      </Link>
                    </span>
                  ))}
                  . De svarar på förfrågan.
                </p>
              )}

              <ul className="chart-key" aria-label="Teckenförklaring">
                <li>
                  <span className="key-swatch" /> Verifierat
                </li>
                <li>
                  <span className="key-swatch key-est" /> Uppskattning
                </li>
                <li>
                  <span className="key-swatch key-assume" /> Antagande
                </li>
                <li>
                  <span className="key-swatch key-none" /> Inget pris angivet
                </li>
              </ul>
            </div>
          ) : (
            <div className="calc-tablewrap">
              <table className="calc-table">
                <caption className="sr-only">Pris för {n} lägenheter per förvaltare</caption>
                <thead>
                  <tr>
                    <th scope="col">Förvaltare</th>
                    <th scope="col" className="num">
                      Kr per år
                    </th>
                    <th scope="col" className="num">
                      Kr per lägenhet
                    </th>
                    <th scope="col">Underlag</th>
                    <th scope="col">Status</th>
                    <th scope="col">Källa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const p = byslug.get(r.slug);
                    return (
                      <tr key={r.slug}>
                        <th scope="row">
                          <Link href={`/forvaltare/${r.slug}`}>{r.name}</Link>
                        </th>
                        <td className="num">{r.perYear === null ? "Pris på förfrågan" : priceLabel(r, r.perYear, "year")}</td>
                        <td className="num">{r.perYear === null ? "" : priceLabel(r, valueOf(r, "lgh", n) as number, "lgh")}</td>
                        <td>{r.perYear === null ? "" : `${r.basis}, ${VAT_TEXT[r.vat]}`}</td>
                        <td>{STATUS_LABEL[r.status ?? "none"]}</td>
                        <td>
                          {p && (
                            <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">
                              Läst {dateLong(p.sourceChecked)} <ExternalIcon />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="calc-readout" aria-live="polite">
            {activeRow && activeProv ? (
              <p className="small">
                <strong>{activeRow.name}.</strong> {activeRow.note}{" "}
                <a className="link" href={activeProv.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Källa, läst {dateLong(activeProv.sourceChecked)} <ExternalIcon />
                </a>
              </p>
            ) : (
              <p className="small muted">Håll muspekaren över en rad eller tryck på den för att se var siffran kommer ifrån.</p>
            )}
          </div>

          <div className="calc-foot">
            <p className="fine">
              Kontrollerat {dateLong(checkedAt)}. Priser och villkor kan ändras, fråga alltid förvaltaren.{" "}
              <Link className="link" href="/prisguide">
                Källor och metod
              </Link>
            </p>
            <button type="button" className="calc-toggle" aria-pressed={table} onClick={() => setTable((v) => !v)}>
              {table ? "Visa som diagram" : "Visa som tabell"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
