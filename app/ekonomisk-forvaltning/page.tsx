import type { Metadata } from "next";
import { CategoryView } from "@/components/CategoryView";

export const metadata: Metadata = {
  title: { absolute: "Ekonomisk förvaltning brf: jämför förvaltare och pris" },
  description:
    "Ekonomisk förvaltning för brf: jämför förvaltarnas pris, kundnöjdhet, uppsägningstid och vad som ingår. Prisdiagram för er storlek, med källa.",
  alternates: { canonical: "/ekonomisk-forvaltning" },
};

export default function Page() {
  return <CategoryView category="ekonomisk" />;
}
