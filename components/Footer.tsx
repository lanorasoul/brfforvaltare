import Link from "next/link";
import { BrandMark } from "./icons";
import { SITE } from "@/lib/site";
import { dateLong } from "@/lib/format";

const LINKS = [
  { href: "/", label: "Hitta förvaltare" },
  { href: "/forvaltare", label: "Jämför alla" },
  { href: "/byta-forvaltare", label: "Byta förvaltare" },
  { href: "/metod", label: "Så fungerar det" },
  { href: "/for-forvaltare", label: "För förvaltare" },
  { href: "/integritet", label: "Integritet" },
];

export function Footer() {
  return (
    <footer className="foot-min">
      <div className="container foot-min-inner">
        <p className="foot-min-brand">
          <BrandMark size={18} />
          {SITE.name}
        </p>
        <nav aria-label="Sidfot">
          <ul className="foot-min-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="fine foot-min-note">
          Uppgifterna kommer från förvaltarnas egna sidor, Prognoscentret och Reco. Senast kontrollerat {dateLong(SITE.dataCheckedAt)}. Priser och villkor kan ändras, fråga alltid förvaltaren.
          {SITE.operator && ` Drivs av ${SITE.operator.name}.`}
        </p>
      </div>
    </footer>
  );
}
