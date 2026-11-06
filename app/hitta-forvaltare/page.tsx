import type { Metadata } from "next";
import { MatchWizard } from "@/components/MatchWizard";
import { getProviders } from "@/lib/data";
import { currentMode } from "@/lib/launch";
import type { Need } from "@/lib/guide";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Hitta förvaltare för er brf",
  description: "Berätta vad er bostadsrättsförening behöver i tre korta steg, så matchar vi er med förvaltare som passar. Gratis och utan förpliktelser.",
  alternates: { canonical: "/hitta-forvaltare" },
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function HittaForvaltarePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const b = one(sp.behov);
  const behov: Need | null = b === "ekonomisk" || b === "teknisk" || b === "bada" ? b : null;
  const lgh = one(sp.lgh).replace(/\D/g, "").slice(0, 4);
  const count = getProviders().length;

  return (
    <section className="wz">
      <div className="wz-inner">
        <h1 className="wz-h1">Hitta rätt förvaltare för er brf</h1>
        <p className="wz-lead">Tre korta steg. Vi matchar er med förvaltare som passar, bland de {count} vi har granskat. Gratis och utan förpliktelser.</p>
        <MatchWizard issuedAt={Date.now()} mode={currentMode()} initial={{ behov, ort: one(sp.ort).slice(0, 60), lgh }} />
      </div>
    </section>
  );
}
