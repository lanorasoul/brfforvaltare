// Gränser som flera filer delar. Inga beroenden, så att tester, servern och webbläsaren kan läsa den.

/** Antal lägenheter som frågeguiden räknar priset för. Utanför de publicerade storlekarna visas inget pris, aldrig en gissning. */
export const GUIDE_LGH = { min: 3, max: 500, default: 50 } as const;

/** Största antal lägenheter som en förfrågan kan gälla. */
export const REQUEST_LGH_MAX = 3000;

/** Hur många förvaltare en styrelse kan be om offert från i en förfrågan. Samma tak som jämförelsen sida vid sida. */
export const MAX_PICK = 3;

/** Längsta ortnamn vi tar emot i en adress eller ett formulär. */
export const ORT_MAX = 60;
