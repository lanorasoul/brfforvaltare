import type { Metadata } from "next";
import { CategoryView } from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "Ekonomisk förvaltning: jämför förvaltare",
  description:
    "Jämför förvaltare av ekonomisk förvaltning för bostadsrättsföreningar: pris, uppsägningstid, vilka tjänster som ingår, var de verkar och vad de berättar öppet.",
  alternates: { canonical: "/ekonomisk-forvaltning" },
};

export default function Page() {
  return <CategoryView category="ekonomisk" />;
}
