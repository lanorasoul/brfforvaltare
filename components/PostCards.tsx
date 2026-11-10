import Link from "next/link";
import { ArrowIcon } from "./icons";
import { dateLong } from "@/lib/format";
import { plainText } from "@/lib/post-text";
import type { LoadedPost } from "@/lib/posts";

/** Kort som länkar till artiklar. level är rubriknivån, så att sidans rubrikordning stämmer där korten används. */
export function PostCards({ posts, level = "h2" }: { posts: LoadedPost[]; level?: "h2" | "h3" }) {
  const H = level;
  return (
    <ul className="post-cards">
      {posts.map((p) => (
        <li key={p.slug} className="post-card">
          <span className="mono-label">{p.category}</span>
          <H className="post-card-title">
            <Link href={`/kunskap/${p.slug}`}>{p.title}</Link>
          </H>
          <p className="post-card-text">{plainText(p.description)}</p>
          <p className="post-card-foot fine">
            <span>
              Uppdaterad <time dateTime={p.updated}>{dateLong(p.updated)}</time>
              <span aria-hidden="true"> · </span>
              {p.minutes} min
            </span>
            <span className="post-card-go" aria-hidden="true">
              Läs <ArrowIcon size={11} />
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}
