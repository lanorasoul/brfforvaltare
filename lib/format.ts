const nf = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });
const dfLong = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const dfShort = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** 37375 -> "37 375" (hårt mellanrum). */
export function num(n: number): string {
  return nf.format(Math.round(n));
}

/** 37375 -> "37 375 kr". */
export function kr(n: number): string {
  return `${num(n)} kr`;
}

/** Avrundar till närmsta hundratal för uppskattningar. */
export function krApprox(n: number): string {
  return `ca ${num(Math.round(n / 100) * 100)} kr`;
}

export function dateLong(iso: string): string {
  return dfLong.format(new Date(iso + "T00:00:00Z"));
}

export function dateShort(iso: string): string {
  return dfShort.format(new Date(iso + "T00:00:00Z")).replace(/\./g, "");
}

export function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/** Håller ihop belopp så att de inte bryts mitt i raden: "1 100 kr" och "5 000" får hårda mellanrum. */
export function tidy(s: string): string {
  return s.replace(/(\d) (?=\d{3}(?!\d))/g, "$1\u00A0").replace(/(\d) (?=(?:kr|st|procent)\b|%)/g, "$1\u00A0");
}

/** Tillämpar tidy på alla textvärden i en datastruktur. Övriga värden lämnas orörda. */
export function tidyDeep<T>(v: T): T {
  if (typeof v === "string") return tidy(v) as T;
  if (Array.isArray(v)) return v.map(tidyDeep) as T;
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tidyDeep(x)])) as T;
  return v;
}

/** "https://www.hsb.se/malmo/tjanster/" blir "www.hsb.se/malmo/tjanster". */
export function shortUrl(url: string): string {
  const u = new URL(url);
  return (u.host + u.pathname).replace(/\/$/, "");
}
