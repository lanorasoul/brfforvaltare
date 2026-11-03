// Offertmallar som styrelser kan skicka till flera förvaltare. Hakparenteser fyller ni i själva.

import type { Category } from "./types.ts";

/** Frågor till ekonomisk förvaltning. */
export const OFFER_QUESTIONS = [
  "Pris per år för grundtjänsten, med och utan moms.",
  "Vad som ingår i grundtjänsten, punkt för punkt.",
  "Tillval och vad de kostar, till exempel överlåtelse, pantnotering och andrahandsuthyrning.",
  "Avtalstid, uppsägningstid och hur uppsägningstiden räknas.",
  "Uppstartsavgift och vad övergången från nuvarande förvaltare kostar.",
  "Hur och när priset kan ändras under avtalstiden.",
  "Vilken kundportal eller app styrelsen får, och om den kostar extra.",
  "Vem som blir vår kontaktperson och hur många föreningar hen ansvarar för.",
];

export const OFFER_TEMPLATE = `Hej,

Vi är en bostadsrättsförening med [antal] lägenheter och ber om en offert på ekonomisk förvaltning. Vi skickar samma frågor till flera förvaltare för att kunna jämföra på lika villkor. Vi är [momsregistrerade / inte momsregistrerade].

${OFFER_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Vi vill ha svar senast [datum].

Vänliga hälsningar
[namn]
[förening]`;

/** Frågor till teknisk förvaltning. Ingen förvaltare anger pris för tjänsten på sin webbplats, så offerten är det enda sättet att få ett. */
export const TECHNICAL_QUESTIONS = [
  "Pris per år för grundtjänsten och för varje nivå eller paket, med och utan moms.",
  "Vad som ingår i varje nivå, punkt för punkt, till exempel antal ronderingar, besiktningar och timmar för styrelsestöd.",
  "Om underhållsplan ingår och hur ofta den uppdateras.",
  "Tillval och vad de kostar, till exempel OVK, SBA, energideklaration och projektledning.",
  "Hur felanmälan fungerar, vilka tider ni svarar och om jour ingår dygnet runt.",
  "Hur upphandling av entreprenörer går till och hur ni ersätts för den.",
  "Avtalstid, uppsägningstid och hur uppsägningstiden räknas.",
  "Hur priset kan ändras under avtalstiden.",
  "Vem som blir vår kontaktperson och hur många fastigheter hen ansvarar för.",
];

export const TECHNICAL_TEMPLATE = `Hej,

Vi är en bostadsrättsförening med [antal] lägenheter i [antal] byggnader, byggda [år], och ber om en offert på teknisk förvaltning. Vi skickar samma frågor till flera förvaltare för att kunna jämföra på lika villkor. Vi är [momsregistrerade / inte momsregistrerade].

${TECHNICAL_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Vi vill ha svar senast [datum].

Vänliga hälsningar
[namn]
[förening]`;

export const QUESTIONS: Record<Category, string[]> = { ekonomisk: OFFER_QUESTIONS, teknisk: TECHNICAL_QUESTIONS };
export const TEMPLATES: Record<Category, string> = { ekonomisk: OFFER_TEMPLATE, teknisk: TECHNICAL_TEMPLATE };

/** Det som ska stå i avtalet med nuvarande förvaltare. */
export const CONTRACT_CHECKLIST = [
  "Uppsägningstid och hur den räknas",
  "Avtalsperiod och om avtalet förnyas automatiskt",
  "Hur priset kan ändras under avtalstiden",
  "Vad som ingår i priset",
  "Tillval och vad de kostar",
];

/** Att bocka av innan den gamla förvaltaren slutar. */
export const SWITCH_CHECKLIST = [
  "Uppsägningen skickad skriftligt och kvittot sparat",
  "Ny förvaltare har en plan för övergången",
  "Bankens firmatecknare och fullmakter uppdaterade",
  "Avier och betalningar flyttade",
  "Bokföring och årsredovisning överlämnade",
];
