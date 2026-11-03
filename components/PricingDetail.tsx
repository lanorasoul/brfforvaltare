import { StatusMark, STATUS_LABEL } from "./icons";
import { ScrollRegion } from "./ScrollRegion";
import { SourceLink } from "./SourceLink";
import { bandsOf } from "@/lib/bands";
import { requireSource } from "@/lib/data";
import { dateLong, kr, num } from "@/lib/format";
import { VAT_TEXT } from "@/lib/price-label";
import type { Pricing, Provider } from "@/lib/types";

function perLghRange(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo === hi ? num(lo) : `${num(lo)} till ${num(hi)}`;
}

/** Hur en förvaltare anger pris för en del av förvaltningen: prislista, exempel, tumregel eller ingenting. */
export function PricingDetail({ provider, pricing: pr }: { provider: Provider; pricing: Pricing }) {
  const src = requireSource(provider, pr.source);

  if (pr.model === "list") {
    const bands = bandsOf(pr.anchors);
    return (
      <>
        <p className="small muted psec-meta">
          <StatusMark status={pr.status} />
          <span>
            {STATUS_LABEL[pr.status]}. Prislista per föreningsstorlek, {VAT_TEXT[pr.vat]}. Priserna gäller per {dateLong(pr.priceDate)}.
          </span>
        </p>
        <ScrollRegion label="Prislista per föreningsstorlek" className="dtable-wrap">
          <table className="dtable">
            <caption className="sr-only">Prislista per föreningsstorlek</caption>
            <thead>
              <tr>
                <th scope="col">Antal lägenheter</th>
                <th scope="col" className="dtable-num">
                  Kr per år
                </th>
                <th scope="col" className="dtable-num">
                  Kr per lägenhet och år
                </th>
              </tr>
            </thead>
            <tbody>
              {bands
                ? bands.map((b) => (
                    <tr key={b.from.lgh}>
                      <th scope="row">
                        {b.from.lgh} till {b.to.lgh}
                      </th>
                      <td className="dtable-num">
                        {num(b.from.perYear)} till {num(b.to.perYear)}
                      </td>
                      <td className="dtable-num">{perLghRange(Math.floor(b.from.perYear / b.from.lgh), Math.floor(b.to.perYear / b.to.lgh))}</td>
                    </tr>
                  ))
                : [...pr.anchors]
                    .sort((a, b) => a.lgh - b.lgh)
                    .map((a) => (
                      <tr key={a.lgh}>
                        <th scope="row">{a.lgh}</th>
                        <td className="dtable-num">{num(a.perYear)}</td>
                        <td className="dtable-num">{num(Math.floor(a.perYear / a.lgh))}</td>
                      </tr>
                    ))}
            </tbody>
          </table>
        </ScrollRegion>
        <ul className="psec-notes small">
          {pr.openFrom && <li>Över {pr.openFrom.lgh} lägenheter anger förvaltaren ett från-pris på {kr(pr.openFrom.perYear)} per år.</li>}
          {pr.setupFee && <li>{pr.setupFee}</li>}
          {(pr.notes ?? []).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="fine psec-src">
          <SourceLink url={src.url} checked={src.checked} />
          {src.pageDate ? <>. Sidan anger: {src.pageDate}.</> : null}
        </p>
      </>
    );
  }

  if (pr.model === "examples") {
    const ex = [...pr.examples].sort((a, b) => a.lgh - b.lgh);
    return (
      <>
        <p className="small muted psec-meta">
          <StatusMark status={pr.status} />
          <span>
            {STATUS_LABEL[pr.status]}. Prisexempel från förvaltaren, {VAT_TEXT[pr.vat]}.{pr.disclaimer ? ` ${pr.disclaimer}` : ""}
          </span>
        </p>
        <ScrollRegion label="Prisexempel per föreningsstorlek" className="dtable-wrap">
          <table className="dtable">
            <caption className="sr-only">Prisexempel per föreningsstorlek</caption>
            <thead>
              <tr>
                <th scope="col">Antal lägenheter</th>
                <th scope="col" className="dtable-num">
                  Kr per år
                </th>
                <th scope="col" className="dtable-num">
                  Kr per lägenhet och år
                </th>
              </tr>
            </thead>
            <tbody>
              {typeof pr.fromPerYear === "number" && (
                <tr>
                  <th scope="row">Lägsta pris</th>
                  <td className="dtable-num">från {num(pr.fromPerYear)}</td>
                  <td className="dtable-num dtable-muted">anges inte</td>
                </tr>
              )}
              {ex.map((e) => (
                <tr key={e.lgh}>
                  <th scope="row">{e.lgh}</th>
                  <td className="dtable-num">{num(e.perYear)}</td>
                  <td className="dtable-num">{num(e.perYear / e.lgh)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <ul className="psec-notes small">
          {(pr.notes ?? []).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="fine psec-src">
          <SourceLink url={src.url} checked={src.checked} />
        </p>
      </>
    );
  }

  if (pr.model === "rule_of_thumb") {
    return (
      <>
        <p className="small muted psec-meta">
          <StatusMark status={pr.status} />
          <span>{STATUS_LABEL[pr.status]}. Förvaltaren anger en tumregel, inte en prislista. Tabellen nedan är vår uträkning av tumregeln.</span>
        </p>
        <blockquote className="psec-quote">{pr.text}</blockquote>
        <ScrollRegion label="Vår uträkning av tumregeln" className="dtable-wrap">
          <table className="dtable">
            <caption className="sr-only">Vår uträkning av tumregeln</caption>
            <thead>
              <tr>
                <th scope="col">Antal lägenheter</th>
                <th scope="col" className="dtable-num">
                  Kr per år, antagande
                </th>
              </tr>
            </thead>
            <tbody>
              {[10, 20, 50, 100].map((n) => (
                <tr key={n}>
                  <th scope="row">{n}</th>
                  <td className="dtable-num">ca {num(pr.perLgh * n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
        <ul className="psec-notes small">
          {(pr.notes ?? []).map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <p className="fine psec-src">
          <SourceLink url={src.url} checked={src.checked} />
        </p>
      </>
    );
  }

  return (
    <>
      <p className="small muted psec-meta">
        <StatusMark status="none" />
        <span>Inget pris angivet. Förvaltaren ber om en förfrågan.</span>
      </p>
      <p className="psec-text">{pr.text}</p>
      <ul className="psec-notes small">
        {(pr.notes ?? []).map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
      <p className="fine psec-src">
        <SourceLink url={src.url} checked={src.checked} />
      </p>
    </>
  );
}
