import type { Metadata, Viewport } from "next";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/doto/full.css";
import "../styles/base.css";
import "../styles/nav.css";
import "../styles/hero.css";
import "../styles/sections.css";
import "../styles/pages.css";
import "../styles/tools.css";
import "../styles/compare.css";
import "../styles/guide.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Jämför förvaltare för er brf: ekonomisk och teknisk förvaltning",
    template: `%s | ${SITE.name}`,
  },
  description:
    "Jämför förvaltare av bostadsrättsföreningar, för både ekonomisk och teknisk förvaltning. Tjänster, pris, uppsägningstid och var de verkar. Varje uppgift har källa och datum.",
  robots: SITE.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: SITE.name,
  },
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
