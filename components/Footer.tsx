import Link from "next/link";
import { BrandMark } from "./icons";
import { SITE } from "@/lib/site";
import { dateLong } from "@/lib/format";

export function Footer() {
  return (
    <footer className="foot band">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <p className="foot-name">
              <BrandMark size={22} />
              {SITE.name}
            </p>
            <p className="fine">Uppgifterna hämtas från förvaltarnas egna webbplatser, Prognoscentret och Reco. Senast kontrollerat {dateLong(SITE.dataCheckedAt)}.</p>
            {SITE.operator && <p className="fine">Drivs av {SITE.operator.name}.</p>}
          </div>
          <nav className="foot-col" aria-label="Sajten">
            <p className="foot-head">Sajten</p>
            <ul>
              <li>
                <Link href="/hitta-forvaltare">Hitta förvaltare</Link>
              </li>
              <li>
                <Link href="/ekonomisk-forvaltning">Ekonomisk förvaltning</Link>
              </li>
              <li>
                <Link href="/teknisk-forvaltning">Teknisk förvaltning</Link>
              </li>
              <li>
                <Link href="/forvaltare">Förvaltare</Link>
              </li>
              <li>
                <Link href="/prisguide">Prisguide</Link>
              </li>
              <li>
                <Link href="/byta-forvaltare">Byta förvaltare</Link>
              </li>
              <li>
                <Link href="/jamfor">Jämför sida vid sida</Link>
              </li>
              <li>
                <Link href="/kunskap">Kunskap</Link>
              </li>
            </ul>
          </nav>
          <nav className="foot-col" aria-label="Så arbetar vi">
            <p className="foot-head">Så arbetar vi</p>
            <ul>
              <li>
                <Link href="/metod">Metod och källor</Link>
              </li>
              <li>
                <Link href="/metod#annonser">Annonser och oberoende</Link>
              </li>
              <li>
                <Link href="/metod#finansiering">Så finansieras sajten</Link>
              </li>
              <li>
                <Link href="/metod#rattelser">Rättelser</Link>
              </li>
              <li>
                <Link href="/for-forvaltare">För förvaltare</Link>
              </li>
              <li>
                <Link href="/integritet">Integritet</Link>
              </li>
            </ul>
          </nav>
        </div>

        <p className="foot-legal fine">
          Priser och villkor kan ändras, fråga alltid förvaltaren. Sajten ger ingen juridisk eller ekonomisk rådgivning.
        </p>
      </div>
    </footer>
  );
}
