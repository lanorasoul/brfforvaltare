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
  naboByte: { url: "https://nabo.se/vara-tjanster/ekonomisk-forvaltning/byta-forvaltare/", title: "Nabo: Byta förvaltare", checked: READ },
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
  /** Högsta NKI bland förvaltare med minst 20 svar, Simpleko (mätningen 2023). Samma mätning som lowestNki. */
  highestNki: 80,
};

/** Hur lång tid ett byte tar enligt Nabo. */
export const SWITCH_TIME = { noticeMonths: [3, 12], renewMonths: 12, boardMonths: 2, totalMonths: [4, 12] };
