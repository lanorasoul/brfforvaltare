"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { CompareData, CompareRow, MissingRow } from "@/lib/compare";
import { splitByPlace, type PlaceMatch } from "@/lib/coverage";
import type { Category } from "@/lib/types";

export const LGH_MIN = 5;
export const LGH_MAX = 100;

interface CompareState {
  data: CompareData;
  category: Category;
  setCategory: (c: Category) => void;
  /** Sant på sidorna som bara visar en kategori. */
  categoryLocked: boolean;
  ort: string;
  setOrt: (s: string) => void;
  /** Antal lägenheter som priskolumnen räknar för. */
  n: number;
  setN: (n: number) => void;
  /** Förvaltare som visas, i namnordning. */
  shown: { row: CompareRow; match: PlaceMatch | null }[];
  /** Förvaltare vars sidor bara nämner andra orter. */
  hidden: CompareRow[];
  /** Förvaltare som saknar kategorin. */
  missing: MissingRow[];
  /** Antal förvaltare med kategorin, före ortsfiltret. */
  total: number;
}

const Ctx = createContext<CompareState | null>(null);

export function useCompare(): CompareState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompare måste ligga inom CompareProvider");
  return v;
}

interface Props {
  data: CompareData;
  initialCategory?: Category;
  /** Dölj kategorivalet. Används på sidorna som är byggda för en enda kategori. */
  lockCategory?: boolean;
  children: React.ReactNode;
}

/**
 * Delat läge för jämförelsen: kategori, ort och antal lägenheter. Allt som visas under är härlett ur data.
 * Läget följer med i adressen (?kategori=teknisk&ort=Malmö) så att en jämförelse går att skicka vidare.
 */
export function CompareProvider({ data, initialCategory = "ekonomisk", lockCategory = false, children }: Props) {
  const [category, setCategory] = useState<Category>(initialCategory);
  const [ort, setOrt] = useState("");
  const [n, setN] = useState(50);
  const [ready, setReady] = useState(false);

  // Läs adressen efter första ritningen, så att servern och webbläsaren ritar samma sak först.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const k = q.get("kategori");
    if (!lockCategory && (k === "ekonomisk" || k === "teknisk")) setCategory(k);
    const o = q.get("ort");
    if (o) setOrt(o.slice(0, 60));
    const l = Number(q.get("lgh"));
    if (Number.isInteger(l) && l >= LGH_MIN && l <= LGH_MAX) setN(l);
    setReady(true);
  }, [lockCategory]);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    const put = (key: string, value: string | null) => (value ? q.set(key, value) : q.delete(key));
    put("kategori", lockCategory || category === initialCategory ? null : category);
    put("ort", ort.trim() || null);
    put("lgh", n === 50 ? null : String(n));
    const qs = q.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [ready, category, ort, n, lockCategory, initialCategory]);

  const value = useMemo<CompareState>(() => {
    const rows = data.rows[category];
    const split = splitByPlace(rows, ort);
    return {
      data,
      category,
      setCategory,
      categoryLocked: lockCategory,
      ort,
      setOrt,
      n,
      setN,
      shown: split.shown,
      hidden: split.hidden,
      missing: data.missing[category],
      total: rows.length,
    };
  }, [data, category, lockCategory, ort, n]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
