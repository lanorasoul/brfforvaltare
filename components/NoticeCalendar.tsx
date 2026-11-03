"use client";

import { useId } from "react";
import { MinusIcon, PlusIcon } from "./icons";
import { dateLong, plural } from "@/lib/format";
import { noticePlan, rollingPlan } from "@/lib/notice";

export interface NoticeState {
  mode: "year" | "rolling";
  end: string;
  months: number;
}

interface Props {
  state: NoticeState;
  onChange: (next: NoticeState) => void;
  /** Dagens datum som ISO-sträng. Skickas in så att servern och webbläsaren ritar samma första bild. */
  today: string;
}

const LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

const ord = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};
const year = (iso: string) => Number(iso.slice(0, 4));

type Cell = "outside" | "now" | "open" | "deadline" | "notice" | "end";

const isIso = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + "T00:00:00Z"));

export function NoticeCalendar({ state, onChange, today }: Props) {
  const uid = useId();
  const months = Math.min(24, Math.max(0, state.months));
  const endOk = isIso(state.end);

  const plan =
    state.mode === "rolling"
      ? rollingPlan(today, months)
      : noticePlan({ today, end: endOk ? state.end : today, months, autoRenew: true });

  const todayOrd = ord(today);
  const deadlineOrd = ord(plan.deadline);
  const endOrd = ord(plan.termEnd);
  const firstYear = year(today);
  const lastYear = Math.min(year(plan.termEnd), firstYear + 4);

  const kind = (o: number): Cell => {
    if (o < todayOrd || o > endOrd) return "outside";
    if (o === deadlineOrd && state.mode === "year") return "deadline";
    if (o === deadlineOrd && state.mode === "rolling") return "now";
    if (o === endOrd) return "end";
    if (o === todayOrd) return "now";
    if (o > deadlineOrd) return "notice";
    return "open";
  };

  const rows = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => firstYear + i);
  const set = (patch: Partial<NoticeState>) => onChange({ ...state, ...patch });
  const clampM = (v: number) => Math.min(24, Math.max(0, Math.round(v)));

  const days = plan.daysLeft;
  const when =
    state.mode === "rolling"
      ? "Så snart uppsägningen är framme börjar tiden löpa."
      : days === 0
        ? "Det är i dag."
        : `Det är om ${days} ${plural(days, "dag", "dagar")}.`;

  return (
    <div className="notice">
      <div className="seg notice-mode" role="group" aria-label="Hur löper avtalet?">
        <button type="button" className="seg-btn" aria-pressed={state.mode === "year"} onClick={() => set({ mode: "year" })}>
          Ett år i taget
        </button>
        <button type="button" className="seg-btn" aria-pressed={state.mode === "rolling"} onClick={() => set({ mode: "rolling" })}>
          Löpande
        </button>
      </div>

      <div className="notice-fields">
        {state.mode === "year" && (
          <div className="notice-field">
            <label htmlFor={`${uid}-end`}>Avtalet löper ut</label>
            <input
              id={`${uid}-end`}
              className="notice-date"
              type="date"
              value={state.end}
              onChange={(e) => set({ end: e.target.value })}
              aria-invalid={!endOk}
            />
          </div>
        )}
        <div className="notice-field">
          <label htmlFor={`${uid}-months`}>Uppsägningstid</label>
          <div className="calc-stepper">
            <button type="button" className="calc-step" aria-label="En månad kortare" onClick={() => set({ months: clampM(months - 1) })}>
              <MinusIcon />
            </button>
            <input
              id={`${uid}-months`}
              className="calc-num"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              value={months}
              onChange={(e) => {
                if (e.target.value !== "") set({ months: clampM(Number(e.target.value)) });
              }}
            />
            <button type="button" className="calc-step" aria-label="En månad längre" onClick={() => set({ months: clampM(months + 1) })}>
              <PlusIcon />
            </button>
          </div>
          <span className="notice-unit">{plural(months, "månad", "månader")}</span>
        </div>
      </div>

      <div className="notice-result" aria-live="polite">
        {state.mode === "year" ? (
          <>
            <p className="notice-kicker">Senast framme</p>
            <p className="notice-big">{dateLong(plan.deadline)}</p>
            <p className="small muted">
              {when} Då slutar avtalet {dateLong(plan.termEnd)}.
              {plan.rolled > 0 && ` Sista dagen för perioden som slutar ${dateLong(state.end)} har redan passerat, så vi har räknat med nästa period.`}
            </p>
          </>
        ) : (
          <>
            <p className="notice-kicker">Säger ni upp i dag slutar avtalet</p>
            <p className="notice-big">{dateLong(plan.termEnd)}</p>
            <p className="small muted">{when}</p>
          </>
        )}
      </div>

      <div className="notice-grid" aria-hidden="true">
        <div className="notice-head">
          <span />
          {LETTERS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        {rows.map((y) => (
          <div key={y} className="notice-row">
            <span className="notice-year">{y}</span>
            {Array.from({ length: 12 }, (_, m) => {
              const k = kind(y * 12 + m);
              return <span key={m} className={`nd nd-${k}`} title={`${MONTHS[m]} ${y}`} />;
            })}
          </div>
        ))}
      </div>

      <ul className="notice-key" aria-label="Teckenförklaring">
        <li>
          <span className="nd nd-now" /> Nu
        </li>
        {state.mode === "year" && (
          <li>
            <span className="nd nd-open" /> Tid att jämföra och välja
          </li>
        )}
        <li>
          <span className="nd nd-deadline" /> {state.mode === "year" ? "Senast uppsägning" : "Uppsägning"}
        </li>
        <li>
          <span className="nd nd-notice" /> Uppsägningstid löper
        </li>
        <li>
          <span className="nd nd-end" /> Avtalet slutar
        </li>
      </ul>

      <p className="fine">
        Räkna med att uppsägningen ska vara framme på datumet. Kontrollera i avtalet hur tiden räknas och hur uppsägningen ska skickas.
      </p>
    </div>
  );
}
