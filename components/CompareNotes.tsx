"use client";

import Link from "next/link";
import { useCompare } from "./CompareProvider";
import { CATEGORY } from "@/lib/schema";

/** Förklarar vad som inte syns i tabellerna: förvaltare som saknar kategorin och förvaltare som filtrerats bort på ort. */
export function CompareNotes() {
  const { category, missing, hidden, ort, setOrt } = useCompare();
  const label = CATEGORY[category].label.toLowerCase();
  const none = missing.filter((m) => m.state === "no");
  const unknown = missing.filter((m) => m.state !== "no");

  const names = (list: { name: string; slug: string }[]) =>
    list.map((m, i) => (
      <span key={m.slug}>
        {i > 0 && (i === list.length - 1 ? " och " : ", ")}
        <Link className="link" href={`/forvaltare/${m.slug}`}>
          {m.name}
        </Link>
      </span>
    ));

  if (missing.length === 0 && hidden.length === 0) return null;

  return (
    <div className="cnotes small muted">
      {hidden.length > 0 && (
        <p>
          {hidden.length === 1 ? "En förvaltare visas inte" : `${hidden.length} förvaltare visas inte`}, eftersom deras sidor bara nämner andra orter än {ort.trim()}:{" "}
          {names(hidden)}. Det betyder inte att de tackar nej, bara att orten inte står på sidorna vi läste.{" "}
          <button type="button" className="cnotes-btn" onClick={() => setOrt("")}>
            Visa alla
          </button>
        </p>
      )}
      {none.length > 0 && (
        <p>
          {names(none)} anger på sin egen sida att de inte erbjuder {label}.
        </p>
      )}
      {unknown.length > 0 && (
        <p>
          Vi hittade ingen {label} på sidorna vi läste hos {names(unknown)}.
        </p>
      )}
    </div>
  );
}
