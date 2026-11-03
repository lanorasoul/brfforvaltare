import test from "node:test";
import assert from "node:assert/strict";
import { effectiveMode, launchProblems, mailConfigured, parseMode } from "../lib/launch.ts";

const operator = { name: "Exempel AB", orgnr: null, address: null };
const closed = { mode: "off", indexable: false, operator: null, contactEmail: null, mailConfigured: false };

test("Läget är stängt om inget annat anges eller om värdet är okänt", () => {
  assert.equal(parseMode(undefined), "off");
  assert.equal(parseMode(""), "off");
  assert.equal(parseMode("on"), "off");
  assert.equal(parseMode("preview"), "preview");
  assert.equal(parseMode("live"), "live");
});

test("Live utan angiven avsändare räknas som stängt, förhandsvisning påverkas inte", () => {
  assert.equal(effectiveMode("live", null), "off");
  assert.equal(effectiveMode("live", operator), "live");
  assert.equal(effectiveMode("preview", null), "preview");
  assert.equal(effectiveMode("off", operator), "off");
});

test("mailConfigured kräver alla tre inställningarna", () => {
  const all = { RESEND_API_KEY: "k", REQUEST_TO_EMAIL: "a@b.se", REQUEST_FROM_EMAIL: "c@d.se" };
  assert.equal(mailConfigured(all), true);
  for (const key of Object.keys(all)) assert.equal(mailConfigured({ ...all, [key]: "" }), false, key);
  assert.equal(mailConfigured({}), false);
});

test("Sajten som den levereras, stängd för sökmotorer och förfrågningar, har inget som hindrar", () => {
  assert.deepEqual(launchProblems(closed), []);
});

test("Förhandsvisning får inte köras publikt", () => {
  assert.equal(launchProblems({ ...closed, mode: "preview" }).length, 1);
});

test("Live kräver både avsändare och mejlinställningar", () => {
  const problems = launchProblems({ ...closed, mode: "live" });
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.includes("operator")));
  assert.ok(problems.some((p) => p.includes("RESEND_API_KEY")));
  assert.deepEqual(launchProblems({ ...closed, mode: "live", operator, mailConfigured: true }), []);
});

test("Sökmotorer släpps in först när avsändare och kontaktadress finns", () => {
  const problems = launchProblems({ ...closed, indexable: true });
  assert.equal(problems.length, 2);
  assert.deepEqual(launchProblems({ ...closed, indexable: true, operator, contactEmail: "kontakt@exempel.se" }), []);
  assert.equal(launchProblems({ ...closed, indexable: true, operator }).length, 1);
});

test("Allt klart ger inga problem", () => {
  assert.deepEqual(launchProblems({ mode: "live", indexable: true, operator, contactEmail: "kontakt@exempel.se", mailConfigured: true }), []);
});
