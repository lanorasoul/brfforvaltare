import type { Metadata, Viewport } from "next";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../styles/base.css";
import "../styles/nav.css";
import "../styles/hero.css";
import "../styles/sections.css";
import "../styles/pages.css";
import "../styles/tools.css";
import "../styles/compare.css";
import "../styles/guide.css";
import "../styles/overview.css";
import "../styles/wizard.css";
import "../styles/insights.css";
import "../styles/home.css";
import "../styles/post.css";
import "../styles/visual.css";
import "../styles/mobile.css";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Brf förvaltare: jämför förvaltare för er bostadsrättsförening",
    template: "%s | Brf förvaltare",
  },
  description:
    "Jämför brf förvaltare: pris för er storlek, kundnöjdhet (NKI) och villkor för ekonomisk och teknisk förvaltning. Gratis, oberoende och med källa.",
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  ...(SITE.googleVerification ? { verification: { google: SITE.googleVerification } } : {}),
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: SITE.name,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

// Sajten och den som står bakom den. Namnet skrivs både som varumärke och som sökfras, så att båda kopplas till sajten.
const siteLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      alternateName: ["Brf förvaltare", "brfforvaltare.se"],
      url: SITE.url,
      inLanguage: "sv-SE",
      description: "Jämför brf förvaltare: pris, kundnöjdhet och villkor för ekonomisk och teknisk förvaltning, med källa till varje uppgift.",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      alternateName: "Brf förvaltare",
      url: SITE.url,
      logo: `${SITE.url}/apple-icon.png`,
      ...(SITE.contactEmail ? { email: SITE.contactEmail } : {}),
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <JsonLd data={siteLd} />
        <a className="skip-link" href="#main">
          Hoppa till innehållet
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
