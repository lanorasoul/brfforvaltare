import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "./icons";
import { dateLong } from "@/lib/format";
import { SRC, SURVEY, SWITCH_TIME, type Cited } from "@/lib/insights";

function Src({ s, label = "Källa" }: { s: Cited; label?: string }) {
  return (
    <a className="ws-src" href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.title}, läst ${dateLong(s.checked)}`}>
      {label} <ExternalIcon size={10} />
    </a>
  );
}

/** Varför och när det lönar sig att byta förvaltare. Varje siffra länkar till sin källa. */
export function WhySwitch() {
  return (
    <section className="ws" aria-labelledby="ws-title">
      <div className="container">
        <div className="ws-head">
          <span className="mono-label">Innan ni jämför</span>
          <h2 className="h2" id="ws-title">
            Lönar det sig att <span className="text-accent">byta förvaltare?</span>
          </h2>
          <p className="lead">Många styrelser är missnöjda med sin förvaltare, och skillnaden mellan förvaltarna är stor. Här är siffrorna, med källa till var och en.</p>
        </div>

        {/* 1. Stora siffror */}
        <div className="ws-stats">
          <div className="ws-stat">
            <span className="mono-label">Vill byta</span>
            <strong className="ws-big bignum">
              {SURVEY.wantToSwitch}
              <span>%</span>
            </strong>
            <p>av föreningarna ska eller funderar på att byta förvaltare när avtalet går ut.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <span className="mono-label">Missnöjda</span>
            <strong className="ws-big bignum">
              {SURVEY.dissatisfied}
              <span>%</span>
            </strong>
            <p>är tydligt missnöjda med sin förvaltare. Bara hälften är tydligt nöjda.</p>
            <Src s={SRC.bostadsratterna} label="Prognoscentret via Bostadsrätterna" />
          </div>
          <div className="ws-stat">
            <span className="mono-label">Spridning i NKI</span>
            <strong className="ws-big bignum">
              {SURVEY.lowestNki}
              <span className="ws-big-sep">till</span>
              {SURVEY.highestNki}
            </strong>
            <p>Så stor är skillnaden i kundnöjdhet (0 till 100) mellan förvaltare med minst 20 svar.</p>
            <Src s={SRC.prognos2023} label="Prognoscentret 2023" />
          </div>
        </div>

        {/* 2. Tidslinje */}
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
