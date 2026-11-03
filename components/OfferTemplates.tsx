"use client";

import { useEffect, useState } from "react";
import { OfferTemplate } from "./OfferTemplate";
import { TEMPLATES } from "@/lib/offer";
import { CATEGORIES, CATEGORY } from "@/lib/schema";
import type { Category } from "@/lib/types";

/** Offertmall med flik för ekonomisk eller teknisk förvaltning. Adressen kan välja flik med ?mall=teknisk. */
export function OfferTemplates({ rows = 17, fit = false, sync = false }: { rows?: number; fit?: boolean; sync?: boolean }) {
  const [category, setCategory] = useState<Category>("ekonomisk");

  useEffect(() => {
    if (!sync) return;
    const m = new URLSearchParams(window.location.search).get("mall");
    if (m === "ekonomisk" || m === "teknisk") setCategory(m);
  }, [sync]);

  function choose(c: Category) {
    setCategory(c);
    if (!sync) return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("mall", c);
      window.history.replaceState(null, "", url);
    } catch {
      // Adressen är bara en bekvämlighet, mallen fungerar utan den.
    }
  }

  return (
    <div className="offers">
      <div className="seg" role="group" aria-label="Välj mall">
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className="seg-btn" aria-pressed={category === c} onClick={() => choose(c)}>
            {CATEGORY[c].label}
          </button>
        ))}
      </div>
      <OfferTemplate text={TEMPLATES[category]} rows={rows} fit={fit} />
    </div>
  );
}
