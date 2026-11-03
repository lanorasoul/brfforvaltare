interface Props {
  /** Antal tända prickar, 0 till 100. */
  count: number;
  /** Spelar upp "huset tänds" en gång vid laddning. */
  intro?: boolean;
  pitch?: number;
  radius?: number;
}

/** En prick är en lägenhet. Tio våningar med tio lägenheter, tänds nedifrån och upp. */
export function DotBuilding({ count, intro = false, pitch = 17, radius = 5.3 }: Props) {
  const pad = 2;
  const size = pad * 2 + pitch * 9 + radius * 2;
  const dots = Array.from({ length: 100 }, (_, i) => {
    const row = 9 - Math.floor(i / 10);
    const col = i % 10;
    return { i, cx: pad + radius + col * pitch, cy: pad + radius + row * pitch, on: i < count };
  });
  return (
    <svg
      className={`building${intro ? " building-intro" : ""}`}
      viewBox={`0 0 ${size} ${size + 8}`}
      width={size}
      height={size + 8}
      role="img"
      aria-label={`${count} av 100 prickar tända. En prick är en lägenhet.`}
    >
      {dots.map((d) => (
        <circle
          key={d.i}
          className={d.on ? "dot dot-on" : "dot"}
          cx={d.cx}
          cy={d.cy}
          r={radius}
          style={{ ["--i" as string]: d.i }}
        />
      ))}
      <line x1="0" x2={size} y1={size + 3} y2={size + 3} stroke="var(--line-strong)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
