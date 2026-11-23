import { JsonLd } from "./JsonLd";
import { SITE } from "@/lib/site";

/** Listan med förvaltare som strukturerad data, i samma ordning som på sidan. */
export function ProviderListLd({ name, items }: { name: string; items: { slug: string; name: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name,
        numberOfItems: items.length,
        itemListElement: items.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.name, url: `${SITE.url}/forvaltare/${p.slug}` })),
      }}
    />
  );
}
