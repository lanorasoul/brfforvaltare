"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./icons";

interface Props {
  /** Sidan som tar emot valet, med förvaltarna som upprepade f-värden i adressen. */
  action: string;
  /** Svaren från guiden som följer med till formuläret. */
  hidden: { name: string; value: string }[];
  max: number;
  children: React.ReactNode;
}

/**
 * Ramen runt tabellen där styrelsen kryssar i upp till tre förvaltare. Fungerar utan JavaScript: då skickas formuläret
 * som vanlig GET och sidan efter tar de tre första. Med JavaScript låses fler rutor när tre är valda.
 */
export function PickForm({ action, hidden, max, children }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [count, setCount] = useState(0);
  const [warn, setWarn] = useState(false);

  const sync = useCallback(() => {
    const boxes = Array.from(ref.current?.querySelectorAll<HTMLInputElement>('input[name="f"]') ?? []);
    const checked = boxes.filter((b) => b.checked).length;
    for (const b of boxes) b.disabled = !b.checked && checked >= max;
    setCount(checked);
    if (checked > 0) setWarn(false);
  }, [max]);

  useEffect(sync, [sync]);

  return (
    <form
      ref={ref}
      action={action}
      method="get"
      onChange={sync}
      onSubmit={(e) => {
        if (count === 0) {
          e.preventDefault();
          setWarn(true);
        }
      }}
    >
      {hidden.map((h, i) => (
        <input key={`${h.name}-${i}`} type="hidden" name={h.name} value={h.value} />
      ))}
      {children}
      <div className="pick-bar">
        <div className="pick-text" aria-live="polite">
          {warn ? (
            <p className="pick-warn">Kryssa i minst en förvaltare först.</p>
          ) : (
            <p>
              <strong className="num">
                {count} av {max}
              </strong>{" "}
              valda. {count >= max ? "Ta bort ett kryss om ni vill byta." : `Ni kan välja upp till ${max === 3 ? "tre" : max}.`}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn-accent pick-btn">
          Be om offert från de valda
          <span className="btn-icon">
            <ArrowIcon />
          </span>
        </button>
      </div>
    </form>
  );
}
