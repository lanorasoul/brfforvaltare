"use client";

import { useEffect, useRef, useState } from "react";

/** Sätter kolumnens rubrik på varje cell, så att en tabell som staplas på mobil kan visa rubriken vid värdet. */
function labelCells(table: HTMLTableElement) {
  const heads = [...table.querySelectorAll("thead tr:last-child th")].map((th) => th.textContent?.trim() ?? "");
  table.querySelectorAll("tbody tr, tfoot tr").forEach((tr) => {
    let col = 0;
    for (const cell of [...tr.children] as HTMLTableCellElement[]) {
      const label = heads[col] ?? "";
      if (cell.getAttribute("data-label") !== label) cell.setAttribute("data-label", label);
      col += cell.colSpan || 1;
    }
  });
}

/**
 * Rullbar ruta för breda tabeller. Rutan blir nåbar med tangentbord först när innehållet
 * faktiskt går utanför kanten, så att läsare på bred skärm inte får ett onödigt tabbstopp.
 * hint visar en rad ovanför rutan om att tabellen går att rulla, bara när den faktiskt går att rulla.
 * stack gör att tabellen visas som ett kort per rad på smal skärm i stället för att rulla i sidled.
 */
export function ScrollRegion({
  label,
  className,
  hint = false,
  stack = false,
  children,
}: {
  label: string;
  className?: string;
  hint?: boolean;
  stack?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    const table = el.querySelector("table");
    let mo: MutationObserver | undefined;
    if (stack && table) {
      labelCells(table);
      mo = new MutationObserver(() => labelCells(table));
      mo.observe(table, { childList: true, subtree: true, characterData: true });
    }
    return () => {
      ro.disconnect();
      mo?.disconnect();
    };
  }, [stack]);

  const cls = [className, stack ? "stack" : ""].filter(Boolean).join(" ");

  return (
    <>
      {hint && scrolls && (
        <p className="fine scroll-hint" aria-hidden="true">
          Rulla tabellen i sidled för att se fler uppgifter.
        </p>
      )}
      <div ref={ref} className={cls} {...(scrolls ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}>
        {children}
      </div>
    </>
  );
}
