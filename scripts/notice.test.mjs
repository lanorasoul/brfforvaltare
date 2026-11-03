import test from "node:test";
import assert from "node:assert/strict";
import { addMonths, daysBetween, monthsBetween, noticePlan, rollingPlan } from "../lib/notice.ts";

test("addMonths kläms till sista dagen i månaden", () => {
  assert.equal(addMonths("2027-05-31", -3), "2027-02-28");
  assert.equal(addMonths("2028-05-31", -3), "2028-02-29");
  assert.equal(addMonths("2026-12-31", -3), "2026-09-30");
  assert.equal(addMonths("2026-12-31", 12), "2027-12-31");
  assert.equal(addMonths("2026-01-15", -2), "2025-11-15");
});

test("daysBetween och monthsBetween", () => {
  assert.equal(daysBetween("2026-10-26", "2026-10-27"), 1);
  assert.equal(daysBetween("2026-10-26", "2026-09-30"), -26);
  assert.equal(monthsBetween("2026-10-26", "2026-12-31"), 2);
  assert.equal(monthsBetween("2026-10-26", "2027-09-30"), 11);
});

test("ERF:s villkor, tre månader före årsskiftet, utan förnyelse: datumet har passerat", () => {
  const p = noticePlan({ today: "2026-10-26", end: "2026-12-31", months: 3, autoRenew: false });
  assert.equal(p.deadline, "2026-09-30");
  assert.equal(p.termEnd, "2026-12-31");
  assert.equal(p.passed, true);
  assert.equal(p.rolled, 0);
  assert.equal(p.daysLeft, -26);
});

test("Med automatisk förnyelse räknas nästa period fram", () => {
  const p = noticePlan({ today: "2026-10-26", end: "2026-12-31", months: 3, autoRenew: true });
  assert.equal(p.termEnd, "2027-12-31");
  assert.equal(p.deadline, "2027-09-30");
  assert.equal(p.rolled, 1);
  assert.equal(p.passed, false);
  assert.equal(p.daysLeft, 339);
});

test("Sista dagen i dag räknas inte som passerad", () => {
  const p = noticePlan({ today: "2026-09-30", end: "2026-12-31", months: 3, autoRenew: false });
  assert.equal(p.passed, false);
  assert.equal(p.daysLeft, 0);
});

test("Noll månaders uppsägningstid ger slutdatumet", () => {
  const p = noticePlan({ today: "2026-10-26", end: "2027-03-31", months: 0, autoRenew: false });
  assert.equal(p.deadline, "2027-03-31");
});

test("Flera förnyelser räknas fram", () => {
  const p = noticePlan({ today: "2029-01-10", end: "2026-12-31", months: 6, autoRenew: true });
  assert.equal(p.termEnd, "2029-12-31");
  assert.equal(p.deadline, "2029-06-30");
  assert.equal(p.rolled, 3);
});

test("Löpande avtal: slutet är uppsägningstiden efter dagens datum", () => {
  const p = rollingPlan("2026-10-26", 6);
  assert.equal(p.termEnd, "2027-04-26");
  assert.equal(p.deadline, "2026-10-26");
  assert.equal(p.daysLeft, 0);
  assert.equal(p.passed, false);
});
