// Signerad tidsstämpel för formulären. Ren logik med node:crypto, testad i scripts/token.test.mjs.
//
// Sidan med formuläret får en tidsstämpel från serverns klocka och en signatur. Servern godtar bara en tidsstämpel
// som den själv har signerat, så ett skript kan inte hitta på en gammal tid för att komma runt kravet att formuläret
// ska ha legat framme en stund. Ingenting sparas: signaturen räcker för att kontrollera tiden.
import { createHmac, timingSafeEqual } from "node:crypto";

/** Så länge en sida med formulär går att skicka från. Därefter får besökaren ladda om sidan. */
export const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Env = Record<string, string | undefined>;

/**
 * Nyckeln för signaturen. En egen nyckel om den finns, annars mejltjänstens nyckel, som bara finns på servern.
 * Lokalt utan någon av dem används en känd nyckel. Då skickas inga mejl, så det gör inget att den är känd.
 */
export function signingSecret(env: Env): string {
  return env.REQUEST_SIGNING_SECRET || env.RESEND_API_KEY || "lokal-utveckling-inte-hemlig";
}

function sign(t: number, secret: string): string {
  return createHmac("sha256", secret).update(`forfragan:${t}`).digest("base64url");
}

export function issueToken(now: number, secret: string): string {
  const t = Math.floor(now);
  return `${t}.${sign(t, secret)}`;
}

export type TokenCheck = { kind: "ok"; t: number } | { kind: "bad" } | { kind: "stale" };

export function verifyToken(token: unknown, now: number, secret: string): TokenCheck {
  if (typeof token !== "string" || token.length > 200) return { kind: "bad" };
  const m = /^(\d{10,16})\.([A-Za-z0-9_-]{20,100})$/.exec(token);
  if (!m) return { kind: "bad" };
  const t = Number(m[1]);
  const expected = Buffer.from(sign(t, secret));
  const given = Buffer.from(m[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { kind: "bad" };
  if (t > now + 60_000) return { kind: "bad" };
  if (now - t > TOKEN_MAX_AGE_MS) return { kind: "stale" };
  return { kind: "ok", t };
}
