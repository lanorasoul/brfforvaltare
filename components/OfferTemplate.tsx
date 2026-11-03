"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon } from "./icons";

/** fit: rutan växer så att hela mallen syns utan rullning. Utan fit hålls höjden fast, till exempel i den klistrade rutan på startsidan. */
export function OfferTemplate({ text, rows = 11, fit = false }: { text: string; rows?: number; fit?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  useEffect(() => {
    const el = area.current;
    if (!fit || !el) return;
    const grow = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    };
    grow();
    window.addEventListener("resize", grow);
    // Typsnittet kan komma efter första mätningen och ändra radbrytningarna.
    document.fonts?.ready.then(grow).catch(() => undefined);
    return () => window.removeEventListener("resize", grow);
  }, [fit, text]);

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // Utan clipboard-behörighet markerar vi texten så att den går att kopiera för hand.
      area.current?.focus();
      area.current?.select();
      setFailed(true);
    }
  }

  return (
    <div className="offer">
      <textarea ref={area} className="offer-text" readOnly value={text} rows={rows} aria-label="Offertmall, markera och kopiera" />
      <div className="offer-bar">
        <button type="button" className="btn btn-dark offer-btn" onClick={copy}>
          {copied ? (
            <>
              Kopierad <CheckIcon />
            </>
          ) : (
            "Kopiera mallen"
          )}
        </button>
        <p className="fine" aria-live="polite">
          {failed ? "Det gick inte att kopiera automatiskt. Texten är markerad, tryck Ctrl+C eller Cmd+C." : "Fyll i det som står inom hakparenteser."}
        </p>
      </div>
    </div>
  );
}
