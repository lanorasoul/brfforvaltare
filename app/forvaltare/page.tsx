import type { Metadata } from "next";
import { PageHead } from "@/components/PageHead";
import { ProviderOverview } from "@/components/ProviderOverview";
import { getProviders } from "@/lib/data";
import { overviewRows } from "@/lib/overview";

export const metadata: Metadata = {
  title: "Jämför förvaltare",
  description: "Förvaltare av bostadsrättsföreningar med pris för er storlek, kundnöjdhet, antal kunder och avtalsvillkor. Varje uppgift har källa.",
  alternates: { canonical: "/forvaltare" },
};

export default function ForvaltarePage() {
  const providers = getProviders();
  return (
    <>
      <PageHead title="Jämför förvaltare" lead={`Alla ${providers.length} förvaltare sida vid sida. Ange antal lägenheter så räknas priset om.`} />
      <section className="page-body">
        <div className="container">
          <ProviderOverview rows={overviewRows(providers)} />
        </div>
      </section>
    </>
  );
}
