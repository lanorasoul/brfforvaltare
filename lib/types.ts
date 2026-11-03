// Datamodell. Allt ligger som JSON i data/ och valideras av scripts/validate-data.mjs.
// Varje uppgift ska kunna spåras till en källa (sources) med URL och datum.
// Den här filen innehåller bara typer. Värden som listor och etiketter ligger i lib/schema.ts.

/** Förvaltningens två delar. */
export type Category = "ekonomisk" | "teknisk";

/** Verifierat: står på förvaltarens egen sida. Uppskattning: beräknad av oss mellan eller utanför publicerade punkter. Antagande: vår tolkning där uppgiften är oklar. */
export type Status = "verified" | "estimated" | "assumed";

/** Publicerat: sidan säger det tydligt. Delvis: delvis eller indirekt. Ej funnet: står inte på sidan vi läste. */
export type Presence = "published" | "partial" | "notfound";

/** Hur en tjänst eller funktion står på förvaltarens sida. Ingen nyckel alls betyder att vi inte hittade den på sidan. */
export type FeatureState = "included" | "level" | "optional" | "listed";

export type Vat = "excl" | "incl" | "unknown";

export interface Source {
  id: string;
  url: string;
  title: string;
  /** ISO-datum då vi läste sidan. */
  checked: string;
  /** Datum eller version som sidan själv anger, om något. */
  pageDate?: string;
  /** Vilken del av förvaltningen sidan handlar om. */
  scope: Category | "general";
}

export interface Extra {
  label: string;
  price?: string;
  /** Källans id när priset står på en annan sida än avtalets prissida. */
  source?: string;
}

export interface Point {
  lgh: number;
  perYear: number;
}

export type Pricing =
  | {
      model: "list";
      vat: Vat;
      priceDate: string;
      anchors: Point[];
      openFrom?: Point;
      setupFee?: string;
      extras: Extra[];
      source: string;
      status: Status;
      notes?: string[];
    }
  | {
      model: "examples";
      vat: Vat;
      fromPerYear?: number;
      examples: Point[];
      disclaimer?: string;
      source: string;
      status: Status;
      notes?: string[];
    }
  | {
      model: "rule_of_thumb";
      vat: Vat;
      perLgh: number;
      periodStated: boolean;
      text: string;
      source: string;
      status: Status;
      notes?: string[];
    }
  | {
      model: "on_request";
      text: string;
      source: string;
      notes?: string[];
    };

export interface Claim {
  text: string;
  source: string;
  /** Vem som påstår det. Uppgifter från förvaltaren själv är inte oberoende kontrollerade. */
  by: "förvaltaren";
}

export type Service = "yes" | "no" | "unknown";

/** Namngiven nivå eller paket i ett avtal, till exempel Small och Medium hos Fastum. */
export interface Level {
  name: string;
  text: string;
}

/** Var förvaltaren säger att den verkar. Orterna är de som sidan själv nämner. */
export interface Coverage {
  scope: "national" | "regional" | "unknown";
  text: string;
  places: string[];
  source: string;
}

export interface Terms {
  notice: string | null;
  noticeSource?: string;
  other?: string[];
}

/** Allt vi vet om en förvaltares ekonomiska eller tekniska förvaltning. */
export interface ServiceBlock {
  summary: string;
  /** Huvudsidan för den här delen. */
  source: string;
  /** Fler sidor som uppgifterna i den här delen kommer från. */
  moreSources?: string[];
  pricing: Pricing;
  terms: Terms;
  /** Det sidan beskriver som innehåll i tjänsten. */
  included: string[];
  /** Namngivna nivåer eller paket. */
  levels: Level[];
  /** Tillval och tilläggstjänster. */
  extras: Extra[];
  digital: string[];
  /** Felanmälan, jour och beredskap. */
  reporting: string[];
  coverage: Coverage;
  /** Nyckel från schema.json. Saknas nyckeln hittade vi inte uppgiften på sidan. */
  features: Record<string, FeatureState>;
  claims: Claim[];
  /** Nycklarna är de som schema.json anger för kategorin. */
  disclosure: Record<string, Presence>;
  notes?: string[];
}

export interface Provider {
  slug: string;
  name: string;
  legalName?: string;
  website: string;
  /** Regional organisation, till exempel HSB Skåne. Null om förvaltaren själv inte anger något. */
  region: string | null;
  /** Senaste datum då vi läste en sida från förvaltaren. */
  checked: string;
  summary: string;
  /** Ägare eller koncern, om förvaltaren själv anger det. */
  group: { text: string; source: string } | null;
  customers: { text: string; source: string } | null;
  services: { ekonomisk: Service; teknisk: Service; fastighetsskotsel: Service };
  ekonomisk: ServiceBlock | null;
  teknisk: ServiceBlock | null;
  notes?: string[];
  /** Allmänna sidor som uppgifterna om förvaltaren som helhet kommer från. */
  moreSources?: string[];
  sources: Source[];
}

/** Uppgifter från någon som inte är förvaltare, till exempel en offertförmedlare. Visas alltid med avsändare och märks tydligt. */
export interface Reference {
  offerta: {
    title: string;
    url: string;
    checked: string;
    pageDate?: string;
    note: string;
    generalPerLghYear: { low: number; high: number };
    totalPerYear: { low: number; high: number };
    tiers: { key: string; label: string; includes: string; perLghYear: { low: number; high: number } }[];
  };
}
