"use client";

import { useId, useState } from "react";
import { LGH_MAX, LGH_MIN, useCompare } from "./CompareProvider";
import { CATEGORIES, CATEGORY } from "@/lib/schema";

/** Kategori, ort och storlek. Följer med när man rullar, så att valen alltid finns nära tabellerna. */
export function CompareBar() {
  const uid = useId();
  const { data, category, setCategory, categoryLocked, ort, setOrt, n, setN, shown, hidden, total } = useCompare();
  // Siffran i rutan hålls separat, så att man kan skriva "35" utan att "3" först tvingas upp till minimum.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const v = Number(draft);
    if (draft !== "" && Number.isFinite(v)) setN(Math.min(LGH_MAX, Math.max(LGH_MIN, Math.round(v))));
    setDraft(null);
  };

  const filtered = ort.trim() !== "";
  const countText = filtered
    ? `Visar ${shown.length} av ${total} förvaltare. ${hidden.length > 0 ? `${hidden.length} nämner bara andra orter.` : ""}`
    : `Visar alla ${total} förvaltare.`;

  return (
    <div className="cbar-wrap">
      <div className="container">
        <div className="cbar" role="group" aria-label="Val för jämförelsen">
          {!categoryLocked && (
            <div className="cbar-field">
              <span className="cbar-label" id={`${uid}-cat`}>
                Förvaltning
              </span>
              <div className="seg" role="group" aria-labelledby={`${uid}-cat`}>
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" className="seg-btn" aria-pressed={category === c} onClick={() => setCategory(c)}>
                    {CATEGORY[c].short}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cbar-field cbar-grow">
            <label className="cbar-label" htmlFor={`${uid}-ort`}>
              Ort
            </label>
            <div className="cbar-input">
              <input
                id={`${uid}-ort`}
                className="cbar-text"
                type="text"
                list={`${uid}-orter`}
                autoComplete="off"
                spellCheck={false}
                placeholder="Var finns föreningen? Till exempel Malmö"
                value={ort}
                maxLength={60}
                onChange={(e) => setOrt(e.target.value)}
              />
              {filtered && (
                <button type="button" className="cbar-clear" onClick={() => setOrt("")}>
                  Rensa
                </button>
              )}
            </div>
            <datalist id={`${uid}-orter`}>
              {data.places.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          {category === "ekonomisk" && (
            <div className="cbar-field">
              <label className="cbar-label" htmlFor={`${uid}-lgh`}>
                Lägenheter
              </label>
              <input
                id={`${uid}-lgh`}
                className="cbar-num"
                type="number"
                inputMode="numeric"
                min={LGH_MIN}
                max={LGH_MAX}
                value={draft ?? String(n)}
                aria-describedby={`${uid}-lgh-help`}
                onChange={(e) => {
                  setDraft(e.target.value);
                  const v = Number(e.target.value);
                  if (e.target.value !== "" && Number.isInteger(v) && v >= LGH_MIN && v <= LGH_MAX) setN(v);
                }}
                onBlur={commit}
              />
              <span className="sr-only" id={`${uid}-lgh-help`}>
                Styr vilket pris som visas i priskolumnen, mellan {LGH_MIN} och {LGH_MAX} lägenheter.
              </span>
            </div>
          )}

          <p className="cbar-count" aria-live="polite">
            {countText}
          </p>
        </div>
      </div>
    </div>
  );
}
