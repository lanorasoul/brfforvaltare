import test from "node:test";
import assert from "node:assert/strict";
import { categoriesOf, combineMatches, guideQuery, listParam, matchGuide, parseGuide, parsePick } from "../lib/guide.ts";
import { GUIDE_LGH, MAX_PICK, ORT_MAX } from "../lib/limits.ts";

const features = { ekonomisk: ["bokforing", "budget", "imd"], teknisk: ["underhallsplan", "jour"] };

/** Gör om en frågesträng till samma form som Next ger sidan: upprepade nycklar blir en lista. */
function paramsOf(qs) {
  const out = {};
  for (const [k, v] of new URLSearchParams(qs)) out[k] = out[k] === undefined ? v : [].concat(out[k], v);
  return out;
}

test("Utan svar i adressen gäller ekonomisk förvaltning, 50 lägenheter och ingen ort", () => {
  const g = parseGuide({}, features);
  assert.deepEqual(g, { need: "ekonomisk", ort: "", lgh: GUIDE_LGH.default, wishes: [], asked: false });
});

test("Ett ogiltigt val av förvaltning räknas som att formuläret inte skickats", () => {
  const g = parseGuide({ behov: "fastighetsskotsel", ort: "Malmö" }, features);
  assert.equal(g.asked, false);
  assert.equal(g.need, "ekonomisk");
});

test("Giltiga svar läses och städas", () => {
  const g = parseGuide({ behov: "teknisk", ort: "  Malmö   city ", lgh: "75" }, features);
  assert.deepEqual(g, { need: "teknisk", ort: "Malmö city", lgh: 75, wishes: [], asked: true });
});

test("Första värdet gäller när en nyckel upprepas", () => {
  assert.equal(parseGuide({ behov: ["bada", "teknisk"] }, features).need, "bada");
});

test("Antal lägenheter hålls inom gränserna och faller tillbaka på 50 när det inte går att tolka", () => {
  assert.equal(parseGuide({ lgh: "1" }, features).lgh, GUIDE_LGH.min);
  assert.equal(parseGuide({ lgh: "9999" }, features).lgh, GUIDE_LGH.max);
  assert.equal(parseGuide({ lgh: "12.6" }, features).lgh, 13);
  for (const bad of ["abc", "", "0", "-5", undefined]) assert.equal(parseGuide({ lgh: bad }, features).lgh, GUIDE_LGH.default, String(bad));
});

test("Ortsnamnet kapas vid största längd", () => {
  assert.equal(parseGuide({ ort: "x".repeat(ORT_MAX + 40) }, features).ort.length, ORT_MAX);
});

test("Önskemål följer vald förvaltning, kommer i schemats ordning och okända tas bort", () => {
  const raw = { onskar: ["imd,jour", "budget", "finns-inte"] };
  assert.deepEqual(parseGuide({ behov: "ekonomisk", ...raw }, features).wishes, ["budget", "imd"]);
  assert.deepEqual(parseGuide({ behov: "teknisk", ...raw }, features).wishes, ["jour"]);
  assert.deepEqual(parseGuide({ behov: "bada", ...raw }, features).wishes, ["budget", "imd", "jour"]);
});

test("Svaren blir en adress som ger samma svar tillbaka", () => {
  const input = { need: "bada", ort: "Upplands Väsby", lgh: 120, wishes: ["budget", "jour"] };
  const back = parseGuide(paramsOf(guideQuery(input)), features);
  assert.deepEqual({ ...back, asked: undefined }, { ...input, asked: undefined });
  assert.equal(back.asked, true);
});

test("En tom ort lämnas ur adressen", () => {
  assert.equal(guideQuery({ need: "ekonomisk", ort: "", lgh: 50, wishes: [] }), "behov=ekonomisk&lgh=50");
});

test("listParam delar kommaseparerade och upprepade värden utan tomma poster", () => {
  assert.deepEqual(listParam(["a,b", " c ", ""]), ["a", "b", "c"]);
  assert.deepEqual(listParam(undefined), []);
});

test("categoriesOf ger rätt delar för varje behov", () => {
  assert.deepEqual(categoriesOf("ekonomisk"), ["ekonomisk"]);
  assert.deepEqual(categoriesOf("teknisk"), ["teknisk"]);
  assert.deepEqual(categoriesOf("bada"), ["ekonomisk", "teknisk"]);
});

test("combineMatches: ingen ort ger null, nej vinner, sedan okänd, sedan hela landet", () => {
  assert.equal(combineMatches([]), null);
  assert.equal(combineMatches([null, null]), null);
  assert.equal(combineMatches(["listed", "no"]), "no");
  assert.equal(combineMatches(["national", "unknown"]), "unknown");
  assert.equal(combineMatches(["national", "national"]), "national");
  assert.equal(combineMatches(["national", "listed"]), "listed");
  assert.equal(combineMatches(["listed"]), "listed");
});

const row = (slug, name, scope, places, region = null) => ({ slug, name, region, coverage: { scope, places } });

const data = {
  rows: {
    ekonomisk: [
      row("nabo", "Nabo", "national", []),
      row("sbc", "SBC", "regional", ["Malmö", "Stockholm"]),
      row("hsb-x", "HSB X", "regional", ["Umeå"], "HSB X"),
      row("okand", "Okänd", "unknown", []),
    ],
    teknisk: [row("sbc", "SBC", "regional", ["Malmö"]), row("hsb-x", "HSB X", "regional", ["Umeå"], "HSB X"), row("fastum", "Fastum", "national", [])],
  },
  missing: {
    ekonomisk: [{ slug: "fastum", name: "Fastum", state: "no" }],
    teknisk: [
      { slug: "nabo", name: "Nabo", state: "unknown" },
      { slug: "okand", name: "Okänd", state: "unknown" },
    ],
  },
};

const names = (list) => list.map((r) => r.name);

test("Utan ort visas alla som har delen, i namnordning, och ingen döljs", () => {
  const out = matchGuide(data, { need: "ekonomisk", ort: "" });
  assert.deepEqual(names(out.results), ["HSB X", "Nabo", "Okänd", "SBC"]);
  assert.deepEqual(out.hidden, []);
  assert.deepEqual(out.results.map((r) => r.match), [null, null, null, null]);
  assert.deepEqual(out.missing, [{ slug: "fastum", name: "Fastum", lacks: [{ category: "ekonomisk", state: "no" }] }]);
});

test("En ort döljer bara de som nämner andra orter. Hela landet och okända orter visas med märke", () => {
  const out = matchGuide(data, { need: "ekonomisk", ort: "Malmö" });
  assert.deepEqual(names(out.results), ["Nabo", "Okänd", "SBC"]);
  assert.deepEqual(out.results.map((r) => r.match), ["national", "unknown", "listed"]);
  assert.deepEqual(out.hidden, [{ slug: "hsb-x", name: "HSB X" }]);
});

test("Ortsmatchningen följer samma regler som filtret på startsidan (utan å, ä, ö, från tre bokstäver)", () => {
  assert.deepEqual(names(matchGuide(data, { need: "ekonomisk", ort: "malmo" }).results), ["Nabo", "Okänd", "SBC"]);
  assert.deepEqual(names(matchGuide(data, { need: "ekonomisk", ort: "Ume" }).results), ["HSB X", "Nabo", "Okänd"]);
});

test("Teknisk förvaltning visar bara de som har den, och säger vilka som saknar den", () => {
  const out = matchGuide(data, { need: "teknisk", ort: "" });
  assert.deepEqual(names(out.results), ["Fastum", "HSB X", "SBC"]);
  assert.deepEqual(out.missing, [
    { slug: "nabo", name: "Nabo", lacks: [{ category: "teknisk", state: "unknown" }] },
    { slug: "okand", name: "Okänd", lacks: [{ category: "teknisk", state: "unknown" }] },
  ]);
});

test("Båda delarna kräver båda på förvaltarens sidor. De som saknar en del listas som saknande", () => {
  const out = matchGuide(data, { need: "bada", ort: "" });
  assert.deepEqual(names(out.results), ["HSB X", "SBC"]);
  assert.deepEqual(out.missing.map((m) => [m.name, m.lacks.map((l) => `${l.category}:${l.state}`)]), [
    ["Fastum", ["ekonomisk:no"]],
    ["Nabo", ["teknisk:unknown"]],
    ["Okänd", ["teknisk:unknown"]],
  ]);
  assert.deepEqual(Object.keys(out.results[0].rows), ["ekonomisk", "teknisk"]);
});

test("Båda delarna och en ort: en del som bara nämner andra orter döljer förvaltaren", () => {
  const split = {
    rows: {
      ekonomisk: [row("a", "A", "regional", ["Malmö"])],
      teknisk: [row("a", "A", "regional", ["Umeå"])],
    },
    missing: { ekonomisk: [], teknisk: [] },
  };
  assert.deepEqual(names(matchGuide(split, { need: "ekonomisk", ort: "Malmö" }).results), ["A"]);
  const both = matchGuide(split, { need: "bada", ort: "Malmö" });
  assert.deepEqual(both.results, []);
  assert.deepEqual(both.hidden, [{ slug: "a", name: "A" }]);
});

test("Ordningen är namnordning oavsett i vilken ordning datan ligger", () => {
  const reversed = {
    rows: { ekonomisk: [...data.rows.ekonomisk].reverse(), teknisk: [...data.rows.teknisk].reverse() },
    missing: { ekonomisk: [...data.missing.ekonomisk].reverse(), teknisk: [...data.missing.teknisk].reverse() },
  };
  for (const need of ["ekonomisk", "teknisk", "bada"]) {
    assert.deepEqual(matchGuide(reversed, { need, ort: "" }), matchGuide(data, { need, ort: "" }), need);
  }
});

test("Varje förvaltare hamnar på exakt ett ställe: visad, dold eller saknande", () => {
  for (const need of ["ekonomisk", "teknisk", "bada"]) {
    for (const ort of ["", "Malmö", "Umeå", "Kiruna"]) {
      const out = matchGuide(data, { need, ort });
      const all = [...out.results, ...out.hidden, ...out.missing].map((x) => x.slug);
      assert.equal(all.length, new Set(all).size, `${need} ${ort}`);
      assert.equal(all.length, 5, `${need} ${ort}`);
    }
  }
});

test("parsePick tar bara förvaltare som finns bland de tillåtna, utan dubbletter, högst tre", () => {
  const allowed = ["a", "b", "c", "d"];
  assert.deepEqual(parsePick({ f: ["a", "b", "a", "x"] }, allowed), { slugs: ["a", "b"], dropped: 1 });
  assert.deepEqual(parsePick({ f: "a,b,c,d" }, allowed), { slugs: ["a", "b", "c"], dropped: 1 });
  assert.deepEqual(parsePick({}, allowed), { slugs: [], dropped: 0 });
  assert.equal(MAX_PICK, 3);
});
