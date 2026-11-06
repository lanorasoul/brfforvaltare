/**
 * Förvaltarens logga i en fast ruta, så att alla får samma plats. Inne i rutan får varje logga ungefär samma yta,
 * så att en bred ordbild inte blir liten bredvid ett kvadratiskt märke. Utan logga visas initialerna.
 */
export function ProviderLogo({ name, logo, size = "md" }: { name: string; logo: { file: string; ratio: number } | null; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? { w: 128, h: 64, area: 3800 } : size === "sm" ? { w: 60, h: 30, area: 1050 } : { w: 80, h: 42, area: 1800 };
  let style: React.CSSProperties | undefined;
  if (logo) {
    let h = Math.sqrt(box.area / logo.ratio);
    let w = h * logo.ratio;
    if (w > box.w) {
      w = box.w;
      h = w / logo.ratio;
    }
    if (h > box.h) {
      h = box.h;
      w = h * logo.ratio;
    }
    style = { width: Math.round(w), height: Math.round(h) };
  }
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-ZÅÄÖ]/.test(w))
    .map((w) => w[0])
    .join("")
    .slice(0, 3);
  return (
    <span className={`plogo plogo-${size}`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.file} alt={`${name} logotyp`} style={style} loading="lazy" decoding="async" />
      ) : (
        <span className="plogo-initials" aria-hidden="true">
          {initials}
        </span>
      )}
    </span>
  );
}
