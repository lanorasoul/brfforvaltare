// Sista uppsägningsdag. Ren funktion utan beroenden, så att den kan testas med node --test.
// Datum är ISO-strängar (åååå-mm-dd) och räknas i UTC, så att tidszon och sommartid inte spelar roll.

export interface NoticeInput {
  /** Dagens datum. */
  today: string;
  /** Sista dagen i den avtalsperiod som pågår. */
  end: string;
  /** Uppsägningstid i hela månader. */
  months: number;
  /** Förnyas avtalet automatiskt tolv månader i taget om ingen säger upp? */
  autoRenew: boolean;
}

export interface NoticePlan {
  /** Den avtalsperiod som uppsägningen gäller för. */
  termEnd: string;
  /** Senaste dag då uppsägningen ska vara framme, räknad som slutdatum minus uppsägningstiden. */
  deadline: string;
  /** Hur många år vi räknat fram eftersom sista dagen redan passerat. */
  rolled: number;
  /** Sista dagen har passerat och avtalet förnyas inte, så uppsägning kan inte längre påverka den här perioden. */
  passed: boolean;
  /** Dagar kvar till sista dagen. Negativt om den passerat. */
  daysLeft: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

/** Lägger till (eller drar ifrån) hela månader. Dagen kläms till månadens sista dag, 31 maj minus tre månader blir 28 eller 29 februari. */
export function addMonths(iso: string, delta: number): string {
  const [y, m, d] = parts(iso);
  const total = y * 12 + (m - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;
  const daysInMonth = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  return `${ny}-${pad(nm + 1)}-${pad(Math.min(d, daysInMonth))}`;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = parts(a);
  const [by, bm, bd] = parts(b);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Antal kalendermånader från a till b, där båda räknas till sin månad. 2026-10-26 till 2026-12-31 är 2. */
export function monthsBetween(a: string, b: string): number {
  const [ay, am] = parts(a);
  const [by, bm] = parts(b);
  return (by - ay) * 12 + (bm - am);
}

export function noticePlan(input: NoticeInput): NoticePlan {
  let termEnd = input.end;
  let deadline = addMonths(termEnd, -input.months);
  let rolled = 0;
  if (input.autoRenew) {
    while (deadline < input.today && rolled < 60) {
      termEnd = addMonths(termEnd, 12);
      deadline = addMonths(termEnd, -input.months);
      rolled++;
    }
  }
  return {
    termEnd,
    deadline,
    rolled,
    passed: deadline < input.today,
    daysLeft: daysBetween(input.today, deadline),
  };
}

/** Löpande avtal: uppsägningstiden räknas från den dag uppsägningen kommer fram. Ingen sista dag att passa. */
export function rollingPlan(today: string, months: number): NoticePlan {
  return { termEnd: addMonths(today, months), deadline: today, rolled: 0, passed: false, daysLeft: 0 };
}
