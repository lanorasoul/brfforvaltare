import Link from "next/link";
import { ArrowIcon } from "./icons";
import { PostCards } from "./PostCards";
import { getPost } from "@/lib/posts";

/** Tre artiklar som hör ihop med sidan läsaren är på. Används under verktygen och jämförelserna. */
export function PostMore({ slugs, title = "Läs också" }: { slugs: string[]; title?: string }) {
  const posts = slugs.flatMap((s) => getPost(s) ?? []);
  if (posts.length === 0) return null;
  return (
    <section className="post-more" aria-labelledby="las-ocksa">
      <h2 className="post-more-title" id="las-ocksa">
        {title}
      </h2>
      <PostCards posts={posts} level="h3" />
    </section>
  );
}

/** Raden med artiklar på startsidan. */
export function PostStrip({ slugs }: { slugs: string[] }) {
  const posts = slugs.flatMap((s) => getPost(s) ?? []);
  if (posts.length === 0) return null;
  return (
    <section className="post-strip" aria-labelledby="kunskap-title">
      <div className="container">
        <div className="post-strip-head">
          <span className="mono-label">Kunskap</span>
          <h2 className="h2" id="kunskap-title">
            Svar på styrelsens frågor
          </h2>
          <p className="lead">Korta guider som svarar först och förklarar sedan, med källa till varje sakuppgift.</p>
        </div>
        <PostCards posts={posts} level="h3" />
        <p className="post-strip-more">
          <Link className="btn btn-quiet" href="/kunskap">
            Alla guider
            <span className="btn-icon">
              <ArrowIcon />
            </span>
          </Link>
        </p>
      </div>
    </section>
  );
}
