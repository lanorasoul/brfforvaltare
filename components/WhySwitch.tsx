import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "./icons";
import { dateLong, num } from "@/lib/format";
import { BRF_INDEX, LATE_FEE, NKI_2025, SAVINGS, SRC, SURVEY, SWITCH_TIME, type Cited } from "@/lib/insights";

export interface FeePoint {
  name: string;
  perYear: number;
  approx: boolean;
  url: string;
}

function Src({ s, label = "Källa" }: { s: Cited; label?: string }) {
  return (
    <a className="ws-src" href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.title}, läst ${dateLong(s.checked)}`}>
      {label} <ExternalIcon size={10} />
    </a>
  );
}

/** Varför och när det lönar sig att byta förvaltare. Allt i diagrammen kommer från källorna som länkas vid varje del. */
export function WhySwitch({ fees }: { fees: FeePoint[] }) {
  const yearCost = BRF_INDEX.perQuarter * 4;
  const feeMin = Math.min(...fees.map((f) => f.perYear));
  const feeMax = Math.max(...fees.map((f) => f.perYear));
  const shareMin = (feeMin / yearCost) * 100;
  const shareMax = (feeMax / yearCost) * 100;
  const pct = (v: number) => v.toLocaleString("sv-SE", { maximumFractionDigits: 1 });
  const nkiRows = [...NKI_2025.top, { name: "Branschsnitt", value: NKI_2025.average }];

  return (
    <section className="ws" aria-labelledby="ws-title">
      <div className="container">
        <div className="ws-head">
          <span className="mono-label">Innan ni jämför</span>
          <h2 className="h2" id="ws-title">
            Lönar det sig att <span className="text-accent">byta förvaltare?</span>
          </h2>
          <p className="lead">Skillnaden mellan förvaltare är stor, både i hur nöjda kunderna är och i vad de kostar. Här är siffrorna, med källa till var och en.</p>
        </div>

        {/* 1. Stora siffror */}
        <div className="ws-stats">
          <div className="ws-stat">
            <span className="mono-label">Vill byta</span>
            <strong className="ws-big dotnum">
              {SURVEY.wantToSwitch}
              <span>%</span>
            </strong>
            <p>av föreningarna ska eller funderar på att byta förvaltare när avtalet går ut.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <span className="mono-label">Missnöjda</span>
            <strong className="ws-big dotnum">
              {SURVEY.dissatisfied}
              <span>%</span>
            </strong>
            <p>är tydligt missnöjda med sin förvaltare. Bara hälften är tydligt nöjda.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <span className="mono-label">Spridning i NKI</span>
            <strong className="ws-big dotnum">
              {SURVEY.lowestNki}
              <span className="ws-big-sep">till</span>
              {NKI_2025.top[0].value}
            </strong>
            <p>Så stor är skillnaden i kundnöjdhet (0 till 100) mellan förvaltare med minst 20 svar.</p>
            <Src s={SRC.prognos2023} label="Prognoscentret" />
          </div>
        </div>

        <div className="ws-grid">
          {/* 2. NKI-staplar */}
          <figure className="ws-card">
            <figcaption>
              <span className="mono-label">Kundnöjdhet 2025</span>
              <h3 className="ws-h">Nöjdast kunder</h3>
              <p className="ws-p">Nöjd Kund-Index från Prognoscentrets mätning. Bara förvaltare med publicerat värde visas.</p>
            </figcaption>
            <div className="ws-tile">
              <div className="ws-bars" role="img" aria-label={nkiRows.map((r) => `${r.name} ${r.value}`).join(", ")}>
                {nkiRows.map((r) => (
                  <div key={r.name} className={r.name === "Branschsnitt" ? "ws-bar is-avg" : "ws-bar"}>
                    <span className="ws-bar-label">{r.name}</span>
                    <span className="ws-bar-track">
                      <span className="ws-bar-fill" style={{ width: `${r.value}%` }} />
                    </span>
                    <span className="ws-bar-value">{r.value}</span>
                  </div>
                ))}
                <div className="ws-scale" aria-hidden="true">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            <p className="ws-note">
              Värden mellan 65 och 75 är medelgod nöjdhet. <Src s={SRC.prognos2025} />
            </p>
          </figure>

          {/* 3. Arvodets andel */}
          <figure className="ws-card">
            <figcaption>
              <span className="mono-label">Föreningens kostnader</span>
              <h3 className="ws-h">Arvodet är en liten del</h3>
              <p className="ws-p">
                En genomsnittlig förening med {BRF_INDEX.lgh} lägenheter kostar ungefär {num(Math.round(yearCost / 1000) * 1000)} kr per år att driva. Ekonomisk förvaltning är{" "}
                {pct(shareMin)} till {pct(shareMax)} procent av det.
              </p>
            </figcaption>
            <div className="ws-tile">
              <div className="ws-share" role="img" aria-label={`Förvaltningsarvodet är ${pct(shareMin)} till ${pct(shareMax)} procent av föreningens kostnader`}>
                <span className="ws-share-rest" />
                <span className="ws-share-fee" style={{ width: `${Math.max(shareMax, 1.5)}%` }} />
              </div>
              <div className="ws-share-legend">
                <span>
                  <i className="ws-dot ws-dot-rest" /> El, värme, vatten, räntor, underhåll med mera
                </span>
                <span>
                  <i className="ws-dot ws-dot-fee" /> Förvaltningsarvode
                </span>
              </div>
            </div>
            <p className="ws-p ws-strong">Det som avgör är vad förvaltaren gör med resten. Förvaltarnas egna exempel:</p>
            <ul className="ws-savings">
              {SAVINGS.map((s) => (
                <li key={s.what} className="ws-tile">
                  <strong className="dotnum">
                    {s.value}
                    <span>%</span>
                  </strong>
                  <span>
                    {s.what}
                    <small>
                      {s.who}. <Src s={s.src} />
                    </small>
                  </span>
                </li>
              ))}
            </ul>
            <p className="ws-note">
              Årskostnaden är {num(BRF_INDEX.perQuarter)} kr för {BRF_INDEX.quarter}, gånger fyra. <Src s={SRC.brfIndex} label="SBC:s BRF-index" />
            </p>
          </figure>

          {/* 4. Arvodet skiljer också */}
          <figure className="ws-card">
            <figcaption>
              <span className="mono-label">Publicerade priser · 50 lägenheter</span>
              <h3 className="ws-h">Men arvodet skiljer också</h3>
              <p className="ws-p">Pris per år för ekonomisk förvaltning, från förvaltarnas egna sidor.</p>
            </figcaption>
            <div className="ws-tile ws-fees-tile">
              <div className="ws-fees" role="img" aria-label={fees.map((f) => `${f.name} ${num(f.perYear)} kronor`).join(", ")}>
                {fees.map((f, i) => (
                  <div key={f.name} className={i === 0 ? "ws-fee is-low" : "ws-fee"}>
                    <span className="ws-fee-col" style={{ height: `${(f.perYear / feeMax) * 100}%` }}>
                      <span className="ws-fee-v">{f.approx ? `ca ${num(Math.round(f.perYear / 100) * 100)}` : num(f.perYear)}</span>
                    </span>
                    <a className="ws-fee-name" href={f.url} target="_blank" rel="noopener noreferrer">
                      {f.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <p className="ws-callout">
              <strong>{num(Math.round((feeMax - feeMin) / 100) * 100)} kr</strong> per år mellan lägsta och högsta publicerade pris.
            </p>
            <p className="ws-note">Vad som ingår skiljer sig, och de flesta lämnar pris bara på offert. Jämför därför offerter på samma underlag.</p>
          </figure>

          {/* 5. Varningstecken */}
          <div className="ws-card">
            <span className="mono-label">Checklista</span>
            <h3 className="ws-h">Tecken på att det är dags</h3>
            <ul className="ws-signs">
              <li className="ws-tile">
                <strong>Årsredovisningen blir sen.</strong> Bolagsverket tar ut förseningsavgift från {num(LATE_FEE.first)} kr, upp till {num(LATE_FEE.max)} kr.{" "}
                <Src s={SRC.erfForsening} label="Enligt ERF" />
              </li>
              <li className="ws-tile">
                <strong>Svaren dröjer.</strong> Pålitlighet, att leverera enligt avtal, betyder mest för nöjdheten. <Src s={SRC.bostadsratterna} />
              </li>
              <li className="ws-tile">
                <strong>Samma bolag sköter allt, och ni är missnöjda.</strong> Sådana föreningar gav i snitt NKI {SURVEY.bothSameNki}. <Src s={SRC.prognos2023} />
              </li>
              <li className="ws-tile">
                <strong>Ni får inga råd.</strong> En bra förvaltare säger till om lån, avgifter och underhåll innan det blir bråttom.
              </li>
            </ul>
          </div>
        </div>

        {/* 6. Tidslinje */}
        <div className="ws-time">
          <div className="ws-time-head">
            <span className="mono-label">Från beslut till ny förvaltare</span>
            <h3 className="ws-h">Så lång tid tar ett byte</h3>
          </div>
          <ol className="ws-steps">
            <li className="is-now">
              <span className="ws-pill">
                <i /> Nu
              </span>
              <strong>Läs avtalet</strong>
              <span>
                Uppsägningstiden är oftast {SWITCH_TIME.noticeMonths[0]} till {SWITCH_TIME.noticeMonths[1]} månader. Missar ni datumet förlängs avtalet ofta {SWITCH_TIME.renewMonths} månader till.
              </span>
            </li>
            <li>
              <span className="ws-pill">
                <i /> Cirka {SWITCH_TIME.boardMonths} månader
              </span>
              <strong>Offerter och beslut</strong>
              <span>Styrelsens aktiva del: be om offerter, jämför, besluta och säg upp skriftligt.</span>
            </li>
            <li className="is-done">
              <span className="ws-pill">
                <i /> {SWITCH_TIME.totalMonths[0]} till {SWITCH_TIME.totalMonths[1]} månader
              </span>
              <strong>Ny förvaltare tar över</strong>
              <span>Den nya förvaltaren hämtar underlag från den gamla. Ni behöver inte göra mycket mer.</span>
            </li>
          </ol>
          <p className="ws-note">
            Tiderna är Nabos uppgifter. <Src s={SRC.naboByte} />
          </p>
        </div>

        <div className="ws-cta">
          <h3 className="h3">
            Börja i tid. <span className="text-accent">Vi hjälper er.</span>
          </h3>
          <p className="lead">Berätta vad föreningen behöver så matchar vi er med förvaltare som passar. Gratis och utan förpliktelser.</p>
          <div className="hero-actions">
            <Link className="btn btn-accent btn-xl" href="/hitta-forvaltare">
              Få förslag på förvaltare
              <span className="btn-icon">
                <ArrowIcon />
              </span>
            </Link>
            <Link className="btn btn-quiet btn-xl" href="#forvaltare">
              Jämför själva
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
