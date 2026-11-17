/**
 * Mobilversion av en matris: en rad per tjänst eller uppgift med en stapel som visar hur många förvaltare
 * som har den. Vilka förvaltare det är syns när man trycker på raden. Tabellen visas i stället på bredare skärm.
 */
export interface BarItem {
  key: string;
  label: string;
  /** Antal i den starka delen av stapeln, till exempel ingår eller publicerat. */
  strong: number;
  /** Antal i den svaga delen, till exempel tillval eller delvis. */
  weak: number;
  total: number;
  /** Förvaltarna grupperade per läge, i den ordning grupperna ska visas. */
  groups: { label: string; names: string[] }[];
}

export function MatrixBars({ items, strongLabel, weakLabel, countLabel }: { items: BarItem[]; strongLabel: string; weakLabel: string; countLabel: string }) {
  return (
    <div className="mxb">
      <ul className="mxb-key" aria-hidden="true">
        <li>
          <span className="mxb-swatch mxb-strong" /> {strongLabel}
        </li>
        <li>
          <span className="mxb-swatch mxb-weak" /> {weakLabel}
        </li>
      </ul>
      <ul className="mxb-list">
        {items.map((it) => {
          const n = it.strong + it.weak;
          return (
            <li key={it.key}>
              <details className="mxb-item">
                <summary>
                  <span className="mxb-row">
                    <span className="mxb-label">{it.label}</span>
                    <span className="mxb-count">
                      {n} av {it.total}
                    </span>
                  </span>
                  <span className="mxb-bar" aria-hidden="true">
                    <span className="mxb-strong" style={{ width: `${(it.strong / it.total) * 100}%` }} />
                    <span className="mxb-weak" style={{ width: `${(it.weak / it.total) * 100}%` }} />
                  </span>
                  <span className="sr-only">
                    {countLabel}: {n} av {it.total}. {strongLabel}: {it.strong}. {weakLabel}: {it.weak}.
                  </span>
                </summary>
                <dl className="mxb-groups">
                  {it.groups
                    .filter((g) => g.names.length > 0)
                    .map((g) => (
                      <div key={g.label}>
                        <dt>{g.label}</dt>
                        <dd>{g.names.join(", ")}</dd>
                      </div>
                    ))}
                </dl>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
