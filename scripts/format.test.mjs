import test from "node:test";
import assert from "node:assert/strict";
import { tidy, tidyDeep, kr } from "../lib/format.ts";

const NB = " ";

test("tidy håller ihop tusental och belopp", () => {
  assert.equal(tidy("1 100 till 1 300 kr per lägenhet"), `1${NB}100 till 1${NB}300${NB}kr per lägenhet`);
  assert.equal(tidy("Över 178 972 bostadsrätter i 4 204 föreningar"), `Över 178${NB}972 bostadsrätter i 4${NB}204 föreningar`);
});

test("tidy rör inte datum, årtal eller vanliga ord", () => {
  assert.equal(tidy("Läst 26 oktober 2026"), "Läst 26 oktober 2026");
  assert.equal(tidy("Sidan anger 3 alternativ"), "Sidan anger 3 alternativ");
});

test("tidy sätter hårt mellanrum före kr, st, procent och %", () => {
  assert.equal(tidy("från 645 kr"), `från 645${NB}kr`);
  assert.equal(tidy("96 procent och 78 %"), `96${NB}procent och 78${NB}%`);
});

test("tidyDeep går igenom objekt och listor men lämnar tal och null", () => {
  const out = tidyDeep({ a: "1 000 kr", b: ["2 500"], c: 5, d: null, e: { f: "x" } });
  assert.deepEqual(out, { a: `1${NB}000${NB}kr`, b: [`2${NB}500`], c: 5, d: null, e: { f: "x" } });
});

test("kr använder hårt mellanrum", () => {
  assert.equal(kr(28469), `28${NB}469${NB}kr`);
});
