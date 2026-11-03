import { getProviders } from "@/lib/data";
import { currentMode } from "@/lib/launch";
import { sendMail } from "@/lib/mail";
import { buildEmail, MAX_BODY_CHARS, sameOrigin, validateRequest, type SubmitResponse } from "@/lib/requests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: SubmitResponse, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Tar emot en offertförfrågan som JSON. Ingenting sparas. I läget live skickas den som mejl till den som driver sajten,
 * i läget preview skickas ingenting och svaret visar mejlet som skulle ha gått iväg, och i läget off tas inget emot.
 */
export async function POST(request: Request): Promise<Response> {
  const mode = currentMode();
  if (mode === "off") return reply({ ok: false, reason: "closed", message: "Förfrågningar är inte öppna ännu." }, 403);

  if (!sameOrigin(request.headers.get("origin"), request.headers.get("host"))) {
    return reply({ ok: false, reason: "origin", message: "Förfrågan kom inte från sajtens egen sida." }, 403);
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_CHARS * 4) return reply({ ok: false, reason: "toolarge", message: "Förfrågan är för stor." }, 413);

  const body = await request.text();
  if (body.length > MAX_BODY_CHARS) return reply({ ok: false, reason: "toolarge", message: "Förfrågan är för stor." }, 413);

  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch {
    return reply({ ok: false, reason: "invalid", errors: { form: "Förfrågan kunde inte läsas. Ladda om sidan och försök igen." } }, 400);
  }

  const providers = getProviders();
  const check = validateRequest(raw, { slugs: providers.map((p) => p.slug), now: Date.now() });

  // En bot ska inte få veta att den blev stoppad.
  if (check.kind === "bot") return reply({ ok: true, mode: "live" });
  if (check.kind === "toofast") {
    return reply({ ok: false, reason: "toofast", message: "Det gick för fort. Vänta ett par sekunder och skicka igen." }, 429);
  }
  if (check.kind === "invalid") return reply({ ok: false, reason: "invalid", errors: check.errors }, 422);

  const mail = buildEmail(
    check.value,
    providers.map((p) => ({ slug: p.slug, name: p.name, website: p.website })),
    new Date(),
  );

  if (mode === "preview") return reply({ ok: true, mode: "preview", preview: { subject: mail.subject, text: mail.text } });

  const sent = await sendMail(mail);
  if (!sent.ok) {
    return reply({ ok: false, reason: "unavailable", message: "Vi kunde inte skicka förfrågan just nu. Försök igen om en stund." }, 502);
  }
  return reply({ ok: true, mode: "live" });
}
