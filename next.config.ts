import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
// Vercels verktygsrad för kommentarer laddas bara på förhandsversioner. Produktion släpper inte in den.
const preview = process.env.VERCEL_ENV === "preview";
const live = preview ? " https://vercel.live" : "";

/**
 * Innehållspolicy. Sajten hämtar ingenting från andra värdar: typsnitt, loggor och skript ligger på sajten själv.
 * Next.js skriver små skript direkt i sidan, därför 'unsafe-inline' för skript. Sajten visar inget innehåll från
 * besökare, och React escapar all text, så risken är liten. Inline-stil behövs för diagrammens bredder.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}${live}`,
  `style-src 'self' 'unsafe-inline'${live}`,
  `img-src 'self' data:${preview ? " https://vercel.live https://vercel.com blob:" : ""}`,
  `font-src 'self'${preview ? " https://vercel.live https://assets.vercel.com" : ""}`,
  `connect-src 'self'${dev ? " ws: wss:" : ""}${preview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${preview ? "https://vercel.live" : "'none'"}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: security },
      // Loggorna är SVG-filer från förvaltarnas webbplatser. Öppnas en direkt får den varken köra skript eller hämta något.
      {
        source: "/logos/:file*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
    ];
  },
};

export default config;
