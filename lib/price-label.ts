import { kr, num } from "./format";
import type { PriceRow } from "./price";

export type Unit = "year" | "lgh";

export const VAT_TEXT = { excl: "exkl. moms", incl: "inkl. moms", unknown: "moms ej angivet" } as const;

/** Värdet i vald enhet. Per lägenhet använder listpriser det avrundade värde förvaltaren själv visar. */
export function valueOf(r: PriceRow, unit: Unit, n: number): number | null {
  if (r.perYear === null) return null;
  if (unit === "year") return r.perYear;
  return r.perLgh ?? r.perYear / n;
}

/** Text för ett pris. "från" och "ca" visar att siffran inte är en fast prislista. */
export function priceLabel(r: PriceRow, v: number, unit: Unit): string {
  const text = unit === "year" ? kr(v) : `${num(v)} kr`;
  if (r.kind === "from") return `från ${text}`;
  if (r.kind === "estimate" || r.kind === "assumption") return `ca ${text}`;
  return text;
}
