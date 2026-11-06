import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Guiden ligger på startsidan. Gamla länkar skickas dit med svaren kvar. */
export default async function HittaForvaltare({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const k of ["behov", "ort", "lgh"]) {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) q.set(k, s);
  }
  const qs = q.toString();
  redirect(qs ? `/?${qs}#resultat` : "/");
}
