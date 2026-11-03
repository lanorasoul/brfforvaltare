"use client";

import { useCompare } from "./CompareProvider";
import { matrixStats } from "@/lib/matrix";
import { CATEGORY, DISCLOSURE_KEYS } from "@/lib/schema";

/** Namnet på vald kategori, för rubriker som ska följa med när man byter. */
export function CategoryLabel({ lower = false }: { lower?: boolean }) {
  const { category } = useCompare();
  const t = CATEGORY[category].label;
  return <>{lower ? t.toLowerCase() : t}</>;
}

/** En mening om vad vald kategori innebär. */
export function CategoryWhat() {
  const { category } = useCompare();
  return <>{CATEGORY[category].what}</>;
}

/** Ingress till öppenhetsmatrisen, räknad på de förvaltare som visas just nu. */
export function OpennessLead() {
  const { category, shown } = useCompare();
  const stats = matrixStats(shown.map((s) => s.row), category);
  const label = CATEGORY[category].label.toLowerCase();
  if (stats.providers === 0) return <>Ingen förvaltare att visa för vald ort.</>;
  return (
    <>
      Vi letade efter {DISCLOSURE_KEYS[category].length} uppgifter om {label} hos varje förvaltare. {stats.total.published} av {stats.cells} står tydligt på förvaltarens egen sida.
    </>
  );
}
