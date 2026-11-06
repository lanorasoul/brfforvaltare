import Link from "next/link";
import { Matcher } from "@/components/Matcher";
import { getProviders } from "@/lib/data";
import { currentMode } from "@/lib/launch";
import { parseMatch, type MatchProvider } from "@/lib/match";
import { overviewRows } from "@/lib/overview";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const providers = getProviders();
  const overview = overviewRows(providers);
  const rows: MatchProvider[] = providers.map((p, i) => ({
    ...overview[i],
    coverage: { ekonomisk: p.ekonomisk?.coverage ?? null, teknisk: p.teknisk?.coverage ?? null },
    digital: p.ekonomisk?.digital.length ?? 0,
    places: p.facts.offices?.places ?? [],
  }));
  const initial = parseMatch(await searchParams);

  return (
    <section className="mx">
      <div className="mx-inner">
        <h1 className="mx-h1">Hitta rätt förvaltare för er brf</h1>
        <p className="mx-lead">Svara på fyra frågor. Vi matchar er med de förvaltare som passar bäst, bland {providers.length} som vi har granskat.</p>
        <Matcher rows={rows} initial={initial} requestsOpen={currentMode() !== "off"} />
        <p className="mx-trust">
          Gratis för styrelser. Ingen förvaltare betalar för att synas. <Link href="/metod">Så fungerar det</Link> · <Link href="/forvaltare">Jämför alla förvaltare</Link>
        </p>
      </div>
    </section>
  );
}
