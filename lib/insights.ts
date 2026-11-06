// Siffror om att byta förvaltare som visas på startsidan. Varje siffra har källa och läsdatum.
// Siffror om enskilda förvaltares priser räknas ur data/providers, inte här.

export interface Cited {
  url: string;
  title: string;
  checked: string;
}

const READ = "2026-11-06";

export const SRC = {
  bostadsratterna: {
    url: "https://www.bostadsratterna.se/nyheter/artiklar/2025/33-procent-vill-byta-forvaltare",
    title: "Bostadsrätterna: 33 procent vill byta förvaltare",
    checked: READ,
  },
  prognos2023: {
    url: "https://press.prognoscentret.se/posts/pressreleases/manga-bostadsrattsforeningar-ar-missnojda-med",
    title: "Prognoscentret: Många bostadsrättsföreningar är missnöjda med sina förvaltningsbolag",
    checked: READ,
  },
  prognos2025: {
    url: "https://www.riksbyggen.se/om-riksbyggen/pressrum/2026/3436832/",
    title: "Riksbyggen om Prognoscentrets NKI-mätning 2025",
    checked: READ,
  },
  brfIndex: { url: "https://www.sbc.se/om-sbc/brf-index/", title: "SBC:s BRF-index, tredje kvartalet 2026", checked: READ },
  sbcUpphandling: { url: "https://www.sbc.se/fastighetsforvaltning/ekonomisk-forvaltning/", title: "SBC: Ekonomisk förvaltning", checked: READ },
  naboEnergi: { url: "https://nabo.se/vara-tjanster/sank-energikostnaderna/", title: "Nabo: Sänk energikostnaderna", checked: READ },
  naboByte: { url: "https://nabo.se/vara-tjanster/ekonomisk-forvaltning/byta-forvaltare/", title: "Nabo: Byta förvaltare", checked: READ },
  erfForsening: { url: "https://erf.se/arsredovisning-brf", title: "ERF: Årsredovisning för brf", checked: READ },
} satisfies Record<string, Cited>;

/** Prognoscentrets mätning bland styrelser i omkring 6 500 bostadsrättsföreningar. */
export const SURVEY = {
  /** Andel som ska eller funderar på att byta förvaltare när avtalet löper ut (mätningen 2024). */
  wantToSwitch: 33,
  /** Andel som är tydligt missnöjda (mätningen 2024). */
  dissatisfied: 36,
  /** Andel som är tydligt nöjda (mätningen 2024). */
  satisfied: 50,
  /** Lägsta NKI bland förvaltare med minst 20 svar (mätningen 2023). */
  lowestNki: 17,
  /** NKI när samma bolag sköter både ekonomisk och teknisk förvaltning (mätningen 2023). */
  bothSameNki: 59,
};

/** NKI 2025 för de förvaltare vars värden är offentliga, och branschsnittet. */
export const NKI_2025 = {
  average: 68,
  top: [
    { name: "Simpleko", value: 78 },
    { name: "Delagott", value: 74 },
    { name: "Riksbyggen", value: 71 },
  ],
};

/** SBC:s BRF-index: totala kostnader för en genomsnittlig förening med 50 lägenheter, tredje kvartalet 2026. */
export const BRF_INDEX = { perQuarter: 662_944, lgh: 50, quarter: "tredje kvartalet 2026" };

/** Förvaltarnas egna exempel på vad som går att spara utöver arvodet. */
export const SAVINGS = [
  { value: 44, what: "lägre pris på OVK", who: "SBC, gemensam upphandling för 392 föreningar", src: SRC.sbcUpphandling },
  { value: 35, what: "lägre kostnad för stamspolning", who: "SBC, gemensam upphandling för 284 föreningar", src: SRC.sbcUpphandling },
  { value: 24, what: "lägre elkostnad, 150 000 kr per år", who: "Nabo, energiutredning för en förening", src: SRC.naboEnergi },
];

/** Hur lång tid ett byte tar enligt Nabo. */
export const SWITCH_TIME = { noticeMonths: [3, 12], renewMonths: 12, boardMonths: 2, totalMonths: [4, 12] };

/** Bolagsverkets förseningsavgift för årsredovisning, enligt ERF. */
export const LATE_FEE = { first: 7_500, max: 30_000 };
