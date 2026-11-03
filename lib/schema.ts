// Etiketter och listor som både sajten och datakontrollen använder. Källan är data/schema.json.
import schema from "../data/schema.json";
import type { Category, FeatureState, Presence, Provider, ServiceBlock } from "./types";

export const CATEGORIES: Category[] = ["ekonomisk", "teknisk"];

export const CATEGORY: Record<Category, { label: string; short: string; path: string; what: string }> = schema.categories;

export interface FeatureDef {
  key: string;
  label: string;
  help: string;
}

export const FEATURES: Record<Category, FeatureDef[]> = schema.features;

export const DISCLOSURE_KEYS: Record<Category, FeatureDef[]> = schema.disclosure;

export const FEATURE_STATE: Record<FeatureState, { label: string; help: string }> = schema.featureStates as Record<
  FeatureState,
  { label: string; help: string }
>;

export const FEATURE_STATE_ORDER: FeatureState[] = ["included", "level", "optional", "listed"];

/** Förvaltare som har ett block för kategorin, i den ordning de redan ligger. */
export function withBlock(providers: Provider[], category: Category): { provider: Provider; block: ServiceBlock }[] {
  return providers.flatMap((provider) => {
    const block = provider[category];
    return block ? [{ provider, block }] : [];
  });
}

/** Presence-värden i fast ordning, för sammanräkning. */
export const PRESENCE_ORDER: Presence[] = ["published", "partial", "notfound"];
