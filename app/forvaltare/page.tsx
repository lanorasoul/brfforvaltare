import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/PageHead";
import { ProviderListLd } from "@/components/ProviderListLd";
import { ProviderLogo } from "@/components/ProviderLogo";
import { ArrowIcon, CheckIcon } from "@/components/icons";
import { getProviders } from "@/lib/data";
import { priceRow } from "@/lib/price";
import { priceLabel, VAT_TEXT } from "@/lib/price-label";
import { CATEGORIES, DISCLOSURE_KEYS } from "@/lib/schema";
import type { Provider, Service } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: `Brf förvaltare: ${getProviders().length} förvaltare jämförda med pris och NKI` },
  description:
    "Alla brf förvaltare i jämförelsen: HSB, Riksbyggen, SBC, Nabo med flera. Pris, kundnöjdhet (NKI) och tjänster för ekonomisk och teknisk förvaltning.",
  alternates: { canonical: "/forvaltare" },
};

const SERVICE_LABEL = { ekonomisk: "Ekonomisk förvaltning", teknisk: "Teknisk förvaltning", fastighetsskotsel: "Fastighetsskötsel" } as const;
const SERVICE_STATE: Record<Service, string> = { yes: "ja", no: "nej", unknown: "anges inte" };

function firstSentence(s: string): string {
  const i = s.search(/\.(\s|$)/);
  return i === -1 ? s : s.slice(0, i + 1);
}

function ProviderCard({ p }: { p: Provider }) {
  const eko = p.ekonomisk;
  const price = eko ? priceRow({ slug: p.slug, name: p.name, pricing: eko.pricing }, 50) : null;
  const nki = p.facts.ratings.filter((r) => r.kind === "nki").sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0];
  const open = CATEGORIES.flatMap((c) => {
    const b = p[c];
    return b ? DISCLOSURE_KEYS[c].map((k) => b.disclosure[k.key]) : [];
  });
  const published = open.filter((v) => v === "published").length;

  return (
    <li className="pc">
      <div className="pc-head">
        <Link className="pc-id logo-link" href={`/forvaltare/${p.slug}`}>
          <ProviderLogo name={p.name} logo={p.logo ? { file: p.logo.file, ratio: p.logo.width / p.logo.height } : null} size="sm" />
          <span className="pc-name">{p.name}</span>
        </Link>
        {p.region && <span className="pc-pill">{p.region}</span>}
      </div>

      <p className="pl-summary">{firstSentence(p.summary)}</p>

      <ul className="pl-services" aria-label="Erbjuder">
        {(Object.keys(SERVICE_LABEL) as (keyof typeof SERVICE_LABEL)[]).map((k) => (
          <li key={k} data-state={p.services[k]}>
            <span className="pl-dot" aria-hidden="true">
              {p.services[k] === "yes" && <CheckIcon size={11} />}
            </span>
            {SERVICE_LABEL[k]}
            <span className="sr-only">: {SERVICE_STATE[p.services[k]]}</span>
          </li>
        ))}
      </ul>

      <div className="pc-price">
        {price && price.perYear !== null ? (
          <>
            <strong>{priceLabel(price, price.perYear, "year")}</strong>
            <span>Ekonomisk förvaltning per år, 50 lgh. {price.basis}, {VAT_TEXT[price.vat]}</span>
          </>
        ) : (
          <>
            <strong className="pc-muted">{eko ? "Pris på offert" : "Ingen ekonomisk förvaltning"}</strong>
            <span>{eko ? "Inget pris för ekonomisk förvaltning på sidan" : "Enligt sidorna vi läste"}</span>
          </>
        )}
      </div>

      <div className="pc-nki">
        <span className="pc-nki-k">Kundnöjdhet</span>
        {nki ? (
          <span className="pc-nki-v">
            NKI {nki.value}
            {nki.average != null && <span className={nki.value >= nki.average ? "pc-up" : "pc-down"}>{nki.value >= nki.average ? "över" : "under"} snittet {nki.average}</span>}
          </span>
        ) : (
          <span className="pc-muted">Inte mätt</span>
        )}
      </div>

      {open.length > 0 && (
        <div className="pc-meter">
          <div className="pc-meter-top">
            <span>Berättar öppet</span>
            <strong>
              {published} av {open.length}
            </strong>
          </div>
          <span className="pc-meter-track" aria-hidden="true">
            <span className="pc-meter-fill" style={{ width: `${(published / open.length) * 100}%` }} />
          </span>
        </div>
      )}

      <Link className="pc-go" href={`/forvaltare/${p.slug}`}>
        Se profil <ArrowIcon size={12} />
      </Link>
    </li>
  );
}

export default function ForvaltarePage() {
  const providers = getProviders();
  return (
    <>
      <ProviderListLd name="Förvaltare av bostadsrättsföreningar" items={providers} />
      <PageHead
        title="Förvaltare för brf"
        lead={`${providers.length} förvaltare av bostadsrättsföreningar, sorterade efter namn. Allt är hämtat från förvaltarnas egna webbplatser. Ingen har betalat för att synas.`}
      />

      <section className="page-body">
        <div className="container">
          <p className="small muted list-note">
            Priset gäller ekonomisk förvaltning för 50 lägenheter. Räkna för er storlek och jämför tjänsterna på <Link className="link" href="/ekonomisk-forvaltning">ekonomisk</Link> eller{" "}
            <Link className="link" href="/teknisk-forvaltning">teknisk</Link> förvaltning.
          </p>

          <ul className="pl-grid">
            {providers.map((p) => (
              <ProviderCard key={p.slug} p={p} />
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
