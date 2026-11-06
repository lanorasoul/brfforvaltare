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
          <span className="ws-kicker">Innan ni jämför</span>
          <h2 className="h2" id="ws-title">
            Lönar det sig att byta förvaltare?
          </h2>
          <p className="lead">Skillnaden mellan förvaltare är stor, både i hur nöjda kunderna är och i vad de kostar. Här är siffrorna, med källa till var och en.</p>
        </div>

        {/* 1. Stora siffror */}
        <div className="ws-stats">
          <div className="ws-stat">
            <strong className="ws-big">
              {SURVEY.wantToSwitch}
              <span>%</span>
            </strong>
            <p>av föreningarna ska eller funderar på att byta förvaltare när avtalet går ut.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <strong className="ws-big">
              {SURVEY.dissatisfied}
              <span>%</span>
            </strong>
            <p>är tydligt missnöjda med sin förvaltare. Bara hälften är tydligt nöjda.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <strong className="ws-big">
              {SURVEY.lowestNki}
              <span className="ws-big-sep">till</span>
              {NKI_2025.top[0].value}
            </strong>
            <p>Så stor är spridningen i kundnöjdhet (NKI, 0 till 100) mellan förvaltare med minst 20 svar.</p>
            <Src s={SRC.prognos2023} label="Prognoscentret" />
          </div>
        </div>

        <div className="ws-grid">
          {/* 2. NKI-staplar */}
          <figure className="ws-card">
            <figcaption>
              <h3 className="ws-h">Nöjdast kunder 2025</h3>
              <p className="ws-p">Nöjd Kund-Index från Prognoscentrets mätning. Bara förvaltare med publicerat värde visas.</p>
            </figcaption>
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
            <p className="ws-note">
              Värden mellan 65 och 75 är medelgod nöjdhet. <Src s={SRC.prognos2025} />
            </p>
          </figure>

          {/* 3. Arvodets andel */}
          <figure className="ws-card">
            <figcaption>
              <h3 className="ws-h">Arvodet är en liten del av kostnaderna</h3>
              <p className="ws-p">
                En genomsnittlig förening med {BRF_INDEX.lgh} lägenheter kostar ungefär {num(Math.round(yearCost / 1000) * 1000)} kr per år att driva. Ekonomisk förvaltning är{" "}
                {pct(shareMin)} till {pct(shareMax)} procent av det.
              </p>
            </figcaption>
            <div className="ws-share" role="img" aria-label={`Förvaltningsarvodet är ${pct(shareMin)} till ${pct(shareMax)} procent av föreningens kostnader`}>
              <span className="ws-share-rest" />
              <span className="ws-share-fee" style={{ width: `${Math.max(shareMax, 1.5)}%` }} />
            </div>
            <div className="ws-share-legend">
              <span>
                <i className="ws-dot ws-dot-rest" /> El, värme, vatten, räntor, underhåll och annat
              </span>
              <span>
                <i className="ws-dot ws-dot-fee" /> Förvaltningsarvode
              </span>
            </div>
            <p className="ws-p ws-strong">Det som avgör är vad förvaltaren gör med resten. Några exempel som förvaltarna själva ger:</p>
            <ul className="ws-savings">
              {SAVINGS.map((s) => (
                <li key={s.what}>
                  <strong>
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
              Kostnaden är {num(BRF_INDEX.perQuarter)} kr för {BRF_INDEX.quarter}, gånger fyra. <Src s={SRC.brfIndex} label="SBC:s BRF-index" />
            </p>
          </figure>

          {/* 4. Arvodet skiljer också */}
          <figure className="ws-card">
            <figcaption>
              <h3 className="ws-h">Men arvodet skiljer också</h3>
              <p className="ws-p">Publicerade priser för ekonomisk förvaltning, 50 lägenheter, per år.</p>
            </figcaption>
            <div className="ws-fees" role="img" aria-label={fees.map((f) => `${f.name} ${num(f.perYear)} kronor`).join(", ")}>
              {fees.map((f) => (
                <div key={f.name} className="ws-fee">
                  <span className="ws-fee-col" style={{ height: `${(f.perYear / feeMax) * 100}%` }}>
                    <span className="ws-fee-v">
                      {f.approx ? `ca ${num(Math.round(f.perYear / 100) * 100)}` : num(f.perYear)}
                    </span>
                  </span>
                  <a className="ws-fee-name" href={f.url} target="_blank" rel="noopener noreferrer">
                    {f.name}
                  </a>
                </div>
              ))}
            </div>
            <p className="ws-callout">
              <strong>{num(Math.round((feeMax - feeMin) / 100) * 100)} kr</strong> per år i skillnad mellan lägsta och högsta publicerade pris.
            </p>
            <p className="ws-note">Vad som ingår skiljer sig, och de flesta förvaltare lämnar pris bara på offert. Jämför därför alltid offerter på samma underlag.</p>
          </figure>

          {/* 5. Varningstecken */}
          <div className="ws-card">
            <h3 className="ws-h">Tecken på att det är dags</h3>
            <ul className="ws-signs">
              <li>
                <strong>Årsredovisningen blir sen.</strong> Bolagsverket tar ut förseningsavgift från {num(LATE_FEE.first)} kr, upp till {num(LATE_FEE.max)} kr.{" "}
                <Src s={SRC.erfForsening} label="Enligt ERF" />
              </li>
              <li>
                <strong>Svaren dröjer eller saker faller mellan stolarna.</strong> Pålitlighet, att leverera enligt avtal, är det som betyder mest för nöjdheten. <Src s={SRC.bostadsratterna} />
              </li>
              <li>
                <strong>Samma bolag sköter allt, och ni är missnöjda.</strong> Föreningar med samma förvaltare för ekonomisk och teknisk förvaltning gav i snitt NKI {SURVEY.bothSameNki}. <Src s={SRC.prognos2023} />
              </li>
              <li>
                <strong>Ni får inga råd.</strong> En bra förvaltare säger till om lån, avgifter, upphandlingar och underhåll innan det blir bråttom.
              </li>
            </ul>
          </div>
        </div>

        {/* 6. Tidslinje */}
        <div className="ws-time">
          <h3 className="ws-h">Så lång tid tar ett byte</h3>
          <ol className="ws-steps">
            <li>
              <span className="ws-when">Nu</span>
              <strong>Läs avtalet</strong>
              <span>
                Uppsägningstiden är oftast {SWITCH_TIME.noticeMonths[0]} till {SWITCH_TIME.noticeMonths[1]} månader. Missar ni datumet förlängs avtalet ofta {SWITCH_TIME.renewMonths} månader till.
              </span>
            </li>
            <li>
              <span className="ws-when">Cirka {SWITCH_TIME.boardMonths} månader</span>
              <strong>Offerter och beslut</strong>
              <span>Styrelsens aktiva del: be om offerter, jämför, besluta och säg upp skriftligt.</span>
            </li>
            <li>
              <span className="ws-when">
                {SWITCH_TIME.totalMonths[0]} till {SWITCH_TIME.totalMonths[1]} månader
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
          <p>Börja i tid. Vi hjälper er hitta förvaltare som passar, gratis.</p>
          <Link className="btn btn-accent" href="/hitta-forvaltare">
            Få förslag på förvaltare
            <span className="btn-icon">
              <ArrowIcon />
            </span>
          </Link>
          <Link className="btn btn-quiet" href="#forvaltare">
            Jämför själva
          </Link>
        </div>
      </div>
    </section>
  );
}
