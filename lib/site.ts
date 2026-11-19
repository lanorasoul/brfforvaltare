export const SITE = {
  /** Arbetsnamn. Byts här. */
  name: "brfförvaltare",
  domain: "brfforvaltare.se",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://brfforvaltare.se",
  /**
   * Sökmotorer släpps in på produktionen. Förhandsversioner på Vercel stängs alltid ute.
   * NEXT_PUBLIC_INDEXABLE=false stänger även produktionen, och =true öppnar var som helst.
   */
  indexable:
    process.env.NEXT_PUBLIC_INDEXABLE === "true" ||
    ((process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV) === "production" && process.env.NEXT_PUBLIC_INDEXABLE !== "false"),
  /** Koden från Google Search Console (metataggen google-site-verification). Behövs inte om domänen verifieras med DNS. */
  googleVerification: (process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? null) as string | null,
  /** Fylls i när en e-postadress på domänen finns. Visas inte förrän den är satt. */
  contactEmail: null as string | null,
  /**
   * Den som driver sajten och ansvarar för personuppgifterna i förfrågningarna. Fylls i före publicering.
   * Förfrågningar är stängda så länge den är null, och sajten släpps inte in i sökmotorer utan den.
   */
  operator: { name: "Brfforvaltare", orgnr: null, address: null } as { name: string; orgnr: string | null; address: string | null } | null,
  /**
   * Intressen som läsaren bör känna till, en mening per post. Visas på metodsidan och på sidan för förvaltare.
   * Exempel: att den som driver sajten också sitter i styrelsen för en bostadsrättsförening.
   */
  conflicts: [] as string[],
  /** Senaste datum då någon källa lästes. Varje källa har också sitt eget läsdatum i data/providers. */
  dataCheckedAt: "2026-11-06",
};

/** Antal regionala HSB-föreningar enligt HSB själv: https://www.hsb.se/omhsb/om-oss/organisation-och-agarinformation/ (läst 2026-11-06). */
export const HSB_REGIONALS_TOTAL = 21;

/** HSB visas som en förvaltare. De regionala föreningarna nämns i texten, inte som egna rader. */
export const isHsb = (p: { slug: string }): boolean => p.slug === "hsb";

/**
 * Branschsnittet i Prognoscentrets senaste NKI-mätning bland bostadsrättsföreningar (fältarbete november 2025 till januari 2026, 946 svar).
 * Källa: Riksbyggens pressmeddelande om mätningen, läst 2026-11-06.
 */
export const NKI_AVERAGE = { value: 68, year: 2025, url: "https://www.riksbyggen.se/om-riksbyggen/pressrum/2026/3436832/" };
