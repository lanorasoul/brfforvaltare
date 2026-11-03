import { num } from "@/lib/format";
import { niceMax } from "@/lib/price";
import type { PriceInput } from "@/lib/price";

interface Props {
  providers: PriceInput[];
  /** mini: litet diagram i en ruta. full: stort diagram på prisguiden. tall: samma som full men högre och smalare, för mobil. */
  size?: "mini" | "full" | "tall";
  /** Ritar förvaltare med tumregel som streckad linje. Av i mini, eftersom en tumregel annars styr hela skalan. */
  withRuleOfThumb?: boolean;
}

const CFG = {
  mini: { W: 320, H: 168, l: 46, r: 10, t: 10, b: 26, tick: 10.5, dot: 4.5, line: 2 },
  full: { W: 760, H: 400, l: 64, r: 16, t: 14, b: 40, tick: 12.5, dot: 5.5, line: 2.4 },
  tall: { W: 340, H: 300, l: 60, r: 12, t: 14, b: 36, tick: 12.5, dot: 5, line: 2.2 },
} as const;

/**
 * Pris per år mot antal lägenheter. Tre sorters uppgifter ritas olika, inte med olika färg:
 * heldragen linje är en publicerad prislista, ring är ett prisexempel, streckad linje är ett antagande från en tumregel.
 */
export function PriceCurve({ providers, size = "mini", withRuleOfThumb = false }: Props) {
  const c = CFG[size];
  const lists = providers.filter((p) => p.pricing.model === "list");
  const examples = providers.filter((p) => p.pricing.model === "examples");
  const thumbs = withRuleOfThumb ? providers.filter((p) => p.pricing.model === "rule_of_thumb") : [];

  const values: number[] = [];
  for (const p of lists) if (p.pricing.model === "list") values.push(...p.pricing.anchors.map((a) => a.perYear));
  for (const p of examples) if (p.pricing.model === "examples") values.push(...p.pricing.examples.map((a) => a.perYear));
  for (const p of thumbs) if (p.pricing.model === "rule_of_thumb") values.push(p.pricing.perLgh * 100);
  const yMax = niceMax(Math.max(1, ...values));

  const x = (lgh: number) => c.l + (lgh / 100) * (c.W - c.l - c.r);
  const y = (v: number) => c.H - c.b - (v / yMax) * (c.H - c.t - c.b);
  const big = size !== "mini";
  const yTicks = big ? [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax) : [0, yMax / 2, yMax];
  const xTicks = big ? [0, 25, 50, 75, 100] : [0, 50, 100];

  return (
    <figure className={`curve curve-${size}`}>
      <svg viewBox={`0 0 ${c.W} ${c.H}`} role="img" aria-label="Pris per år mot antal lägenheter, för förvaltare som publicerar prislista, prisexempel eller tumregel. Samma uppgifter finns som tabell.">
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={c.l} x2={c.W - c.r} y1={y(t)} y2={y(t)} className="curve-grid" />
            <text x={c.l - 8} y={y(t) + 4} textAnchor="end" className="curve-tick" style={{ fontSize: c.tick }}>
              {num(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text
            key={t}
            x={x(t)}
            y={c.H - (big ? 12 : 6)}
            textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"}
            className="curve-tick"
            style={{ fontSize: c.tick }}
          >
            {t === 100 ? "100 lgh" : t}
          </text>
        ))}

        {lists.map((p) =>
          p.pricing.model === "list" ? (
            <polyline
              key={p.slug}
              className="curve-line"
              style={{ strokeWidth: c.line }}
              points={p.pricing.anchors.map((a) => `${x(a.lgh)},${y(a.perYear)}`).join(" ")}
            />
          ) : null,
        )}
        {thumbs.map((p) =>
          p.pricing.model === "rule_of_thumb" ? (
            <line
              key={p.slug}
              className="curve-dash"
              style={{ strokeWidth: c.line }}
              x1={x(5)}
              y1={y(p.pricing.perLgh * 5)}
              x2={x(100)}
              y2={y(p.pricing.perLgh * 100)}
            />
          ) : null,
        )}
        {examples.map((p) =>
          p.pricing.model === "examples"
            ? p.pricing.examples.map((e) => <circle key={`${p.slug}${e.lgh}`} className="curve-dot" cx={x(e.lgh)} cy={y(e.perYear)} r={c.dot} />)
            : null,
        )}
      </svg>
      <figcaption className="curve-key small muted">
        {lists.map((p) => (
          <span key={p.slug}>
            <i className="key-swatch" /> {p.name}, prislista
          </span>
        ))}
        {examples.map((p) => (
          <span key={p.slug}>
            <i className="key-ring" /> {p.name}, prisexempel
          </span>
        ))}
        {thumbs.map((p) => (
          <span key={p.slug}>
            <i className="key-dash" /> {p.name}, tumregel (antagande)
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
