"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CheckIcon, ExternalIcon, FeatureMark, FEATURE_LABEL, MinusIcon, PlusIcon, PresenceMark, PRESENCE_LABEL, StatusMark, STATUS_LABEL } from "./icons";
import type { CompareDetail } from "@/lib/compare";
import { dateLong } from "@/lib/format";
import { priceRow, type PriceRow } from "@/lib/price";
import { priceLabel, valueOf, VAT_TEXT } from "@/lib/price-label";
import { CATEGORIES, CATEGORY, DISCLOSURE_KEYS, FEATURES } from "@/lib/schema";
import type { Category } from "@/lib/types";

interface Props {
  details: Record<Category, CompareDetail[]>;
  /** Förvalda förvaltare per kategori, för när adressen inte anger något. */
  defaults: Record<Category, string[]>;
  initialCategory: Category;
  initialSel: string[];
  initialN: number;
}

const MIN = 3;
const MAX = 500;
const MAX_SEL = 3;
const PRESETS = [10, 20, 35, 50, 75, 100];
const SCOPE_TEXT = { national: "Hela landet enligt förvaltaren", regional: "Regionalt", unknown: "Anges inte tydligt" } as const;

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v)));

/** Gruppetikett som fyller hela raden. Texten ligger i en egen ruta så att den kan sitta kvar vid kanten när tabellen rullas i sidled. */
function GroupRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr className="cp-group">
      <th scope="colgroup" colSpan={cols + 1}>
        <span className="cp-group-label">{children}</span>
      </th>
    </tr>
  );
}

function ListCell({ items, empty = "Anges inte" }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <span className="muted">{empty}</span>;
  return (
    <ul className="cp-list">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export function Compare({ details, defaults, initialCategory, initialSel, initialN }: Props) {
  const uid = useId();
  const [category, setCategory] = useState<Category>(initialCategory);
  const [sel, setSel] = useState<string[]>(initialSel);
  const [n, setN] = useState(initialN);
  const [draft, setDraft] = useState(String(initialN));
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  const providers = details[category];
  const catLabel = CATEGORY[category].label;

  // Länken till jämförelsen går att dela: valet ligger i adressen.
  useEffect(() => {
    // Bokstäver och bindestreck i förvaltarnas adressnamn behöver inte kodas, så länken blir läsbar.
    const parts = [
      ...(category !== "ekonomisk" ? [`kategori=${category}`] : []),
      ...(sel.length > 0 ? [`forvaltare=${sel.join(",")}`] : []),
      ...(category === "ekonomisk" ? [`lgh=${n}`] : []),
    ];
    window.history.replaceState(null, "", `${window.location.pathname}${parts.length ? `?${parts.join("&")}` : ""}`);
  }, [category, sel, n]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const chosen = useMemo(() => sel.map((s) => providers.find((p) => p.slug === s)).filter((p): p is CompareDetail => Boolean(p)), [sel, providers]);
  const rows = useMemo(() => new Map<string, PriceRow>(chosen.map((p) => [p.slug, priceRow({ slug: p.slug, name: p.name, pricing: p.pricing }, n)])), [chosen, n]);

  const toggle = (slug: string) => {
    setSel((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= MAX_SEL ? prev : [...prev, slug]));
  };

  const switchCategory = (c: Category) => {
    if (c === category) return;
    const kept = sel.filter((slug) => details[c].some((p) => p.slug === slug));
    setCategory(c);
    setSel(kept.length > 0 ? kept : defaults[c]);
  };

  const setSize = (v: number) => {
    const c = clamp(v);
    setN(c);
    setDraft(String(c));
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  // Siffror med olika momsgrund går inte att ställa bredvid varandra utan förbehåll.
  const priced = chosen.map((p) => rows.get(p.slug)).filter((r): r is PriceRow => r !== undefined && r.perYear !== null);
  const vatSet = new Set(priced.map((r) => r.vat));
  const unpriced = chosen.filter((p) => rows.get(p.slug)?.perYear === null);
  const cols = chosen.length;
  const showSize = category === "ekonomisk";

  return (
    <div className="cp">
      <div className="cp-controls tile">
        <div className="cp-cat">
          <span className="cp-legend" id={`${uid}-cat`}>
            Förvaltning
          </span>
          <div className="seg" role="group" aria-labelledby={`${uid}-cat`}>
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="seg-btn" aria-pressed={category === c} onClick={() => switchCategory(c)}>
                {CATEGORY[c].short}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="cp-pick">
          <legend className="cp-legend">Förvaltare, välj upp till {MAX_SEL}</legend>
          <div className="cp-chips">
            {providers.map((p) => {
              const on = sel.includes(p.slug);
              const locked = !on && sel.length >= MAX_SEL;
              return (
                <button
                  key={p.slug}
                  type="button"
                  className="cp-chip"
                  aria-pressed={on}
                  disabled={locked}
                  title={locked ? `Ta bort en förvaltare först, högst ${MAX_SEL} åt gången` : undefined}
                  onClick={() => toggle(p.slug)}
                >
                  <span className="cp-chip-mark" aria-hidden="true">
                    {on && <CheckIcon size={12} />}
                  </span>
                  {p.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {showSize && (
          <div className="cp-size">
            <label className="cp-legend" htmlFor={`${uid}-n`}>
              Antal lägenheter
            </label>
            <div className="cp-size-row">
              <div className="calc-stepper">
                <button type="button" className="calc-step" aria-label="En lägenhet färre" onClick={() => setSize(n - 1)}>
                  <MinusIcon />
                </button>
                <input
                  id={`${uid}-n`}
                  className="calc-num"
                  type="number"
                  inputMode="numeric"
                  min={MIN}
                  max={MAX}
                  value={draft}
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
              <div className="cp-presets" role="group" aria-label="Vanliga storlekar">
                {PRESETS.map((v) => (
                  <button key={v} type="button" className="cp-preset" aria-pressed={n === v} onClick={() => setSize(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="cp-share">
          <button type="button" className="btn btn-quiet cp-copy" onClick={copyLink} disabled={sel.length === 0}>
            {copied ? (
              <>
                Länken är kopierad <CheckIcon />
              </>
            ) : (
              "Kopiera länk till jämförelsen"
            )}
          </button>
        </div>
      </div>

      {chosen.length === 0 ? (
        <p className="cp-empty tile">Välj minst en förvaltare för att se jämförelsen.</p>
      ) : (
        <>
          {showSize && vatSet.size > 1 && (
            <p className="cp-warn" role="note">
              <strong>Moms skiljer.</strong> {priced.map((r) => `${r.name}: ${VAT_TEXT[r.vat]}`).join(", ")}. Siffrorna går inte att jämföra rakt av. Be om pris med och utan moms.
            </p>
          )}
          {showSize && unpriced.length > 0 && (
            <p className="cp-note small muted">
              {unpriced.map((p) => p.name).join(" och ")} anger inget pris för {n} lägenheter. Be om offert.
            </p>
          )}
          {!showSize && (
            <p className="cp-note small muted">
              Ingen av förvaltarna anger ett pris för själva tjänsten inom teknisk förvaltning. Be om offert och använd{" "}
              <Link className="link" href="/byta-forvaltare?mall=teknisk#offert">
                offertmallen
              </Link>
              .
            </p>
          )}
          {chosen.length === 1 && <p className="cp-note small muted">Välj en förvaltare till för att jämföra.</p>}

          {chosen.length > 1 && <p className="fine cp-scroll-hint">Rulla tabellen i sidled för att se alla förvaltare.</p>}
          <div className="cp-wrap">
            <table className="cp-table" style={{ ["--cols" as string]: cols }}>
              <caption className="sr-only">
                Jämförelse av {catLabel.toLowerCase()} hos {chosen.map((p) => p.name).join(", ")}
                {showSize ? ` för ${n} lägenheter` : ""}
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="cp-corner">
                    <span className="sr-only">Uppgift</span>
                  </th>
                  {chosen.map((p) => (
                    <th key={p.slug} scope="col" className="cp-head">
                      <div className="cp-head-in">
                        <Link className="cp-name" href={`/forvaltare/${p.slug}`}>
                          {p.name}
                        </Link>
                        {p.region && <span className="pill cp-region">{p.region}</span>}
                        <button type="button" className="cp-remove" onClick={() => toggle(p.slug)} aria-label={`Ta bort ${p.name} från jämförelsen`}>
                          <MinusIcon size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <GroupRow cols={cols}>{showSize ? `Pris för ${n} ${n === 1 ? "lägenhet" : "lägenheter"}` : "Pris"}</GroupRow>
                {showSize ? (
                  <>
                    <tr>
                      <th scope="row">Pris per år</th>
                      {chosen.map((p) => {
                        const r = rows.get(p.slug) as PriceRow;
                        return (
                          <td key={p.slug}>
                            {r.perYear === null ? (
                              <span className="cp-none">{r.basis === "Pris på förfrågan" ? "Pris på förfrågan" : `Inget pris för ${n} lägenheter`}</span>
                            ) : (
                              <span className="cp-price">
                                <StatusMark status={r.status ?? "none"} />
                                <strong>{priceLabel(r, r.perYear, "year")}</strong>
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th scope="row">Per lägenhet och år</th>
                      {chosen.map((p) => {
                        const r = rows.get(p.slug) as PriceRow;
                        const v = valueOf(r, "lgh", n);
                        return <td key={p.slug}>{v === null || r.kind === "from" ? <span className="muted">Anges inte</span> : priceLabel(r, v, "lgh")}</td>;
                      })}
                    </tr>
                    <tr>
                      <th scope="row">Underlag och moms</th>
                      {chosen.map((p) => {
                        const r = rows.get(p.slug) as PriceRow;
                        return (
                          <td key={p.slug}>
                            {r.basis}
                            {r.perYear !== null && <>, {VAT_TEXT[r.vat]}</>}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th scope="row">Hur siffran tagits fram</th>
                      {chosen.map((p) => {
                        const r = rows.get(p.slug) as PriceRow;
                        return (
                          <td key={p.slug} className="cp-small">
                            {r.status ? <span className="cp-status">{STATUS_LABEL[r.status]}. </span> : null}
                            {r.note}
                          </td>
                        );
                      })}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <th scope="row">Pris för tjänsten</th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="cp-small">
                        <span className="cp-none">Pris på förfrågan</span>
                        <span className="cp-sub">{p.pricing.model === "on_request" ? p.pricing.text : ""}</span>
                      </td>
                    ))}
                  </tr>
                )}
                {!showSize || chosen.some((p) => p.pricedExtras.length > 0) ? (
                  <tr>
                    <th scope="row">Tillägg med pris</th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="cp-small">
                        {p.pricedExtras.length > 0 ? (
                          <ul className="cp-list">
                            {p.pricedExtras.map((e) => (
                              <li key={e.label}>
                                {e.label}: {e.price}
                                {e.source.url !== p.source.url && (
                                  <a className="cp-extra-src" href={e.source.url} target="_blank" rel="noopener noreferrer">
                                    Källa, läst {dateLong(e.source.checked)}
                                    <ExternalIcon />
                                    <span className="sr-only"> ({p.name}, öppnas i ny flik)</span>
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="muted">Inga angivna</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Villkor</GroupRow>
                <tr>
                  <th scope="row">Uppsägningstid</th>
                  {chosen.map((p) => (
                    <td key={p.slug}>{p.notice ?? <span className="muted">Ej funnet</span>}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Övrigt om villkor</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <ListCell items={p.otherTerms} empty="Inget angivet" />
                    </td>
                  ))}
                </tr>
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Tjänster inom {catLabel.toLowerCase()}</GroupRow>
                {FEATURES[category].map((f) => (
                  <tr key={f.key}>
                    <th scope="row" title={f.help}>
                      {f.label}
                    </th>
                    {chosen.map((p) => {
                      const s = p.features[f.key] ?? "none";
                      return (
                        <td key={p.slug}>
                          <span className="cp-feat" data-state={s}>
                            <FeatureMark state={s} size={18} />
                            {FEATURE_LABEL[s]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Paket och nivåer</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      {p.levels.length > 0 ? (
                        <ul className="cp-list">
                          {p.levels.map((l) => (
                            <li key={l.name}>
                              <strong>{l.name}.</strong> {l.text}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">Inga angivna</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Ingår enligt förvaltarens text</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <ListCell items={p.included} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Tillval</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      {p.extras.length > 0 ? (
                        <ul className="cp-list">
                          {p.extras.map((e) => (
                            <li key={e.label}>
                              {e.label}
                              {e.price ? `: ${e.price}` : ", pris anges inte"}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="muted">Anges inte</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Digitala tjänster</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <ListCell items={p.digital} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Felanmälan och jour</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <ListCell items={p.reporting} />
                    </td>
                  ))}
                </tr>
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Var förvaltaren verkar</GroupRow>
                <tr>
                  <th scope="row">Verksamhetsområde</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <strong>{SCOPE_TEXT[p.coverage.scope]}.</strong> {p.coverage.text}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Orter som sidan nämner</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      {p.coverage.places.length > 0 ? p.coverage.places.join(", ") : <span className="muted">Inga orter angivna</span>}
                    </td>
                  ))}
                </tr>
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Vad förvaltaren berättar öppet</GroupRow>
                {DISCLOSURE_KEYS[category].map((k) => (
                  <tr key={k.key}>
                    <th scope="row">{k.label}</th>
                    {chosen.map((p) => {
                      const v = p.disclosure[k.key];
                      return (
                        <td key={p.slug}>
                          <span className="cp-open" data-presence={v}>
                            <PresenceMark presence={v} size={18} />
                            {PRESENCE_LABEL[v]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Om förvaltaren</GroupRow>
                <tr>
                  <th scope="row">Ägare och organisation</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      {p.group ?? <span className="muted">Anges inte</span>}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Kunder enligt förvaltaren</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      {p.customers ?? <span className="muted">Anges inte</span>}
                    </td>
                  ))}
                </tr>
              </tbody>

              <tbody>
                <GroupRow cols={cols}>Källa</GroupRow>
                <tr>
                  <th scope="row">Huvudsida</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <a className="link" href={p.source.url} target="_blank" rel="noopener noreferrer">
                        Läst {dateLong(p.source.checked)}
                        <ExternalIcon />
                      </a>
                    </td>
                  ))}
                </tr>
                {showSize && (
                  <tr>
                    <th scope="row">Prisuppgift</th>
                    {chosen.map((p) => (
                      <td key={p.slug} className="cp-small">
                        <a className="link" href={p.pricingSource.url} target="_blank" rel="noopener noreferrer">
                          Läst {dateLong(p.pricingSource.checked)}
                          <ExternalIcon />
                        </a>
                      </td>
                    ))}
                  </tr>
                )}
                <tr>
                  <th scope="row">Alla uppgifter</th>
                  {chosen.map((p) => (
                    <td key={p.slug} className="cp-small">
                      <Link className="link" href={`/forvaltare/${p.slug}`}>
                        Profil med alla källor
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          <ul className="legend cp-legend-key" aria-label="Teckenförklaring för tjänster">
            {(["included", "level", "optional", "listed", "none"] as const).map((s) => (
              <li key={s}>
                <FeatureMark state={s} size={16} /> {FEATURE_LABEL[s]}
              </li>
            ))}
          </ul>
          {showSize && (
            <ul className="legend cp-legend-key" aria-label="Teckenförklaring för pris">
              <li>
                <StatusMark status="verified" /> Verifierat: står på förvaltarens sida
              </li>
              <li>
                <StatusMark status="estimated" /> Uppskattning: räknat av oss mellan publicerade punkter
              </li>
              <li>
                <StatusMark status="assumed" /> Antagande: vår tolkning av en oklar uppgift
              </li>
            </ul>
          )}
        </>
      )}
    </div>
  );
}
