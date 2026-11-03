"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Rullbar ruta för breda tabeller. Rutan blir nåbar med tangentbord först när innehållet
 * faktiskt går utanför kanten, så att läsare på bred skärm inte får ett onödigt tabbstopp.
 * hint visar en rad ovanför rutan om att tabellen går att rulla, bara när den faktiskt går att rulla.
 */
export function ScrollRegion({ label, className, hint = false, children }: { label: string; className?: string; hint?: boolean; children: React.ReactNode }) {
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
    return () => ro.disconnect();
  }, []);

  return (
    <>
      {hint && scrolls && (
        <p className="fine scroll-hint" aria-hidden="true">
          Rulla tabellen i sidled för att se fler uppgifter.
        </p>
      )}
      <div ref={ref} className={className} {...(scrolls ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}>
        {children}
      </div>
    </>
  );
}
