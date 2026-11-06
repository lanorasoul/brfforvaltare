import Link from "next/link";
import { ProviderLogo } from "./ProviderLogo";

interface Item {
  slug: string;
  name: string;
  logo: { file: string; ratio: number } | null;
}

/**
 * En rullande rad med alla förvaltares loggor, i namnordning. Raden finns två gånger så att rullningen
 * kan gå runt utan skarv. Den andra är dold för skärmläsare. Vid "minska rörelse" står raden still.
 */
export function LogoMarquee({ items }: { items: Item[] }) {
  const list = (hidden: boolean) => (
    <ul className="mq-list" aria-hidden={hidden || undefined}>
      {items.map((p) => (
        <li key={p.slug}>
          <Link href={`/forvaltare/${p.slug}`} tabIndex={hidden ? -1 : undefined} className="mq-item" aria-label={p.name}>
            <ProviderLogo name={p.name} logo={p.logo} />
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="mq" aria-labelledby="mq-title">
      <p className="mono-label mq-title" id="mq-title">
        Förvaltarna i jämförelsen
      </p>
      <div className="mq-viewport">
        <div className="mq-track">
          {list(false)}
          {list(true)}
        </div>
      </div>
    </section>
  );
}
