import { dateLong } from "@/lib/format";

export interface CoverageData {
  providers: number;
  /** Regionala HSB-föreningar vi har läst, och hur många HSB säger att det finns. */
  hsb: { read: number; total: number };
  ekonomisk: { providers: number; priced: number };
  teknisk: { providers: number; priced: number };
  published: number;
  cells: number;
  checkedAt: string;
}

/** Tre nyckeltal, alla räknade ur datafilerna. */
export function Coverage({ data }: { data: CoverageData }) {
  const items = [
    {
      n: String(data.providers),
      label: "förvaltare har vi läst",
      note: `Alla via egna webbplatser, med länk till sidan. Av HSB:s ${data.hsb.total} regionala föreningar ingår ${data.hsb.read}.`,
    },
    {
      n: `${data.ekonomisk.priced}/${data.ekonomisk.providers}`,
      label: "anger något pris för ekonomisk förvaltning",
      note: `För teknisk förvaltning anger ${data.teknisk.priced} av ${data.teknisk.providers} något pris för själva tjänsten. Resten svarar på förfrågan.`,
    },
    {
      n: `${data.published}/${data.cells}`,
      label: "uppgifter är tydligt publicerade",
      note: "Sex frågor per förvaltare och kategori. Resten är delvis eller ej funna på sidorna vi läste.",
    },
  ];
  return (
    <section className="cover" aria-label="Datatäckning">
      <div className="container">
        <ul className="cover-grid">
          {items.map((it) => (
            <li key={it.label} className="cover-tile panel">
              <p className="cover-n bignum" aria-hidden="true">
                {it.n}
              </p>
              <p className="cover-label">
                <span className="sr-only">{it.n}: </span>
                {it.label}
              </p>
              <p className="small muted">{it.note}</p>
            </li>
          ))}
        </ul>
        <p className="fine cover-date">Senast kontrollerat {dateLong(data.checkedAt)}.</p>
      </div>
    </section>
  );
}
