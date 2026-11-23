import type { Metadata } from "next";
import { CategoryView } from "@/components/CategoryView";

export const metadata: Metadata = {
  title: { absolute: "Teknisk förvaltning brf: jämför förvaltare och tjänster" },
  description:
    "Jämför förvaltare av teknisk förvaltning för bostadsrättsföreningar: paket och nivåer, underhållsplan, besiktningar, felanmälan, var de verkar och vad de berättar öppet.",
  alternates: { canonical: "/teknisk-forvaltning" },
};

export default function Page() {
  return <CategoryView category="teknisk" />;
}
