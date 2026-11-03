import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fitLine } from "../lib/fit.ts";

const dir = path.join(import.meta.dirname, "..", "data", "providers");
const erf = { pricing: JSON.parse(fs.readFileSync(path.join(dir, "erf.json"), "utf8")).ekonomisk.pricing };

test("ERF:s prislista följer en rak linje med fast del och pris per lägenhet", () => {
  const fit = fitLine(erf.pricing.anchors);
  assert.ok(fit);
  assert.ok(Math.abs(fit.base - 7688) < 5, `fast del ${fit.base}`);
  assert.ok(Math.abs(fit.slope - 594) < 1, `per lägenhet ${fit.slope}`);
  assert.ok(fit.maxError <= 1.5, `största avvikelse ${fit.maxError}`);
});

test("För få punkter ger ingen linje", () => {
  assert.equal(fitLine([{ lgh: 20, perYear: 1 }, { lgh: 50, perYear: 2 }]), null);
});

test("Punkter som inte ligger på en linje får stor avvikelse", () => {
  const fit = fitLine([
    { lgh: 20, perYear: 26000 },
    { lgh: 50, perYear: 55000 },
    { lgh: 100, perYear: 70000 },
  ]);
  assert.ok(fit);
  assert.ok(fit.maxError > 1000);
});
