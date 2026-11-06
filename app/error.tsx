"use client";

import Link from "next/link";
import { ArrowIcon } from "@/components/icons";

/** Visas om något oväntat går fel när en sida ritas. Inga detaljer om felet visas för besökaren. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <header className="page-head">
      <div className="container">
        <h1 className="h1">Något gick fel</h1>
        <p className="lead page-lead">Sidan kunde inte visas just nu. Försök igen om en stund. Fortsätter det, gå till startsidan.</p>
        <div className="hero-actions" style={{ justifyContent: "flex-start" }}>
          <button type="button" className="btn btn-dark" onClick={() => reset()}>
            Försök igen
            <span className="btn-icon">
              <ArrowIcon />
            </span>
          </button>
          <Link className="btn btn-quiet" href="/">
            Till startsidan
          </Link>
        </div>
      </div>
    </header>
  );
}
