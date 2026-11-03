"use client";

import { useEffect, useState } from "react";
import { CheckIcon } from "./icons";

/** Bockbar lista. Bockarna sparas bara i den här webbläsaren och är aldrig något vi ser. */
export function Checklist({ id, items }: { id: string; items: readonly string[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const key = `checklist:${id}`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const saved: unknown = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length === items.length) setDone(saved.map(Boolean));
    } catch {
      // Utan lagring fungerar listan ändå, bockarna försvinner bara när sidan laddas om.
    }
  }, [key, items.length]);

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignoreras avsiktligt
      }
      return next;
    });
  };

  const count = done.filter(Boolean).length;

  return (
    <div className="checklist">
      <ul>
        {items.map((t, i) => (
          <li key={t}>
            <label className="check-row">
              <input type="checkbox" className="check-input" checked={done[i] ?? false} onChange={() => toggle(i)} />
              <span className="check-mark" aria-hidden="true">
                <CheckIcon size={14} />
              </span>
              <span className="check-text">{t}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="fine checklist-foot" aria-live="polite">
        {count} av {items.length} klara. Bockarna sparas bara i den här webbläsaren.
      </p>
    </div>
  );
}
