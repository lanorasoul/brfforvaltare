import { MinusIcon, PlusIcon } from "./icons";

export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

/** Dragspel med inbyggda details. Fungerar utan JavaScript och med tangentbord. */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="faq">
      {items.map((it) => (
        <details key={it.q} className="faq-item">
          <summary className="faq-q">
            <span>{it.q}</span>
            <span className="faq-icon" aria-hidden="true">
              <PlusIcon className="faq-plus" />
              <MinusIcon className="faq-minus" />
            </span>
          </summary>
          <div className="faq-a">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
