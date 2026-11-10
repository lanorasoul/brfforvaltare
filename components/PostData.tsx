import Link from "next/link";
import { ScrollRegion } from "./ScrollRegion";
import { SourceLink } from "./SourceLink";
import { getProviders, requireSource } from "@/lib/data";
import type { PostDataKey } from "@/lib/posts";
import { CATEGORY, FEATURES, withBlock } from "@/lib/schema";
import type { Category, Extra, Provider, Service } from "@/lib/types";

const SERVICE_TEXT: Record<Service, string> = { yes: "Ja", no: "Nej", unknown: "Anges inte" };

function Table({ caption, head, children, note }: { caption: string; head: string[]; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <figure className="post-figure">
      <ScrollRegion label={caption} className="post-table-wrap" hint>
        <table className="post-table">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </ScrollRegion>
      {note && <figcaption className="fine post-figure-note">{note}</figcaption>}
    </figure>
  );
}

const ProviderLink = ({ p }: { p: Provider }) => (
  <Link className="link" href={`/forvaltare/${p.slug}`}>
    {p.name}
  </Link>
);

/** Kundnöjdhet för de förvaltare i jämförelsen som har ett offentligt NKI-värde. */
function Nki() {
  const rows = getProviders()
    .flatMap((p) => p.facts.ratings.filter((r) => r.kind === "nki").map((r) => ({ p, r, s: requireSource(p, r.source) })))
    .sort((a, b) => (b.r.year ?? 0) - (a.r.year ?? 0) || b.r.value - a.r.value);
  return (
    <Table
      caption="Kundnöjdhet (NKI, 0 till 100) för förvaltare i jämförelsen som har ett offentligt värde"
      head={["Förvaltare", "NKI", "Mätår", "Branschsnitt samma år", "Källa"]}
      note="NKI kommer från Prognoscentrets mätning bland styrelser i bostadsrättsföreningar. Bara värden som har publicerats visas. Att en förvaltare saknas betyder att inget värde är offentligt, inte att kunderna är missnöjda."
    >
      {rows.map(({ p, r, s }) => (
        <tr key={`${p.slug}${r.year}`}>
          <th scope="row">
            <ProviderLink p={p} />
          </th>
          <td className="num">{r.value}</td>
          <td className="num">{r.year}</td>
          <td className="num">{r.average}</td>
          <td>
            <SourceLink url={s.url} checked={s.checked} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

/** Hur många förvaltare som listar varje tjänst, och på vilket sätt. */
function Features({ category }: { category: Category }) {
  const list = withBlock(getProviders(), category);
  const count = (key: string, states: string[]) => list.filter(({ block }) => states.includes(block.features[key] ?? "none")).length;
  return (
    <Table
      caption={`Så står tjänsterna inom ${CATEGORY[category].label.toLowerCase()} på ${list.length} förvaltares webbplatser`}
      head={["Tjänst", "Ingår", "Tillval eller viss nivå", "Nämns utan besked", "Inte listad"]}
      note={
        <>
          Antal förvaltare av {list.length}. Inte listad betyder att tjänsten inte står på sidorna vi läste, inte att förvaltaren saknar den.{" "}
          <Link className="link" href={CATEGORY[category].path}>
            Se vilka förvaltare som listar vad
          </Link>
          .
        </>
      }
    >
      {FEATURES[category].map((f) => (
        <tr key={f.key}>
          <th scope="row">{f.label}</th>
          <td className="num">{count(f.key, ["included"])}</td>
          <td className="num">{count(f.key, ["optional", "level"])}</td>
          <td className="num">{count(f.key, ["listed"])}</td>
          <td className="num">{count(f.key, ["none"])}</td>
        </tr>
      ))}
    </Table>
  );
}

/** Vilka förvaltare som erbjuder ekonomisk förvaltning, teknisk förvaltning och fastighetsskötsel. */
function Services() {
  const providers = getProviders();
  return (
    <Table
      caption={`Vad de ${providers.length} förvaltarna i jämförelsen erbjuder enligt sina egna webbplatser`}
      head={["Förvaltare", "Ekonomisk förvaltning", "Teknisk förvaltning", "Fastighetsskötsel"]}
      note="Anges inte betyder att sidorna vi läste inte säger om tjänsten finns."
    >
      {providers.map((p) => (
        <tr key={p.slug}>
          <th scope="row">
            <ProviderLink p={p} />
          </th>
          <td>{SERVICE_TEXT[p.services.ekonomisk]}</td>
          <td>{SERVICE_TEXT[p.services.teknisk]}</td>
          <td>{SERVICE_TEXT[p.services.fastighetsskotsel]}</td>
        </tr>
      ))}
    </Table>
  );
}

/** Förvaltare som skriver ut uppsägningstiden för sitt eget avtal. */
function Notice() {
  const rows = (["ekonomisk", "teknisk"] as Category[]).flatMap((c) =>
    withBlock(getProviders(), c).flatMap(({ provider: p, block: b }) =>
      b.terms.notice && b.terms.noticeSource ? [{ p, c, text: b.terms.notice, s: requireSource(p, b.terms.noticeSource) }] : [],
    ),
  );
  if (rows.length === 0) return <p>Ingen förvaltare i jämförelsen anger uppsägningstiden för sitt eget avtal på sidorna vi läste.</p>;
  return (
    <Table
      caption="Förvaltare i jämförelsen som anger uppsägningstid för sitt eget avtal"
      head={["Förvaltare", "Gäller", "Vad förvaltaren skriver", "Källa"]}
      note="Övriga förvaltare anger ingen uppsägningstid på sidorna vi läste. Det som gäller för er står i ert avtal."
    >
      {rows.map(({ p, c, text, s }) => (
        <tr key={`${p.slug}${c}`}>
          <th scope="row">
            <ProviderLink p={p} />
          </th>
          <td>{CATEGORY[c].label}</td>
          <td>{text}</td>
          <td>
            <SourceLink url={s.url} checked={s.checked} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

/** Tillägg med utskrivet pris. filter väljer vilka tillägg som ska med. */
function PricedExtras({ categories, filter, caption, empty }: { categories: Category[]; filter: (e: Extra) => boolean; caption: string; empty: string }) {
  const rows = categories.flatMap((c) =>
    withBlock(getProviders(), c).flatMap(({ provider: p, block: b }) =>
      b.extras.filter((e) => e.price && filter(e)).map((e) => ({ p, e, s: requireSource(p, e.source ?? b.pricing.source) })),
    ),
  );
  if (rows.length === 0) return <p>{empty}</p>;
  return (
    <Table caption={caption} head={["Förvaltare", "Tjänst", "Pris enligt förvaltaren", "Källa"]} note="Priserna är förvaltarnas egna uppgifter. Kontrollera alltid vad som gäller i offerten.">
      {rows.map(({ p, e, s }) => (
        <tr key={`${p.slug}${e.label}`}>
          <th scope="row">
            <ProviderLink p={p} />
          </th>
          <td>{e.label}</td>
          <td>{e.price}</td>
          <td>
            <SourceLink url={s.url} checked={s.checked} />
          </td>
        </tr>
      ))}
    </Table>
  );
}

export function PostData({ dataKey }: { dataKey: PostDataKey }) {
  switch (dataKey) {
    case "nki":
      return <Nki />;
    case "features-ekonomisk":
      return <Features category="ekonomisk" />;
    case "features-teknisk":
      return <Features category="teknisk" />;
    case "services":
      return <Services />;
    case "notice":
      return <Notice />;
    case "teknisk-priser":
      return (
        <PricedExtras
          categories={["teknisk"]}
          filter={() => true}
          caption="Priser som förvaltarna skriver ut för tjänster inom teknisk förvaltning"
          empty="Ingen förvaltare i jämförelsen skriver ut ett pris för någon tjänst inom teknisk förvaltning."
        />
      );
    case "underhallsplan-priser":
      return (
        <PricedExtras
          categories={["ekonomisk", "teknisk"]}
          filter={(e) => /underhållsplan/i.test(e.label)}
          caption="Priser för underhållsplan som förvaltarna skriver ut"
          empty="Ingen förvaltare i jämförelsen skriver ut ett pris för underhållsplan."
        />
      );
  }
}
