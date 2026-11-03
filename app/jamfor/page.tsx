import type { Metadata } from "next";
import { Compare } from "@/components/Compare";
import { PageHead } from "@/components/PageHead";
import { getCompareDetails } from "@/lib/data";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "Jämför förvaltare sida vid sida",
  description:
    "Lägg upp till tre förvaltare bredvid varandra, för ekonomisk eller teknisk förvaltning: pris, villkor, tjänster, var de verkar och vad de berättar öppet.",
  alternates: { canonical: "/jamfor" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Sidan läser valet ur adressen, så en delad länk visar samma jämförelse direkt. Därför renderas den per anrop.
export default async function JamforPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const details = getCompareDetails();

  const category: Category = first(sp.kategori) === "teknisk" ? "teknisk" : "ekonomisk";

  // Utan val i adressen börjar vi med de två första förvaltarna som anger något pris. För teknisk förvaltning
  // finns inga priser, så där väljer vi de två första som beskriver namngivna paket. Det är bara en startpunkt och säger inget om kvalitet.
  const defaults: Record<Category, string[]> = {
    ekonomisk: details.ekonomisk.filter((p) => p.pricing.model !== "on_request").slice(0, 2).map((p) => p.slug),
    teknisk: (details.teknisk.filter((p) => p.levels.length > 0).length >= 2
      ? details.teknisk.filter((p) => p.levels.length > 0)
      : details.teknisk
    )
      .slice(0, 2)
      .map((p) => p.slug),
  };

  const known = new Set(details[category].map((p) => p.slug));
  const raw = first(sp.forvaltare);
  const fromUrl = raw ? [...new Set(raw.split(",").map((s) => s.trim()).filter((s) => known.has(s)))].slice(0, 3) : [];
  const initialSel = raw !== undefined ? fromUrl : defaults[category];

  const lgh = Number(first(sp.lgh));
  const initialN = Number.isInteger(lgh) && lgh >= 3 && lgh <= 500 ? lgh : 50;

  return (
    <>
      <PageHead
        title="Jämför förvaltare"
        lead="Välj ekonomisk eller teknisk förvaltning och upp till tre förvaltare. Pris, villkor, tjänster, var de verkar och vad de berättar öppet läggs bredvid varandra, med källa."
        crumbs={[{ href: "/jamfor", label: "Jämför" }]}
      />
      <div className="page-body">
        <div className="container">
          <Compare details={details} defaults={defaults} initialCategory={category} initialSel={initialSel} initialN={initialN} />
        </div>
      </div>
    </>
  );
}
