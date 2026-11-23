import type { Metadata } from "next";
import { CategoryView } from "@/components/CategoryView";

export const metadata: Metadata = {
  title: { absolute: "Teknisk förvaltning brf: jämför förvaltare och tjänster" },
  description:
    "Teknisk förvaltning för brf: jämför förvaltarnas tjänster, paket, underhållsplan och besiktningar, kundnöjdhet och var de verkar. Med källa.",
  alternates: { canonical: "/teknisk-forvaltning" },
};

export default function Page() {
  return <CategoryView category="teknisk" />;
}
