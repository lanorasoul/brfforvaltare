"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowIcon, BrandMark } from "./icons";
import { SITE } from "@/lib/site";

// short är texten i menyraden, där det är trångt. Resten av namnet läses upp för skärmläsare och syns i mobilmenyn.
const LINKS: { href: string; label: string; short?: string }[] = [
  { href: "/forvaltare", label: "Förvaltare" },
  { href: "/prisguide", label: "Prisguide" },
  { href: "/byta-forvaltare", label: "Byta förvaltare" },
  { href: "/metod", label: "Metod" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Huvudmeny">
        <Link className="nav-brand" href="/" aria-label={`${SITE.name}, startsidan`}>
          <BrandMark />
          <span>{SITE.name}</span>
        </Link>

        <ul className="nav-links">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-link" aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
                {l.short ? (
                  <>
                    {l.short}
                    <span className="sr-only">{l.label.slice(l.short.length)}</span>
                  </>
                ) : (
                  l.label
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="nav-end">
          <Link className="btn btn-dark nav-cta" href="/hitta-forvaltare" aria-label="Hitta förvaltare">
            <span>
              Hitta<span className="nav-cta-more"> förvaltare</span>
            </span>
            <span className="btn-icon">
              <ArrowIcon size={12} />
            </span>
          </Link>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="nav-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Stäng menyn" : "Öppna menyn"}</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              {open ? (
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 6h12M3 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>

        <ul id="nav-sheet" className="nav-sheet" hidden={!open}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="nav-sheet-link" aria-current={pathname.startsWith(l.href) ? "page" : undefined}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
