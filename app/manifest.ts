import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name}: jämför förvaltare för er brf`,
    short_name: SITE.name,
    description: "Jämför förvaltare av bostadsrättsföreningar: pris, kundnöjdhet och villkor, med källa till varje uppgift.",
    lang: "sv",
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
