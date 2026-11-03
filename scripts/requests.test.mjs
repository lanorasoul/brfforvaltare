import test from "node:test";
import assert from "node:assert/strict";
import { MAX_PICK, REQUEST_LGH_MAX } from "../lib/limits.ts";
import { buildEmail, CONSENT_TEXT, LIMITS, looksLikeEmail, looksLikePhone, manyLines, MIN_FILL_MS, oneLine, sameOrigin, validateRequest } from "../lib/requests.ts";

const now = Date.UTC(2026, 9, 28, 20, 0, 0);
const ctx = { slugs: ["nabo", "sbc", "fastum", "riksbyggen"], now };

const good = (over = {}) => ({
  forening: "Brf Solgläntan",
  ort: "Malmö",
  lgh: 48,
  behov: "ekonomisk",
  nuvarande: "",
  meddelande: "Vi vill byta förvaltare vid årsskiftet.",
  namn: "Anna Svensson",
  roll: "Ordförande",
  epost: "anna@example.se",
  telefon: "070-123 45 67",
  forvaltare: ["nabo", "sbc"],
  samtycke: true,
  webbplats: "",
  t: now - 60_000,
  ...over,
});

const DASHES = [0x2013, 0x2014, 0x2212];
const hasDash = (s) => [...s].some((c) => DASHES.includes(c.codePointAt(0)));

test("Ett rätt ifyllt formulär godkänns och ger städade värden", () => {
  const r = validateRequest(good(), ctx);
  assert.equal(r.kind, "ok");
  assert.equal(r.value.forening, "Brf Solgläntan");
  assert.equal(r.value.lgh, 48);
  assert.deepEqual(r.value.forvaltare, ["nabo", "sbc"]);
  assert.equal(r.value.samtycke, true);
});

test("Ett ifyllt dolt fält är en bot, och en saknad eller framtida tid också", () => {
  assert.equal(validateRequest(good({ webbplats: "http://spam.example" }), ctx).kind, "bot");
  assert.equal(validateRequest(good({ t: undefined }), ctx).kind, "bot");
  assert.equal(validateRequest(good({ t: "nu" }), ctx).kind, "bot");
  assert.equal(validateRequest(good({ t: now + 10 * 60_000 }), ctx).kind, "bot");
});

test("Ett formulär som skickas för snabbt ber om nytt försök, men bara när allt annat är rätt", () => {
  assert.equal(validateRequest(good({ t: now - (MIN_FILL_MS - 500) }), ctx).kind, "toofast");
  assert.equal(validateRequest(good({ t: now - MIN_FILL_MS }), ctx).kind, "ok");
  assert.equal(validateRequest(good({ t: now - 500, namn: "" }), ctx).kind, "invalid");
});

test("Ett tomt formulär ger fel på alla obligatoriska fält och inga andra", () => {
  const r = validateRequest({ t: now - 60_000, webbplats: "" }, ctx);
  assert.equal(r.kind, "invalid");
  assert.deepEqual(Object.keys(r.errors).sort(), ["behov", "epost", "forening", "forvaltare", "lgh", "namn", "ort", "samtycke"]);
});

test("Något som inte är ett objekt ger en bot, inte ett fel som kraschar", () => {
  for (const raw of [null, undefined, "text", 5, [], true]) assert.equal(validateRequest(raw, ctx).kind, "bot");
});

test("Samtycke måste vara exakt true", () => {
  for (const v of [false, "true", "on", 1, undefined]) {
    const r = validateRequest(good({ samtycke: v }), ctx);
    assert.equal(r.kind, "invalid");
    assert.ok(r.errors.samtycke);
  }
});

test("Antal lägenheter: heltal inom gränserna, också som text med mellanslag", () => {
  assert.equal(validateRequest(good({ lgh: "1 200" }), ctx).value.lgh, 1200);
  assert.equal(validateRequest(good({ lgh: "48" }), ctx).value.lgh, 48);
  for (const bad of [0, -3, 12.5, REQUEST_LGH_MAX + 1, "många", "", null]) {
    const r = validateRequest(good({ lgh: bad }), ctx);
    assert.equal(r.kind, "invalid", String(bad));
    assert.ok(r.errors.lgh, String(bad));
  }
});

test("Förvaltare: minst en, högst tre, bara kända, dubbletter slås ihop", () => {
  assert.deepEqual(validateRequest(good({ forvaltare: ["nabo", "nabo"] }), ctx).value.forvaltare, ["nabo"]);
  assert.ok(validateRequest(good({ forvaltare: [] }), ctx).errors.forvaltare);
  assert.ok(validateRequest(good({ forvaltare: "nabo" }), ctx).errors.forvaltare);
  assert.ok(validateRequest(good({ forvaltare: ["nabo", "sbc", "fastum", "riksbyggen"] }), ctx).errors.forvaltare);
  assert.ok(validateRequest(good({ forvaltare: ["nabo", "finns-inte"] }), ctx).errors.forvaltare);
  assert.equal(MAX_PICK, 3, "Felmeddelandet säger tre");
});

test("Behov måste vara ett av de tre valen", () => {
  for (const ok of ["ekonomisk", "teknisk", "bada"]) assert.equal(validateRequest(good({ behov: ok }), ctx).kind, "ok");
  assert.ok(validateRequest(good({ behov: "annat" }), ctx).errors.behov);
});

test("För långa texter avvisas och kapas inte i tysthet", () => {
  assert.equal(validateRequest(good({ meddelande: "a".repeat(LIMITS.meddelande) }), ctx).kind, "ok");
  assert.ok(validateRequest(good({ meddelande: "a".repeat(LIMITS.meddelande + 1) }), ctx).errors.meddelande);
  assert.ok(validateRequest(good({ forening: "a".repeat(LIMITS.forening + 1) }), ctx).errors.forening);
  assert.ok(validateRequest(good({ nuvarande: "a".repeat(LIMITS.nuvarande + 1) }), ctx).errors.nuvarande);
  assert.ok(validateRequest(good({ roll: "a".repeat(LIMITS.roll + 1) }), ctx).errors.roll);
});

test("E-post och telefon kontrolleras, telefon är valfritt", () => {
  for (const ok of ["a@b.se", "anna.svensson+brf@example.com", "åsa@exempel.se"]) assert.ok(looksLikeEmail(ok), ok);
  for (const bad of ["a@b", "a b@c.se", "a@b..se", "a@b.se, c@d.se", "@b.se", "a@.se", "<a@b.se>", "a@b.se;c@d.se"]) assert.ok(!looksLikeEmail(bad), bad);
  for (const ok of ["070-123 45 67", "+46 70 123 45 67", "040 12 34 56"]) assert.ok(looksLikePhone(ok), ok);
  for (const bad of ["12", "abc", "070-123 45 67 ring efter fem", "1".repeat(40)]) assert.ok(!looksLikePhone(bad), bad);
  assert.equal(validateRequest(good({ telefon: "" }), ctx).kind, "ok");
  assert.ok(validateRequest(good({ telefon: "abc" }), ctx).errors.telefon);
  assert.ok(validateRequest(good({ epost: "" }), ctx).errors.epost);
  assert.ok(validateRequest(good({ epost: "inte en adress" }), ctx).errors.epost);
});

test("Radbrytningar i enradsfält blir blanksteg, så att inget kan smugglas in som ny rad i mejlet", () => {
  const r = validateRequest(good({ namn: "Anna\r\nBcc: spam@example.se", forening: "Brf\nX", ort: "Mal\tmö" }), ctx);
  assert.equal(r.kind, "ok");
  for (const f of ["namn", "forening", "ort"]) assert.ok(!/[\r\n\t]/.test(r.value[f]), f);
  assert.equal(r.value.namn, "Anna Bcc: spam@example.se");
});

test("Osynliga riktningstecken och styrtecken tas bort", () => {
  const bidi = String.fromCharCode(0x202e);
  const zero = String.fromCharCode(0x200b);
  const bell = String.fromCharCode(7);
  assert.equal(oneLine(`Brf${bidi}${zero} Sol${bell}`), "Brf Sol");
  assert.equal(manyLines(`rad ett${bidi}\r\nrad${bell} två`), "rad ett\nrad två");
});

test("Meddelandet behåller sina radbrytningar men inte fler än en tom rad i följd", () => {
  assert.equal(manyLines("a\n\n\n\n\nb  \nc\r\n"), "a\n\nb\nc");
  assert.equal(validateRequest(good({ meddelande: "Hej\n\n\n\nTack" }), ctx).value.meddelande, "Hej\n\nTack");
});

test("Mejlet innehåller allt förvaltaren behöver, i den ordning styrelsen valde", () => {
  const v = validateRequest(good({ nuvarande: "Gamla Förvaltning AB", forvaltare: ["sbc", "nabo"], behov: "bada" }), ctx).value;
  const mail = buildEmail(
    v,
    [
      { slug: "nabo", name: "Nabo", website: "https://nabo.example" },
      { slug: "sbc", name: "SBC", website: "https://sbc.example" },
    ],
    new Date(now),
  );
  assert.equal(mail.subject, "Offertförfrågan: Brf Solgläntan, Malmö (48 lgh)");
  assert.equal(mail.replyTo, "anna@example.se");
  for (const part of ["Brf Solgläntan", "Malmö", "48", "Ekonomisk och teknisk förvaltning", "Gamla Förvaltning AB", "Anna Svensson", "Ordförande", "anna@example.se", "070-123 45 67", "Vi vill byta förvaltare vid årsskiftet.", CONSENT_TEXT]) {
    assert.ok(mail.text.includes(part), part);
  }
  assert.ok(mail.text.indexOf("- SBC, https://sbc.example") < mail.text.indexOf("- Nabo, https://nabo.example"), "Valordningen bevaras");
  assert.ok(!hasDash(mail.subject + mail.text));
});

test("Valfria fält som lämnats tomma står som Anges inte", () => {
  const v = validateRequest(good({ nuvarande: "", roll: "", telefon: "", meddelande: "" }), ctx).value;
  const text = buildEmail(v, [{ slug: "nabo", name: "Nabo", website: "https://nabo.example" }], new Date(now)).text;
  assert.ok(text.includes("Nuvarande förvaltare: Anges inte"));
  assert.ok(text.includes("Roll i föreningen: Anges inte"));
  assert.ok(text.includes("Telefon: Anges inte"));
  assert.ok(text.includes("Inget meddelande."));
});

test("Ämnesraden är aldrig längre än 150 tecken och har ingen radbrytning", () => {
  const long = "A".repeat(LIMITS.forening);
  const v = validateRequest(good({ forening: long, ort: "B".repeat(LIMITS.ort) }), ctx).value;
  const { subject } = buildEmail(v, [], new Date(now));
  assert.ok(subject.length <= 150);
  assert.ok(!/[\r\n]/.test(subject));
});

test("sameOrigin kräver att Origin och Host pekar på samma värd", () => {
  assert.equal(sameOrigin("https://brfforvaltare.se", "brfforvaltare.se"), true);
  assert.equal(sameOrigin("http://localhost:3000", "localhost:3000"), true);
  assert.equal(sameOrigin("https://annan.example", "brfforvaltare.se"), false);
  assert.equal(sameOrigin(null, "brfforvaltare.se"), false);
  assert.equal(sameOrigin("https://brfforvaltare.se", null), false);
  assert.equal(sameOrigin("inte en url", "brfforvaltare.se"), false);
});
