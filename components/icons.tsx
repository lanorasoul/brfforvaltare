import { FEATURE_STATE } from "@/lib/schema";
import type { FeatureState, Presence, Status } from "@/lib/types";

type P = { size?: number; className?: string };

export function ArrowIcon({ size = 14 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M7.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ size = 14, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ size = 14, className }: P) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.8 7.4l2.6 2.6 5.8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExternalIcon({ size = 12 }: P) {
  return (
    <svg className="ext" width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M4.5 2.5h5v5M9.5 2.5l-6.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Märke: tre gånger tre prickar, en tänd. */
export function BrandMark({ size = 22 }: P) {
  const xs = [4, 11, 18];
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" aria-hidden="true">
      {xs.flatMap((x, i) =>
        xs.map((y, j) => (
          <circle key={`${i}${j}`} cx={x} cy={y} r={2.1} fill={i === 1 && j === 2 ? "var(--accent)" : "currentColor"} opacity={i === 1 && j === 2 ? 1 : 0.9} />
        )),
      )}
    </svg>
  );
}

/** Status på en siffra. Fylld prick: verifierat. Halv: uppskattning. Ring: antagande. Streckad ring: inget pris. */
export function StatusMark({ status, size = 12, className }: { status: Status | "none"; size?: number; className?: string }) {
  const r = size / 2 - 1;
  const c = size / 2;
  return (
    <svg className={`mark ${className ?? ""}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {status === "verified" && <circle cx={c} cy={c} r={r} fill="currentColor" />}
      {status === "estimated" && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill="currentColor" />
        </>
      )}
      {status === "assumed" && <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {status === "none" && <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 2.2" strokeLinecap="round" />}
    </svg>
  );
}

export const STATUS_LABEL: Record<Status | "none", string> = {
  verified: "Verifierat",
  estimated: "Uppskattning",
  assumed: "Antagande",
  none: "Inget pris angivet",
};

/** Matrisens tre lägen. Bock i cirkel: publicerat. Halv cirkel: delvis. Streckad ring: ej funnet. */
export function PresenceMark({ presence, size = 20 }: { presence: Presence; size?: number }) {
  const r = size / 2 - 1.5;
  const c = size / 2;
  if (presence === "published") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r + 0.5} fill="currentColor" />
        <path d={`M ${c - 3.6} ${c + 0.2} l 2.5 2.6 l 4.8 -5`} fill="none" stroke="var(--presence-check, #fff)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (presence === "partial") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" strokeLinecap="round" />
    </svg>
  );
}

export const PRESENCE_LABEL: Record<Presence, string> = {
  published: "Publicerat",
  partial: "Delvis",
  notfound: "Ej funnet",
};

/**
 * Funktionsmatrisens fem lägen. Alla skiljer sig i form, inte bara i ton.
 * Fylld cirkel med bock: ingår. Halv cirkel: ingår i vissa nivåer. Ring med plus: tillval.
 * Ring med prick: nämns utan besked om det ingår. Streckad ring: står inte på sidan vi läste.
 */
export function FeatureMark({ state, size = 18 }: { state: FeatureState | "none"; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 1.5;
  if (state === "included") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r + 0.5} fill="currentColor" />
        <path d={`M ${c - 3.4} ${c + 0.2} l 2.4 2.5 l 4.6 -4.8`} fill="none" stroke="var(--presence-check, #fff)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (state === "level") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill="currentColor" />
      </svg>
    );
  }
  if (state === "optional") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d={`M ${c - 3.2} ${c} h 6.4 M ${c} ${c - 3.2} v 6.4`} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === "listed") {
    return (
      <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx={c} cy={c} r={2.1} fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg className="mark" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 3" strokeLinecap="round" />
    </svg>
  );
}

export const FEATURE_LABEL: Record<FeatureState | "none", string> = {
  included: FEATURE_STATE.included.label,
  level: FEATURE_STATE.level.label,
  optional: FEATURE_STATE.optional.label,
  listed: FEATURE_STATE.listed.label,
  none: "Inte listad",
};
