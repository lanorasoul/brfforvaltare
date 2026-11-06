// Kontrollerar att datan är fullständig och spårbar innan bygget körs.
// Körs automatiskt av "npm run build". Avbryter vid fel.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dir = path.join(root, "data", "providers");
const schema = JSON.parse(fs.readFileSync(path.join(root, "data", "schema.json"), "utf8"));
const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const CATEGORIES = ["ekonomisk", "teknisk"];
const STATUS = new Set(["verified", "estimated", "assumed"]);
const PRESENCE = new Set(["published", "partial", "notfound"]);
const SERVICE = new Set(["yes", "no", "unknown"]);
const VAT = new Set(["excl", "incl", "unknown"]);
const FEATURE_STATE = new Set(Object.keys(schema.featureStates));
const COVERAGE = new Set(["national", "regional", "unknown"]);
const SOURCE_SCOPE = new Set([...CATEGORIES, "general"]);
const RATING_KIND = new Set(["nki", "reco", "trustpilot", "google", "egen"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
// Tankstreck (U+2013), långt tankstreck (U+2014) och minustecken (U+2212) är inte tillåtna i innehåll.
const BANNED = /[\u2013\u2014\u2212]/;
// Egna formuleringar får inte rangordna. Förvaltarnas citat ligger i claims och undantas.
const RANKING = /\b(bäst|bästa|billigast|billigaste|nummer ett)\b/i;

function walkStrings(value, fn, pathStr = "") {
  if (typeof value === "string") fn(value, pathStr);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, fn, `${pathStr}[${i}]`));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walkStrings(v, fn, `${pathStr}.${k}`);
}

// Schemat själv.
for (const c of CATEGORIES) {
  for (const list of ["features", "disclosure"]) {
    const keys = (schema[list][c] ?? []).map((x) => x.key);
    if (keys.length === 0) err("schema.json", `${list}.${c} saknas`);
    if (new Set(keys).size !== keys.length) err("schema.json", `${list}.${c} har dubbletter`);
    for (const x of schema[list][c] ?? []) if (!x.label || !x.help) err("schema.json", `${list}.${c}.${x.key} saknar label eller help`);
  }
}
const featureKeys = Object.fromEntries(CATEGORIES.map((c) => [c, new Set(schema.features[c].map((x) => x.key))]));
const disclosureKeys = Object.fromEntries(CATEGORIES.map((c) => [c, schema.disclosure[c].map((x) => x.key)]));

// HSB är fristående regionala föreningar. Antalet står i lib/site.ts och ska stämma med texten hos varje HSB-förening.
const siteTs = fs.readFileSync(path.join(root, "lib", "site.ts"), "utf8");
const hsbTotal = siteTs.match(/HSB_REGIONALS_TOTAL\s*=\s*(\d+)/)?.[1];
if (!hsbTotal) err("lib/site.ts", "HSB_REGIONALS_TOTAL saknas");

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const slugs = new Set();
let blocks = { ekonomisk: 0, teknisk: 0 };

for (const f of files) {
  let p;
  try {
    p = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  } catch (e) {
    err(f, `ogiltig JSON: ${e.message}`);
    continue;
  }
  if (p.slug + ".json" !== f) err(f, `slug "${p.slug}" matchar inte filnamnet`);
  if (slugs.has(p.slug)) err(f, "dubblett av slug");
  slugs.add(p.slug);
  for (const k of ["name", "website", "summary", "checked"]) if (!p[k]) err(f, `saknar ${k}`);
  if (!ISO.test(p.checked ?? "")) err(f, "checked måste vara ISO-datum");
  if (!/^https:\/\//.test(p.website ?? "")) err(f, "website måste börja med https://");
  if (p.region !== null && typeof p.region !== "string") err(f, "region måste vara text eller null");
  if (!("group" in p)) err(f, "group saknas (använd null om inget anges)");
  if (!("customers" in p)) err(f, "customers saknas (använd null om inget anges)");
  if (p.slug === "hsb") {
    if (!p.group?.text || (hsbTotal && !p.group.text.includes(hsbTotal))) err(f, `HSB: group.text ska nämna att HSB har ${hsbTotal} regionala föreningar`);
  }
  if (p.slug?.startsWith("hsb-")) err(f, "HSB visas som en förvaltare (hsb.json). Lägg regionala uppgifter där.");

  // Källor
  const sourceById = new Map();
  if (!Array.isArray(p.sources) || p.sources.length === 0) err(f, "minst en källa krävs");
  for (const s of p.sources ?? []) {
    if (!s.id || sourceById.has(s.id)) err(f, `källa utan unikt id: ${s.id}`);
    sourceById.set(s.id, s);
    if (!/^https:\/\//.test(s.url ?? "")) err(f, `källa ${s.id}: url måste börja med https://`);
    if (!s.title) err(f, `källa ${s.id}: saknar titel`);
    if (!ISO.test(s.checked ?? "")) err(f, `källa ${s.id}: checked måste vara ISO-datum`);
    if (!SOURCE_SCOPE.has(s.scope)) err(f, `källa ${s.id}: scope måste vara ekonomisk, teknisk eller general`);
  }
  const latest = [...sourceById.values()].map((s) => s.checked).sort().at(-1);
  if (latest && p.checked !== latest) err(f, `checked (${p.checked}) ska vara datumet för den senast lästa källan (${latest})`);

  const used = new Set();
  const needSource = (id, where, category) => {
    const s = sourceById.get(id);
    if (!s) return err(f, `${where} pekar på okänd källa "${id}"`);
    used.add(id);
    if (category && s.scope !== category && s.scope !== "general") err(f, `${where}: källa ${id} har scope ${s.scope} men används för ${category}`);
  };

  if (p.group) needSource(p.group.source, "group.source");
  if (p.customers) needSource(p.customers.source, "customers.source");

  // Fakta och betyg
  const fx = p.facts;
  if (!fx || typeof fx !== "object") err(f, "facts saknas");
  else {
    const year = new Date().getFullYear();
    for (const k of ["founded", "clients", "offices", "employees"]) {
      const v = fx[k];
      if (v === undefined) continue;
      if (!v.text) err(f, `facts.${k}: text saknas`);
      needSource(v.source, `facts.${k}.source`);
    }
    if (fx.founded && !(Number.isInteger(fx.founded.year) && fx.founded.year > 1800 && fx.founded.year <= year)) err(f, "facts.founded.year är inte ett rimligt år");
    for (const k of ["clients", "employees"]) if (fx[k] && !(Number.isFinite(fx[k].value) && fx[k].value > 0)) err(f, `facts.${k}.value måste vara ett positivt tal`);
    if (fx.offices && (!Number.isInteger(fx.offices.count) || fx.offices.count < 1 || !Array.isArray(fx.offices.places))) err(f, "facts.offices behöver count (minst 1) och places");
    if (!Array.isArray(fx.terms)) err(f, "facts.terms måste vara en lista");
    for (const [i, t] of (fx.terms ?? []).entries()) {
      if (!t.text) err(f, `facts.terms[${i}]: text saknas`);
      needSource(t.source, `facts.terms[${i}].source`);
    }
    if (!Array.isArray(fx.ratings)) err(f, "facts.ratings måste vara en lista");
    for (const [i, r] of (fx.ratings ?? []).entries()) {
      const at = `facts.ratings[${i}]`;
      if (!RATING_KIND.has(r.kind)) err(f, `${at}: okänd kind ${r.kind}`);
      if (r.scale !== 100 && r.scale !== 5) err(f, `${at}: scale måste vara 100 eller 5`);
      if (!(typeof r.value === "number" && r.value >= 0 && r.value <= r.scale)) err(f, `${at}: value utanför skalan`);
      if (r.kind === "nki" && (r.scale !== 100 || !Number.isInteger(r.year) || !Number.isInteger(r.average) || r.by !== "oberoende")) err(f, `${at}: NKI kräver scale 100, year, average och by oberoende`);
      if (r.kind !== "nki" && r.scale !== 5) err(f, `${at}: omdömen har scale 5`);
      if ((r.kind === "reco" || r.kind === "trustpilot") && r.by === "oberoende" && !Number.isInteger(r.count)) err(f, `${at}: antal omdömen saknas`);
      if (r.by !== "oberoende" && r.by !== "förvaltaren") err(f, `${at}: by måste vara oberoende eller förvaltaren`);
      if (!r.text) err(f, `${at}: text saknas`);
      needSource(r.source, `${at}.source`);
    }
  }
  for (const id of p.moreSources ?? []) needSource(id, "moreSources");

  // Tjänster
  for (const k of [...CATEGORIES, "fastighetsskotsel"]) if (!SERVICE.has(p.services?.[k])) err(f, `services.${k} måste vara yes, no eller unknown`);
  for (const c of CATEGORIES) {
    const has = p[c] != null;
    if (has && p.services?.[c] !== "yes") err(f, `${c}-block finns men services.${c} är inte yes`);
    if (!has && p.services?.[c] === "yes") err(f, `services.${c} är yes men ${c}-block saknas`);
    if (!(c in p)) err(f, `${c} saknas (använd null om förvaltaren inte erbjuder den)`);
  }
  if (!p.ekonomisk && !p.teknisk) err(f, "minst en av ekonomisk och teknisk krävs");

  for (const c of CATEGORIES) {
    const b = p[c];
    if (!b) continue;
    blocks[c]++;
    const at = (k) => `${c}.${k}`;
    if (!b.summary) err(f, `${at("summary")} saknas`);
    needSource(b.source, at("source"), c);
    for (const id of b.moreSources ?? []) needSource(id, at("moreSources"), c);

    // Pris
    const pr = b.pricing;
    if (!pr) err(f, `${at("pricing")} saknas`);
    else {
      needSource(pr.source, at("pricing.source"), c);
      if (!["list", "examples", "rule_of_thumb", "on_request"].includes(pr.model)) err(f, `${c}: okänd prismodell ${pr.model}`);
      if (pr.model !== "on_request") {
        if (!STATUS.has(pr.status)) err(f, `${at("pricing.status")} måste vara verified, estimated eller assumed`);
        if (!VAT.has(pr.vat)) err(f, `${at("pricing.vat")} måste vara excl, incl eller unknown`);
      }
      if (pr.model === "on_request" && !pr.text) err(f, `${at("pricing.text")} saknas`);
      if (pr.model === "list") {
        if (!ISO.test(pr.priceDate ?? "")) err(f, "list: priceDate krävs");
        const a = pr.anchors ?? [];
        if (a.length < 2) err(f, "list: minst två ankarpunkter");
        for (let i = 1; i < a.length; i++) {
          if (a[i].lgh < a[i - 1].lgh) err(f, "list: ankarpunkter måste vara sorterade");
          if (a[i].perYear < a[i - 1].perYear) err(f, "list: priset får inte sjunka med storleken");
        }
      }
      if (pr.model === "examples" && (pr.examples ?? []).length < 1) err(f, "examples: minst ett exempel");
      if (pr.model === "rule_of_thumb" && typeof pr.perLgh !== "number") err(f, "rule_of_thumb: perLgh krävs");
      // Prisräknaren gäller ekonomisk förvaltning. Tekniska priser får inte räknas fram.
      if (c === "teknisk" && pr.model !== "on_request") err(f, "teknisk förvaltning får bara ha prismodell on_request tills någon publicerar ett pris");
    }

    // Villkor
    if (!b.terms) err(f, `${at("terms")} saknas`);
    if (b.terms?.noticeSource) needSource(b.terms.noticeSource, at("terms.noticeSource"), c);
    if (b.terms?.notice && !b.terms.noticeSource) err(f, `${at("terms.notice")} kräver noticeSource`);

    // Listor
    for (const k of ["included", "levels", "extras", "digital", "reporting", "claims"]) if (!Array.isArray(b[k])) err(f, `${at(k)} måste vara en lista`);
    for (const l of b.levels ?? []) if (!l.name || !l.text) err(f, `${at("levels")}: varje nivå kräver name och text`);
    for (const x of b.extras ?? []) {
      if (!x.label) err(f, `${at("extras")}: varje tillval kräver label`);
      if (x.source) needSource(x.source, at("extras"), c);
      if (x.source && !x.price) err(f, `${at("extras")}: "${x.label}" har source men inget pris`);
    }
    for (const cl of b.claims ?? []) {
      needSource(cl.source, at("claim"), c);
      if (cl.by !== "förvaltaren") err(f, `${at("claim")}: by måste vara "förvaltaren"`);
      if (!cl.text) err(f, `${at("claim")}: text saknas`);
    }

    // Täckning
    const cov = b.coverage;
    if (!cov) err(f, `${at("coverage")} saknas`);
    else {
      if (!COVERAGE.has(cov.scope)) err(f, `${at("coverage.scope")} måste vara national, regional eller unknown`);
      if (!cov.text) err(f, `${at("coverage.text")} saknas`);
      if (!Array.isArray(cov.places)) err(f, `${at("coverage.places")} måste vara en lista`);
      else if (new Set(cov.places).size !== cov.places.length) err(f, `${at("coverage.places")} har dubbletter`);
      if (cov.scope === "regional" && (cov.places ?? []).length === 0) err(f, `${at("coverage")}: regional täckning kräver minst en ort`);
      needSource(cov.source, at("coverage.source"), c);
    }

    // Funktioner
    for (const [k, v] of Object.entries(b.features ?? {})) {
      if (!featureKeys[c].has(k)) err(f, `${at("features")}: okänd funktion "${k}"`);
      if (!FEATURE_STATE.has(v)) err(f, `${at("features." + k)} måste vara ${[...FEATURE_STATE].join(", ")}`);
    }
    if (!b.features) err(f, `${at("features")} saknas`);
    if (c === "ekonomisk" && Object.values(b.features ?? {}).includes("level") && (b.levels ?? []).length === 0) {
      err(f, "ekonomisk: en funktion är markerad som nivåberoende men inga nivåer finns");
    }
    if (c === "teknisk" && Object.values(b.features ?? {}).includes("level") && (b.levels ?? []).length === 0) {
      err(f, "teknisk: en funktion är markerad som nivåberoende men inga nivåer finns");
    }

    // Öppenhet
    const d = b.disclosure ?? {};
    const want = disclosureKeys[c];
    for (const k of want) if (!PRESENCE.has(d[k])) err(f, `${at("disclosure." + k)} måste vara published, partial eller notfound`);
    for (const k of Object.keys(d)) if (!want.includes(k)) err(f, `${at("disclosure")}: okänd nyckel "${k}"`);

    // Konsistens: published kräver underlag i datan
    if (d.price === "published" && pr?.model !== "list") err(f, `${c}: disclosure.price=published kräver prismodell list`);
    if (d.price === "partial" && pr?.model === "on_request" && !(b.extras ?? []).some((x) => x.price) && !(pr.notes ?? []).length) {
      err(f, `${c}: disclosure.price=partial med prismodell on_request kräver ett prissatt tillval eller en not om priset`);
    }
    if (d.notice === "published" && !b.terms?.notice) err(f, `${c}: disclosure.notice=published kräver terms.notice`);
    if (d.notice === "partial" && !b.terms?.notice && !(b.terms?.other ?? []).length) err(f, `${c}: disclosure.notice=partial kräver terms.notice eller terms.other`);
    if (d.included === "published" && (b.included ?? []).length < 3) err(f, `${c}: disclosure.included=published kräver minst tre punkter`);
    if (d.included === "partial" && (b.included ?? []).length < 1 && (b.levels ?? []).length < 1) err(f, `${c}: disclosure.included=partial kräver innehåll`);
    if (d.extras === "published" && (b.extras ?? []).length < 3) err(f, `${c}: disclosure.extras=published kräver minst tre tillval`);
    if (d.extras === "partial" && (b.extras ?? []).length < 1 && (b.notes ?? []).length < 1) {
      err(f, `${c}: disclosure.extras=partial utan tillval kräver en not som förklarar varför`);
    }
    if (d.extras === "notfound" && (b.extras ?? []).length > 0) err(f, `${c}: disclosure.extras=notfound men tillval finns`);
    if (d.portal === "published" && (b.digital ?? []).length < 1) err(f, `${c}: disclosure.portal=published kräver digital`);
    if (d.portal === "partial" && (b.digital ?? []).length < 1) err(f, `${c}: disclosure.portal=partial kräver digital`);
    if (d.customers === "published" && !p.customers) err(f, `${c}: disclosure.customers=published kräver customers`);
    if (d.customers === "partial" && !p.customers) err(f, `${c}: disclosure.customers=partial kräver customers`);
    if (d.levels === "published" && (b.levels ?? []).length < 2) err(f, `${c}: disclosure.levels=published kräver minst två nivåer`);
    if (d.levels === "partial" && (b.levels ?? []).length < 1) err(f, `${c}: disclosure.levels=partial kräver minst en nivå`);
    if (d.levels === "notfound" && (b.levels ?? []).length > 0) err(f, `${c}: disclosure.levels=notfound men nivåer finns`);
    if ((d.emergency === "published" || d.emergency === "partial") && (b.reporting ?? []).length < 1) err(f, `${c}: disclosure.emergency=${d.emergency} kräver reporting`);
    if (d.emergency === "notfound" && (b.reporting ?? []).length > 0) err(f, `${c}: disclosure.emergency=notfound men reporting finns`);
  }

  for (const id of sourceById.keys()) if (!used.has(id)) warn(f, `källa ${id} används inte av någon uppgift`);

  // Förbjudna tecken överallt. Förbjudna rangordningsord i våra egna formuleringar, inte i förvaltarnas citat.
  walkStrings(p, (s, where) => {
    if (BANNED.test(s)) err(f, `otillåtet tankstreck eller minustecken i ${where}`);
  });
  const own = structuredClone(p);
  for (const c of CATEGORIES) if (own[c]) own[c].claims = [];
  walkStrings(own, (s, where) => {
    if (RANKING.test(s)) err(f, `rangordningsord i ${where}: "${s.slice(0, 60)}"`);
  });
}

try {
  const ref = JSON.parse(fs.readFileSync(path.join(root, "data", "reference.json"), "utf8"));
  walkStrings(ref, (s, where) => {
    if (BANNED.test(s)) err("reference.json", `otillåtet tankstreck i ${where}`);
  });
} catch (e) {
  err("reference.json", `ogiltig JSON: ${e.message}`);
}
walkStrings(schema, (s, where) => {
  if (BANNED.test(s)) err("schema.json", `otillåtet tankstreck i ${where}`);
});

if (warnings.length) console.warn(`\nVarningar (${warnings.length}):\n` + warnings.map((w) => "  - " + w).join("\n") + "\n");
if (errors.length) {
  console.error(`\nDatakontrollen misslyckades (${errors.length} fel):\n` + errors.map((e) => "  - " + e).join("\n") + "\n");
  process.exit(1);
}
console.log(
  `Datakontroll ok: ${files.length} förvaltare (${blocks.ekonomisk} ekonomiska och ${blocks.teknisk} tekniska delar), alla uppgifter har källa och datum.`,
);
