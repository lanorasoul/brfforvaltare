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
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Jämför förvaltare för brf: pris, kundnöjdhet och villkor",
    template: `%s | ${SITE.name}`,
  },
  description:
    "Jämför förvaltare av bostadsrättsföreningar: pris för er storlek, kundnöjdhet (NKI), omdömen, antal kunder och avtalsvillkor för ekonomisk och teknisk förvaltning. Gratis och oberoende, med källa till varje uppgift.",
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: SITE.name,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false, email: false, address: false },
};

const siteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE.name,
  url: SITE.url,
  inLanguage: "sv-SE",
  description: "Jämför förvaltare av bostadsrättsföreningar: pris, kundnöjdhet och villkor, med källa till varje uppgift.",
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
