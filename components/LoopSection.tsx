"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalIcon, StatusMark } from "./icons";
import { NoticeCalendar, type NoticeState } from "./NoticeCalendar";
import { OfferTemplates } from "./OfferTemplates";
import { dateLong } from "@/lib/format";
import { SWITCH_CHECKLIST } from "@/lib/offer";
import { useToday } from "./useToday";

export interface LoopData {
  today: string;
  defaultEnd: string;
  noticeExample: { provider: string; text: string; url: string; checked: string } | null;
  compare: { slug: string; name: string; value: string; basis: string; vat: string; status: "verified" | "estimated" | "assumed" }[];
  claims: { provider: string; text: string; url: string; checked: string }[];
  compareFor: number;
}

const STAGES = [
  {
    pill: "Avtalet",
    name: "läs avtalet",
    title: "Börja med uppsägningstiden.",
    body: "Den avgör när ni kan byta. Hitta avtalsperiod, uppsägningstid och vad som ingår i priset innan ni pratar med någon ny förvaltare.",
  },
  {
    pill: "Datum",
    name: "räkna ut sista dagen",
    title: "Räkna ut sista dagen.",
    body: "Uppsägningstiden räknas bakåt från avtalets slut. Om avtalet förnyas automatiskt och ni missar datumet är ni bundna en period till. Fyll i ert eget avtal.",
  },
  {
    pill: "Offert",
    name: "be alla om samma sak",
    title: "Be alla om samma sak.",
    body: "Priser går inte att jämföra om förvaltarna räknar olika. Skicka samma frågor till alla, med moms och omfattning utskrivna.",
  },
  {
    pill: "Jämför",
    name: "jämför lika mot lika",
    title: "Jämför lika mot lika.",
    body: "Lägg pris, uppsägningstid, vad som ingår och tillval bredvid varandra. Det som saknas i ett svar är också information.",
  },
  {
    pill: "Byt",
    name: "säg upp och byt",
    title: "Säg upp skriftligt och planera övergången.",
    body: "Spara kvittot på uppsägningen och låt den nya förvaltaren lägga upp en plan för bokföring, avier och bankkontakter innan den gamla tar slut.",
  },
] as const;

const DOTS_PER_STAGE = 10;
const TOTAL_DOTS = STAGES.length * DOTS_PER_STAGE;

export function LoopSection({ data }: { data: LoopData }) {
  const stepsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [lit, setLit] = useState(0);
  const [notice, setNotice] = useState<NoticeState>({ mode: "year", end: data.defaultEnd, months: 3 });
  const today = useToday(data.today);

  useEffect(() => {
    const root = stepsRef.current;
    if (!root) return;
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
    let raf = 0;

    const update = () => {
      raf = 0;
      const anchor = window.innerHeight * 0.5;
      let idx = 0;
      let t = 0;
      if (steps[0].getBoundingClientRect().top <= anchor) {
        for (let i = 0; i < steps.length; i++) {
          const r = steps[i].getBoundingClientRect();
          if (r.top <= anchor) {
            idx = i;
            t = Math.min(1, Math.max(0, (anchor - r.top) / Math.max(1, r.height)));
          }
        }
      }
      const p = (idx + t) / steps.length;
      const n = Math.round(p * TOTAL_DOTS);
      setActive((prev) => (prev === idx ? prev : idx));
      setLit((prev) => (prev === n ? prev : n));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = useCallback((i: number) => {
    const el = document.getElementById(`steg-${i}`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  }, []);

  const pane = (i: number) => {
    switch (i) {
      case 0:
        return <PaneContract example={data.noticeExample} />;
      case 1:
        return <NoticeCalendar state={notice} onChange={setNotice} today={today} />;
      case 2:
        return <PaneOffer />;
      case 3:
        return <PaneCompare rows={data.compare} n={data.compareFor} />;
      default:
        return <PaneSwitch claims={data.claims} />;
    }
  };

  return (
    <section className="loop" id="byta" aria-labelledby="loop-title">
      <div className="container">
        <div className="section-head center">
          <h2 className="h2" id="loop-title">
            Byta förvaltare i fem steg
          </h2>
          <p className="lead">Ett byte styrs av datum. Börja med avtalet och jobba er framåt, ett steg i taget.</p>
        </div>

        <div className="loop-grid">
          <div className="loop-stage">
            <div className="loop-box">
              <div className="loop-top tile">
                <ol className="loop-pills" aria-label="Stegen i ett byte">
                  {STAGES.map((s, i) => (
                    <li key={s.pill}>
                      <button type="button" className="loop-pill" aria-current={active === i ? "step" : undefined} onClick={() => goTo(i)}>
                        <span className="loop-pill-n">{i + 1}</span>
                        <span className="loop-pill-label">{s.pill}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="track" aria-hidden="true">
                  {STAGES.map((s, g) => (
                    <div key={s.pill} className="track-group">
                      {Array.from({ length: DOTS_PER_STAGE }, (_, k) => {
                        const idx = g * DOTS_PER_STAGE + k;
                        const cls = idx < lit ? "track-dot track-dot-on" : idx === lit ? "track-dot track-dot-head" : "track-dot";
                        return <span key={k} className={cls} />;
                      })}
                    </div>
                  ))}
                </div>
                <p className="track-caption small muted">
                  Steg {active + 1} av {STAGES.length}: {STAGES[active].name}
                </p>
              </div>
              <div className="loop-aside-pane tile" key={active}>
                {pane(active)}
              </div>
            </div>
          </div>

          <div className="loop-steps" ref={stepsRef}>
            {STAGES.map((s, i) => (
              <article key={s.pill} id={`steg-${i}`} data-step className="loop-step" data-active={active === i}>
                <h3 className="h3">{s.title}</h3>
                <p className="lead">{s.body}</p>
                {i === 3 && (
                  <p className="loop-link">
                    <Link className="link" href="/jamfor">
                      Jämför förvaltare sida vid sida
                    </Link>
                  </p>
                )}
                {i === 4 && (
                  <p className="loop-link">
                    <Link className="link" href="/byta-forvaltare">
                      Hela guiden för att byta
                    </Link>
                  </p>
                )}
                <div className="loop-inline tile">{pane(i)}</div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- paneler ---------- */

function PaneContract({ example }: { example: LoopData["noticeExample"] }) {
  return (
    <div className="pane">
      <p className="pane-title">Det här ska ni hitta i avtalet</p>
      <ul className="kv-list">
        <li className="kv kv-focus">
          <span>Uppsägningstid</span>
          <span className="kv-flag">Börja här</span>
        </li>
        <li className="kv">
          <span>Avtalsperiod och förnyelse</span>
        </li>
        <li className="kv">
          <span>Hur priset kan ändras</span>
        </li>
        <li className="kv">
          <span>Vad som ingår i priset</span>
        </li>
        <li className="kv">
          <span>Tillval och deras priser</span>
        </li>
      </ul>
      {example && (
        <div className="pane-example">
          <p className="small">
            <strong>Så här skriver {example.provider}:</strong> {example.text}
          </p>
          <p className="fine">
            Vår sammanfattning av förvaltarens villkor.{" "}
            <a className="link" href={example.url} target="_blank" rel="noopener noreferrer">
              Källa, läst {dateLong(example.checked)} <ExternalIcon />
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

function PaneOffer() {
  return (
    <div className="pane">
      <p className="pane-title">Offertmall att skicka till flera förvaltare</p>
      <OfferTemplates rows={13} />
    </div>
  );
}

function PaneCompare({ rows, n }: { rows: LoopData["compare"]; n: number }) {
  return (
    <div className="pane">
      <p className="pane-title">Så ser det ut när ingen har bett om samma sak</p>
      <p className="small muted">Pris för {n} lägenheter per år, så som förvaltarna själva anger det.</p>
      <ul className="cmp-list">
        {rows.map((r) => (
          <li key={r.slug} className="cmp">
            <span className="cmp-name">
              <StatusMark status={r.status} /> {r.name}
            </span>
            <span className="cmp-val">{r.value}</span>
            <span className="cmp-basis small muted">
              {r.basis}, {r.vat}
            </span>
          </li>
        ))}
      </ul>
      <p className="small">Underlag och moms skiljer, så siffrorna går inte att ställa bredvid varandra utan att fråga igen. Därför en gemensam mall.</p>
    </div>
  );
}

function PaneSwitch({ claims }: { claims: LoopData["claims"] }) {
  const items = SWITCH_CHECKLIST;
  return (
    <div className="pane">
      <p className="pane-title">Att bocka av innan den gamla tar slut</p>
      <ul className="check-list">
        {items.map((t) => (
          <li key={t}>
            <span className="check-box" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
      {claims.slice(0, 2).map((c) => (
        <p key={c.text} className="fine pane-claim">
          {c.provider} skriver: {c.text}{" "}
          <a className="link" href={c.url} target="_blank" rel="noopener noreferrer">
            Förvaltarens egen uppgift, läst {dateLong(c.checked)} <ExternalIcon />
          </a>
        </p>
      ))}
    </div>
  );
}
