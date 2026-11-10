import Link from "next/link";
import { ExternalIcon } from "./icons";
import { PostData } from "./PostData";
import { ScrollRegion } from "./ScrollRegion";
import { isExternal, parseInline } from "@/lib/post-text";
import type { PostBlock } from "@/lib/posts";

/** En textrad med länkar och fetstil. Länkar ut från sajten öppnas i ny flik och går alltid till en källa i källistan. */
export function Rich({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) => {
        if (p.kind === "strong") return <strong key={i}>{p.text}</strong>;
        if (p.kind === "text") return <span key={i}>{p.text}</span>;
        return isExternal(p.href) ? (
          <a key={i} className="link" href={p.href} target="_blank" rel="noopener noreferrer">
            {p.text}
            <ExternalIcon size={11} />
          </a>
        ) : (
          <Link key={i} className="link" href={p.href}>
            {p.text}
          </Link>
        );
      })}
    </>
  );
}

function Block({ b }: { b: Exclude<PostBlock, { type: "h2" }> }) {
  switch (b.type) {
    case "h3":
      return <h3 className="post-h3">{b.text}</h3>;
    case "p":
      return (
        <p>
          <Rich text={b.text} />
        </p>
      );
    case "ul":
    case "ol": {
      const List = b.type;
      return (
        <List className={b.type === "ul" ? "post-list" : "post-list post-steps"}>
          {b.items.map((it) => (
            <li key={it}>
              <Rich text={it} />
            </li>
          ))}
        </List>
      );
    }
    case "note":
      return (
        <aside className="post-note">
          {b.title && <p className="post-note-title">{b.title}</p>}
          <p>
            <Rich text={b.text} />
          </p>
        </aside>
      );
    case "table":
      return (
        <figure className="post-figure">
          <ScrollRegion label={b.caption} className="post-table-wrap" hint>
            <table className="post-table">
              <caption>{b.caption}</caption>
              <thead>
                <tr>
                  {b.head.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row) => (
                  <tr key={row.join("|")}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row">
                          <Rich text={cell} />
                        </th>
                      ) : (
                        <td key={i}>
                          <Rich text={cell} />
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
          {b.note && (
            <figcaption className="fine post-figure-note">
              <Rich text={b.note} />
            </figcaption>
          )}
        </figure>
      );
    case "data":
      return <PostData dataKey={b.key} />;
  }
}

/** Artikelns brödtext. Varje h2 börjar ett eget avsnitt som innehållsförteckningen länkar till. */
export function PostBody({ blocks }: { blocks: PostBlock[] }) {
  const sections: { head: Extract<PostBlock, { type: "h2" }> | null; items: Exclude<PostBlock, { type: "h2" }>[] }[] = [];
  for (const b of blocks) {
    if (b.type === "h2") sections.push({ head: b, items: [] });
    else {
      if (sections.length === 0) sections.push({ head: null, items: [] });
      sections[sections.length - 1].items.push(b);
    }
  }
  return (
    <>
      {sections.map((s, i) => (
        <section key={s.head?.id ?? `intro-${i}`} className="post-sec" aria-labelledby={s.head?.id}>
          {s.head && (
            <h2 className="post-h2" id={s.head.id}>
              {s.head.text}
            </h2>
          )}
          {s.items.map((b, j) => (
            <Block key={j} b={b} />
          ))}
        </section>
      ))}
    </>
  );
}
