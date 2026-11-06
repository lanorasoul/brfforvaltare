import Link from "next/link";

interface Crumb {
  href: string;
  label: string;
}

/** Sidhuvud för undersidor. Vänsterställt, med valfri brödsmula. */
export function PageHead({
  title,
  lead,
  crumbs,
  children,
  logo,
}: {
  title: string;
  lead?: React.ReactNode;
  crumbs?: Crumb[];
  children?: React.ReactNode;
  /** Visas ovanför rubriken, till exempel en förvaltares logga. */
  logo?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="container">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Brödsmula" className="crumbs small">
            <ol>
              <li>
                <Link href="/">Start</Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.href}>
                  <Link href={c.href}>{c.label}</Link>
                </li>
              ))}
            </ol>
          </nav>
        )}
        {logo && <div className="page-logo">{logo}</div>}
        <h1 className="h1">{title}</h1>
        {lead && <p className="lead page-lead">{lead}</p>}
        {children}
      </div>
    </header>
  );
}
