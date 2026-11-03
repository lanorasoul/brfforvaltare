import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { PresenceMark, PRESENCE_LABEL } from "@/components/icons";
import { SourceLink } from "@/components/SourceLink";
import { getProviders, requireSource } from "@/lib/data";
import { dateLong } from "@/lib/format";
import { priceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { CATEGORIES, CATEGORY, DISCLOSURE_KEYS } from "@/lib/schema";
import { HSB_REGIONALS_TOTAL, isHsb } from "@/lib/site";
import type { Category, Provider, Service } from "@/lib/types";

export const metadata: Metadata = {
  title: "Förvaltare",
  description:
    "Förvaltare av bostadsrättsföreningar, för både ekonomisk och teknisk förvaltning, med pris, uppsägningstid och vad som ingår, hämtat från deras egna webbplatser.",
  alternates: { canonical: "/forvaltare" },
};

const SERVICE_LABEL = { ekonomisk: "Ekonomisk förvaltning", teknisk: "Teknisk förvaltning", fastighetsskotsel: "Fastighetsskötsel" } as const;
const SERVICE_STATE: Record<Service, string> = { yes: "ja", no: "nej", unknown: "anges inte" };

function firstSentence(s: string): string {
  const i = s.search(/\.(\s|$)/);
  return i === -1 ? s : s.slice(0, i + 1);
}

function CategoryFact({ p, category }: { p: Provider; category: Category }) {
  const b = p[category];
  const label = CATEGORY[category].label;
  if (!b) {
    return (
      <div className="prov-fact">
        <dt className="prov-fact-label">{label}</dt>
        <dd className="prov-fact-value">
          <strong className="prov-big prov-none">{p.services[category] === "no" ? "Erbjuds inte" : "Ej funnet"}</strong>
        </dd>
      </div>
    );
  }
  const r = priceRow({ slug: p.slug, name: p.name, pricing: b.pricing }, 50);
  return (
    <div className="prov-fact">
      <dt className="prov-fact-label">{label}</dt>
      <dd className="prov-fact-value">
        {r.perYear !== null ? (
          <>
            <strong className="prov-big">{priceLabel(r, r.perYear, "year")} per år</strong>
            <span className="prov-sub">
              {r.basis}, {VAT_TEXT[r.vat]}, 50 lägenheter
            </span>
          </>
        ) : (
          <strong className="prov-big prov-none">Pris på förfrågan</strong>
        )}
      </dd>
    </div>
  );
}

function ProviderTile({ p }: { p: Provider }) {
  return (
    <li className="prov tile">
      <div className="prov-main">
        <h3 className="h4 prov-title">
          <Link className="prov-link" href={`/forvaltare/${p.slug}`}>
            {p.name}
          </Link>
          {p.region && <span className="pill prov-region">{p.region}</span>}
        </h3>
        <p className="small muted prov-summary">{p.summary}</p>
        {p.group && !isHsb(p) && <p className="small prov-group">{p.group.text}</p>}
        <ul className="prov-services">
          {(Object.keys(SERVICE_LABEL) as (keyof typeof SERVICE_LABEL)[]).map((k) => (
            <li key={k} className="prov-service" data-state={p.services[k]}>
              {SERVICE_LABEL[k]}: {SERVICE_STATE[p.services[k]]}
            </li>
          ))}
        </ul>
      </div>

      <dl className="prov-facts">
        {CATEGORIES.map((c) => (
          <CategoryFact key={c} p={p} category={c} />
        ))}
        <div className="prov-fact">
          <dt className="prov-fact-label">Kunder</dt>
          <dd className="prov-fact-value">
            {p.customers ? <span>{firstSentence(p.customers.text)}</span> : <strong className="prov-big prov-none">Ej funnet</strong>}
          </dd>
        </div>
      </dl>

      <div className="prov-side">
        <div className="prov-open">
          <p className="fine">Berättar öppet</p>
          {CATEGORIES.map((c) => {
            const b = p[c];
            if (!b) return null;
            return (
              <div key={c} className="prov-openrow">
                <span className="fine">{CATEGORY[c].short}</span>
                <ul className="prov-marks" aria-label={`Vad ${p.name} berättar öppet om ${CATEGORY[c].label.toLowerCase()}`}>
                  {DISCLOSURE_KEYS[c].map((k) => (
                    <li key={k.key} className="prov-mark" data-presence={b.disclosure[k.key]} title={`${k.label}: ${PRESENCE_LABEL[b.disclosure[k.key]]}`}>
                      <PresenceMark presence={b.disclosure[k.key]} size={18} />
                      <span className="sr-only">
                        {k.label}: {PRESENCE_LABEL[b.disclosure[k.key]]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="fine">Läst {dateLong(p.checked)}</p>
        <Link className="btn btn-quiet prov-btn" href={`/forvaltare/${p.slug}`}>
          Se profil
        </Link>
      </div>
    </li>
  );
}

export default function ForvaltarePage() {
  const providers = getProviders();
  const hsb = providers.filter(isHsb);
  const others = providers.filter((p) => !isHsb(p));
  const hsbSource = hsb.length > 0 ? requireSource(hsb[0], "g0") : null;
  const hsbGroup = hsb[0]?.group?.text ?? "";

  return (
    <>
      <PageHead
        title="Förvaltare"
        lead={`${providers.length} förvaltare av bostadsrättsföreningar, sorterade efter namn. Allt är hämtat från förvaltarnas egna webbplatser. Ingen har betalat för att synas.`}
      />

      <section className="page-body">
        <div className="container">
          <p className="small muted list-note">
            Priset gäller 50 lägenheter. Räkna för er egen storlek i <Link className="link" href="/#rakna">prisräknaren</Link>. De små märkena visar vad förvaltaren berättar öppet: sex uppgifter för
            ekonomisk förvaltning och sex för teknisk. Jämför alla på <Link className="link" href="/ekonomisk-forvaltning">ekonomisk</Link> eller <Link className="link" href="/teknisk-forvaltning">teknisk</Link> förvaltning.
          </p>

          <h2 className="h3 list-head">Egna organisationer</h2>
          <ul className="prov-list">
            {others.map((p) => (
              <ProviderTile key={p.slug} p={p} />
            ))}
          </ul>

          <h2 className="h3 list-head list-head-gap">HSB:s regionala föreningar</h2>
          <p className="small muted list-note">
            {hsbGroup} Vi har läst {hsb.length} av {HSB_REGIONALS_TOTAL}. De har egna tjänster, avtal och webbplatser, så två HSB-föreningar kan skilja sig åt.{" "}
            {hsbSource && <SourceLink url={hsbSource.url} checked={hsbSource.checked} />}
          </p>
          <ul className="prov-list">
            {hsb.map((p) => (
              <ProviderTile key={p.slug} p={p} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
