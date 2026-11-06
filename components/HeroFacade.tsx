/**
 * Prickfält bakom hjälten. Samma enhet som resten av sajten: en prick är en lägenhet.
 * Tända fönster sitter i små block (1x1, 2x1, 1x2, 2x2), som kvällen i ett hyreshus.
 * Fördelningen är fast (seedad) så att servern och webbläsaren ritar likadant.
 */
const COLS = 86;
const ROWS = 22;
const PITCH = 17;

const SHAPES: Array<[number, number]> = [
  [1, 1],
  [1, 1],
  [2, 1],
  [1, 2],
  [2, 2],
];

function litWindows(): Map<string, number> {
  let s = 20261026;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const out = new Map<string, number>();
  let blocks = 0;
  let guard = 0;
  while (blocks < 20 && guard++ < 2000) {
    const [w, h] = SHAPES[Math.floor(rnd() * SHAPES.length)];
    const c = Math.floor(rnd() * (COLS - w));
    const r = Math.floor(rnd() * (ROWS - h));
    // Håll mitten fri så att rubriken får ro.
    if (c + w > 20 && c < 66 && r + h > 5) continue;
    const glow = 0.5 + rnd() * 0.5;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.set(`${c + dx}:${r + dy}`, glow);
    blocks++;
  }
  return out;
}

export function HeroFacade() {
  const windows = litWindows();
  const w = COLS * PITCH;
  const h = ROWS * PITCH;
  return (
    <div className="facade" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMin slice" width="100%" height="100%">
        <defs>
          <pattern id="facade-dots" width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
            <circle cx={PITCH / 2} cy={PITCH / 2} r="1.9" fill="#e6e1da" />
          </pattern>
        </defs>
        <rect width={w} height={h} fill="url(#facade-dots)" />
        {[...windows.entries()].map(([key, o]) => {
          const [c, r] = key.split(":").map(Number);
          return <circle key={key} cx={c * PITCH + PITCH / 2} cy={r * PITCH + PITCH / 2} r="2.9" fill="#ff4a2e" opacity={o.toFixed(2)} />;
        })}
      </svg>
    </div>
  );
}
