"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowIcon, CheckIcon, ExternalIcon } from "./icons";
import { matchProviders, matchQuery, PRIORITIES, type MatchInput, type MatchProvider, type Need, type Priority } from "@/lib/match";
import { priceLabel } from "@/lib/price-label";

interface Props {
  rows: MatchProvider[];
  initial: MatchInput & { asked: boolean };
  /** Sant när offertförfrågningar är öppna. Annars visas inga valrutor. */
  requestsOpen: boolean;
}

const NEEDS: { key: Need; label: string }[] = [
  { key: "ekonomisk", label: "Ekonomisk" },
  { key: "teknisk", label: "Teknisk" },
  { key: "bada", label: "Båda" },
];

const TOP = 3;
const MAX_PICK = 3;

export function Matcher({ rows, initial, requestsOpen }: Props) {
  const uid = useId();
  const [need, setNeed] = useState<Need>(initial.need);
  const [ort, setOrt] = useState(initial.ort);
  const [lgh, setLgh] = useState(String(initial.lgh));
  const [prio, setPrio] = useState<Priority[]>(initial.priorities);
  const [done, setDone] = useState<MatchInput | null>(initial.asked ? initial : null);
  const [picked, setPicked] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => (done ? matchProviders(rows, done) : null), [rows, done]);

  useEffect(() => {
    if (done && resultRef.current && !initial.asked) resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [done, initial.asked]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.min(999, Math.max(1, Math.round(Number(lgh) || 30)));
    const input = { need, ort: ort.trim(), lgh: n, priorities: prio };
    setLgh(String(n));
    setDone(input);
    setPicked([]);
    setShowAll(false);
    window.history.replaceState(null, "", `/?${matchQuery(input)}#resultat`);
  };

  const toggle = (p: Priority) => setPrio((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));
  const togglePick = (slug: string) => setPicked((cur) => (cur.includes(slug) ? cur.filter((x) => x !== slug) : cur.length >= MAX_PICK ? cur : [...cur, slug]));

  const top = result ? result.matches.slice(0, TOP) : [];
  const rest = result ? result.matches.slice(TOP) : [];

  const offerHref = done ? `/be-om-offert?${matchQuery(done)}&${picked.map((s) => `f=${encodeURIComponent(s)}`).join("&")}` : "#";

  return (
    <>
      <form className="mx-form" onSubmit={submit}>
        <fieldset className="mx-q">
          <legend className="mx-label">Vad behöver ni hjälp med?</legend>
          <div className="mx-options">
            {NEEDS.map((n) => (
              <button key={n.key} type="button" className="mx-opt" aria-pressed={need === n.key} onClick={() => setNeed(n.key)}>
                {n.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mx-row">
          <div className="mx-q">
            <label className="mx-label" htmlFor={`${uid}-ort`}>
              Var ligger föreningen?
            </label>
            <input id={`${uid}-ort`} className="mx-input" placeholder="Ort, till exempel Malmö" value={ort} onChange={(e) => setOrt(e.target.value)} autoComplete="address-level2" />
          </div>
          <div className="mx-q mx-q-small">
            <label className="mx-label" htmlFor={`${uid}-lgh`}>
              Antal lägenheter
            </label>
            <input id={`${uid}-lgh`} className="mx-input" inputMode="numeric" value={lgh} onChange={(e) => setLgh(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          </div>
        </div>

        <fieldset className="mx-q">
          <legend className="mx-label">
            Vad är viktigast för er? <span className="mx-hint">Välj gärna flera</span>
          </legend>
          <div className="mx-options mx-options-wrap">
            {PRIORITIES.map((p) => (
              <button key={p.key} type="button" className="mx-opt mx-chip" aria-pressed={prio.includes(p.key)} onClick={() => toggle(p.key)} title={p.help}>
                {prio.includes(p.key) && <CheckIcon size={12} />}
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="btn btn-accent mx-submit">
          Visa förvaltare som passar
          <span className="btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </form>

      {result && done && (
        <div className="mx-result" id="resultat" ref={resultRef} aria-live="polite">
          {result.matches.length === 0 ? (
            <p className="mx-empty">Ingen förvaltare vi har läst erbjuder det här där ni finns. Prova utan ort.</p>
          ) : (
            <>
              <h2 className="mx-title">{done.priorities.length > 0 ? "Passar er bäst" : "Förvaltare som erbjuder det ni behöver"}</h2>
              <p className="mx-sub">
                {done.priorities.length > 0
                  ? "Ordningen bygger på det ni valde som viktigast. Skälen står vid varje förvaltare."
                  : "Ni valde inget som viktigast, så de står i namnordning. Välj något ovan för att få en matchning."}
              </p>
              <ol className="mx-list">
                {top.map((m, i) => (
                  <li key={m.row.slug} className="mx-card">
                    <div className="mx-card-main">
                      <div className="mx-card-head">
                        {done.priorities.length > 0 && <span className="mx-rank">{i + 1}</span>}
                        <h3 className="mx-name">
                          <Link href={`/forvaltare/${m.row.slug}`}>{m.row.name}</Link>
                        </h3>
                      </div>
                      {m.reasons.length > 0 && (
                        <ul className="mx-reasons">
                          {m.reasons.map((r) => (
                            <li key={r}>
                              <CheckIcon size={12} /> {r}
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mx-price">
                        {m.price && m.price.perYear !== null ? `${priceLabel(m.price, m.price.perYear, "year")} per år` : "Pris på offert"}
                      </p>
                    </div>
                    <div className="mx-card-act">
                      {requestsOpen ? (
                        <label className="mx-pick">
                          <input type="checkbox" checked={picked.includes(m.row.slug)} disabled={!picked.includes(m.row.slug) && picked.length >= MAX_PICK} onChange={() => togglePick(m.row.slug)} />
                          Välj
                        </label>
                      ) : (
                        <a className="mx-link" href={m.row.website} target="_blank" rel="noopener noreferrer">
                          Webbplats <ExternalIcon />
                        </a>
                      )}
                      <Link className="mx-link" href={`/forvaltare/${m.row.slug}`}>
                        Läs mer
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>

              {rest.length > 0 && (
                <div className="mx-rest">
                  <button type="button" className="mx-more" aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
                    {showAll ? "Dölj" : `Visa ${rest.length} till som erbjuder detta`}
                  </button>
                  {showAll && (
                    <ul className="mx-rest-list">
                      {rest.map((m) => (
                        <li key={m.row.slug}>
                          {requestsOpen && (
                            <input
                              type="checkbox"
                              aria-label={`Välj ${m.row.name}`}
                              checked={picked.includes(m.row.slug)}
                              disabled={!picked.includes(m.row.slug) && picked.length >= MAX_PICK}
                              onChange={() => togglePick(m.row.slug)}
                            />
                          )}
                          <Link href={`/forvaltare/${m.row.slug}`}>{m.row.name}</Link>
                          <span className="mx-rest-note">{m.reasons[0] ?? (m.price && m.price.perYear !== null ? priceLabel(m.price, m.price.perYear, "year") : "Pris på offert")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {requestsOpen && (
                <div className="mx-offer">
                  <p>
                    {picked.length === 0 ? "Välj upp till tre förvaltare så skickar vi er förfrågan till dem." : `${picked.length} av ${MAX_PICK} valda.`}
                  </p>
                  <Link className={`btn btn-accent${picked.length === 0 ? " is-disabled" : ""}`} href={picked.length ? offerHref : "#resultat"} aria-disabled={picked.length === 0}>
                    Be om offert
                    <span className="btn-icon">
                      <ArrowIcon />
                    </span>
                  </Link>
                </div>
              )}

              {(result.otherPlaces.length > 0 || result.wrongService.length > 0) && (
                <p className="mx-foot">
                  {result.otherPlaces.length > 0 && `Visas inte eftersom de bara nämner andra orter: ${result.otherPlaces.join(", ")}. `}
                  {result.wrongService.length > 0 && `Erbjuder inte det ni behöver: ${result.wrongService.join(", ")}.`}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
