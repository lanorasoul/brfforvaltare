import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = {
  title: "Sidan finns inte",
};

export default function NotFound() {
  return (
    <>
      <PageHead title="Sidan finns inte" lead="Adressen stämmer inte med någon sida här. Den kan ha flyttats eller blivit felskriven." />
      <div className="page-body">
        <div className="container">
          <div className="gsec-actions">
            <Link className="btn btn-dark" href="/forvaltare">
              Se alla förvaltare
              <span className="btn-icon">
                <ArrowIcon size={12} />
              </span>
            </Link>
            <Link className="btn btn-quiet" href="/jamfor">
              Jämför förvaltare
            </Link>
            <Link className="btn btn-quiet" href="/">
              Till startsidan
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
