"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowIcon, CheckIcon } from "./icons";
import type { Need } from "@/lib/guide";
import {
  CONSENT_MATCH_TEXT,
  LIMITS,
  looksLikeEmail,
  looksLikePhone,
  SERVICES,
  WISHES,
  type FieldErrors,
  type ServiceCategory,
  type SubmitResponse,
  type Upplagg,
  type Wish,
} from "@/lib/requests";

interface Props {
  /** Serverns klocka när sidan ritades. Skickas tillbaka så att tiden inte beror på webbläsarens klocka. */
  issuedAt: number;
  mode: "off" | "preview" | "live";
  initial: { behov: Need | null; ort: string; lgh: string };
}

const NEEDS: { key: Need; label: string; help: string }[] = [
  { key: "ekonomisk", label: "Ekonomisk förvaltning", help: "Bokföring, avier, budget och årsredovisning" },
  { key: "teknisk", label: "Teknisk förvaltning", help: "Fastigheten, underhållsplan och besiktningar" },
  { key: "bada", label: "Båda", help: "Ekonomisk och teknisk förvaltning" },
];

const STEPS = ["Behov", "Föreningen", "Kontakt"];

/** Vilket steg varje fält ligger i, så att ett fel från servern visar rätt steg. */
const STEP_OF: Partial<Record<keyof FieldErrors, number>> = {
  behov: 0,
  meddelande: 1,
  forening: 1,
  ort: 1,
  lgh: 1,
  nuvarande: 1,
  namn: 2,
  roll: 2,
  epost: 2,
  telefon: 2,
  samtycke: 2,
  form: 2,
};

export function MatchWizard({ issuedAt, mode, initial }: Props) {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [behov, setBehov] = useState<Need | null>(initial.behov);
  const [viktigt, setViktigt] = useState<Wish[]>([]);
  const [upplagg, setUpplagg] = useState<Upplagg>("tjanster");
  const [tjanster, setTjanster] = useState<Record<ServiceCategory, string[]>>({ ekonomisk: [], teknisk: [] });
  const toggleService = (c: ServiceCategory, k: string) =>
    setTjanster((cur) => ({ ...cur, [c]: cur[c].includes(k) ? cur[c].filter((x) => x !== k) : [...cur[c], k] }));
  const [v, setV] = useState({ meddelande: "", forening: "", ort: initial.ort, lgh: initial.lgh, nuvarande: "", namn: "", roll: "", epost: "", telefon: "" });
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<SubmitResponse | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    headRef.current?.focus();
  }, [step, done]);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  /** Samma regler som servern, så att styrelsen ser felet innan den går vidare. */
  function check(s: number): FieldErrors {
    const e: FieldErrors = {};
    if (s === 0 && !behov) e.behov = "Välj vad ni behöver hjälp med.";
    if (s === 1) {
      if (v.forening.trim().length < 2) e.forening = "Skriv föreningens namn.";
      if (v.ort.trim().length < 2) e.ort = "Skriv vilken ort föreningen ligger i.";
      const n = Number(v.lgh);
      if (!Number.isInteger(n) || n < 1) e.lgh = "Ange antal lägenheter.";
    }
    if (s === 2) {
      if (v.namn.trim().length < 2) e.namn = "Skriv ert namn.";
      if (!looksLikeEmail(v.epost.trim())) e.epost = "Skriv en e-postadress som vi kan svara till.";
      if (v.telefon.trim() !== "" && !looksLikePhone(v.telefon.trim())) e.telefon = "Telefonnumret ser inte rätt ut.";
      if (!consent) e.samtycke = "Godkänn att uppgifterna skickas vidare, annars kan vi inte matcha er.";
    }
    return e;
  }

  function next() {
    const e = check(step);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep((s) => s + 1);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (step < 2) return next();
    const e = check(2);
    setErrors(e);
    setGeneral(null);
    if (Object.keys(e).length > 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/forfragan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, lgh: Number(v.lgh), behov, viktigt, upplagg, tjanster, matcha: true, forvaltare: [], samtycke: true, webbplats: trap, t: issuedAt }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (data.ok) setDone(data);
      else if (data.reason === "invalid") {
        setErrors(data.errors);
        const steps = Object.keys(data.errors).map((k) => STEP_OF[k as keyof FieldErrors] ?? 2);
        setStep(Math.min(...steps));
      } else setGeneral(data.message);
    } catch {
      setGeneral("Vi fick ingen kontakt med servern. Kontrollera uppkopplingen och försök igen.");
    } finally {
      setBusy(false);
    }
  }

  if (done && done.ok) {
    return (
      <div className="wz-card wz-done">
        <span className="wz-done-mark" aria-hidden="true">
          <CheckIcon size={22} />
        </span>
        <h2 className="wz-title" tabIndex={-1} ref={headRef}>
          Tack! Vi matchar er med lämpliga förvaltare.
        </h2>
        <p className="wz-text">
          Vi går igenom det ni har skrivit och skickar er förfrågan till förvaltare som passar {v.forening}.{" "}
          {upplagg === "kontakt" ? `De kontaktar er på ${v.epost} för att gå igenom vad ni behöver och lämnar sedan en offert.` : `De kontaktar er på ${v.epost} med en offert.`}
        </p>
        <p className="wz-text">Ni är inte bundna till något. Det är gratis, och ni väljer själva om ni vill gå vidare med någon.</p>
        {done.mode === "preview" && (
          <details className="wz-preview">
            <summary>Förhandsläge: det här hade skickats</summary>
            <pre>{done.preview.text}</pre>
          </details>
        )}
        <Link className="btn btn-quiet" href="/#forvaltare">
          Jämför förvaltarna själva under tiden
        </Link>
      </div>
    );
  }

  const err = (k: keyof FieldErrors) =>
    errors[k] ? (
      <p className="wz-err" id={`${uid}-${k}-err`}>
        {errors[k]}
      </p>
    ) : null;
  const desc = (k: keyof FieldErrors) => (errors[k] ? `${uid}-${k}-err` : undefined);

  return (
    <form className="wz-card" onSubmit={submit} noValidate>
      <ol className="wz-progress" aria-label="Steg">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? "is-done" : i === step ? "is-now" : ""} aria-current={i === step ? "step" : undefined}>
            <span className="wz-dot">{i < step ? <CheckIcon size={11} /> : i + 1}</span>
            <span className="wz-step-label">{s}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="wz-step">
          <h2 className="wz-title" tabIndex={-1} ref={headRef}>
            Vad behöver ni hjälp med?
          </h2>
          <div className="wz-needs" role="group" aria-label="Förvaltning" aria-describedby={desc("behov")}>
            {NEEDS.map((n) => (
              <button key={n.key} type="button" className="wz-need" aria-pressed={behov === n.key} onClick={() => {
                  setBehov(n.key);
                  setErrors((p) => ({ ...p, behov: undefined }));
                }}>
                <strong>{n.label}</strong>
                <span>{n.help}</span>
              </button>
            ))}
          </div>
          {err("behov")}

          {behov && (
            <div className="wz-field">
              <span className="wz-label">Vet ni vad ni vill ha med?</span>
              <div className="wz-mode" role="group" aria-label="Upplägg">
                <button type="button" className="wz-mode-btn" aria-pressed={upplagg === "tjanster"} onClick={() => setUpplagg("tjanster")}>
                  <strong>Ja, vi väljer tjänster</strong>
                  <span>Kryssa i det ni vill ha</span>
                </button>
                <button type="button" className="wz-mode-btn" aria-pressed={upplagg === "kontakt"} onClick={() => setUpplagg("kontakt")}>
                  <strong>Kontakta oss först</strong>
                  <span>Vi tar det i en offert</span>
                </button>
              </div>
            </div>
          )}

          {behov && upplagg === "tjanster" &&
            (["ekonomisk", "teknisk"] as ServiceCategory[])
              .filter((c) => behov === "bada" || behov === c)
              .map((c) => (
                <fieldset key={c} className="wz-field">
                  <legend className="wz-label">
                    {c === "ekonomisk" ? "Ekonomisk förvaltning" : "Teknisk förvaltning"} <span className="wz-opt">Välj det ni vill ha med</span>
                  </legend>
                  <div className="wz-checks">
                    {SERVICES[c].map((x) => {
                      const on = tjanster[c].includes(x.key);
                      return (
                        <label key={x.key} className={on ? "wz-check is-on" : "wz-check"}>
                          <input type="checkbox" checked={on} onChange={() => toggleService(c, x.key)} />
                          {x.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}

          {behov && upplagg === "kontakt" && <p className="wz-note">Bra. Förvaltarna går igenom vad ni behöver med er och lämnar sedan en offert.</p>}
        </div>
      )}

      {step === 1 && (
        <div className="wz-step">
          <h2 className="wz-title" tabIndex={-1} ref={headRef}>
            Berätta om föreningen
          </h2>
          <div className="wz-field">
            <label className="wz-label" htmlFor={`${uid}-forening`}>
              Föreningens namn
            </label>
            <input id={`${uid}-forening`} className="wz-input" maxLength={LIMITS.forening} placeholder="Brf Exempel" value={v.forening} onChange={set("forening")} aria-invalid={!!errors.forening} aria-describedby={desc("forening")} />
            {err("forening")}
          </div>
          <div className="wz-row">
            <div className="wz-field">
              <label className="wz-label" htmlFor={`${uid}-ort`}>
                Ort
              </label>
              <input id={`${uid}-ort`} className="wz-input" maxLength={LIMITS.ort} autoComplete="address-level2" value={v.ort} onChange={set("ort")} aria-invalid={!!errors.ort} aria-describedby={desc("ort")} />
              {err("ort")}
            </div>
            <div className="wz-field wz-field-small">
              <label className="wz-label" htmlFor={`${uid}-lgh`}>
                Antal lägenheter
              </label>
              <input
                id={`${uid}-lgh`}
                className="wz-input"
                inputMode="numeric"
                value={v.lgh}
                onChange={(e) => setV((p) => ({ ...p, lgh: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                aria-invalid={!!errors.lgh}
                aria-describedby={desc("lgh")}
              />
              {err("lgh")}
            </div>
          </div>
          <div className="wz-field">
            <label className="wz-label" htmlFor={`${uid}-nuv`}>
              Nuvarande förvaltare <span className="wz-opt">Valfritt</span>
            </label>
            <input id={`${uid}-nuv`} className="wz-input" maxLength={LIMITS.nuvarande} value={v.nuvarande} onChange={set("nuvarande")} />
          </div>

          <fieldset className="wz-field">
            <legend className="wz-label">
              Vad är viktigast för er? <span className="wz-opt">Valfritt</span>
            </legend>
            <div className="wz-chips">
              {WISHES.map((w) => {
                const on = viktigt.includes(w.key);
                return (
                  <button key={w.key} type="button" className="wz-chip" aria-pressed={on} onClick={() => setViktigt((c) => (on ? c.filter((x) => x !== w.key) : [...c, w.key]))}>
                    {on && <CheckIcon size={12} />}
                    {w.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="wz-field">
            <label className="wz-label" htmlFor={`${uid}-msg`}>
              Något mer vi bör veta? <span className="wz-opt">Valfritt</span>
            </label>
            <textarea
              id={`${uid}-msg`}
              className="wz-input wz-area"
              rows={3}
              maxLength={LIMITS.meddelande}
              placeholder="Till exempel att ni har lokaler, garage eller ett stambyte på gång."
              value={v.meddelande}
              onChange={set("meddelande")}
              aria-describedby={desc("meddelande")}
            />
            {err("meddelande")}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wz-step">
          <h2 className="wz-title" tabIndex={-1} ref={headRef}>
            Vart ska vi skicka förslagen?
          </h2>
          <div className="wz-row">
            <div className="wz-field">
              <label className="wz-label" htmlFor={`${uid}-namn`}>
                Ert namn
              </label>
              <input id={`${uid}-namn`} className="wz-input" autoComplete="name" maxLength={LIMITS.namn} value={v.namn} onChange={set("namn")} aria-invalid={!!errors.namn} aria-describedby={desc("namn")} />
              {err("namn")}
            </div>
            <div className="wz-field">
              <label className="wz-label" htmlFor={`${uid}-roll`}>
                Roll i styrelsen <span className="wz-opt">Valfritt</span>
              </label>
              <input id={`${uid}-roll`} className="wz-input" maxLength={LIMITS.roll} placeholder="Till exempel ordförande" value={v.roll} onChange={set("roll")} />
            </div>
          </div>
          <div className="wz-row">
            <div className="wz-field">
              <label className="wz-label" htmlFor={`${uid}-epost`}>
                E-post
              </label>
              <input id={`${uid}-epost`} type="email" className="wz-input" autoComplete="email" maxLength={LIMITS.epost} value={v.epost} onChange={set("epost")} aria-invalid={!!errors.epost} aria-describedby={desc("epost")} />
              {err("epost")}
            </div>
            <div className="wz-field">
              <label className="wz-label" htmlFor={`${uid}-tel`}>
                Telefon <span className="wz-opt">Valfritt</span>
              </label>
              <input id={`${uid}-tel`} type="tel" className="wz-input" autoComplete="tel" maxLength={LIMITS.telefon} value={v.telefon} onChange={set("telefon")} aria-invalid={!!errors.telefon} aria-describedby={desc("telefon")} />
              {err("telefon")}
            </div>
          </div>
          <label className="wz-consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setErrors((p) => ({ ...p, samtycke: undefined }));
              }}
              aria-describedby={desc("samtycke")}
            />
            <span>
              {CONSENT_MATCH_TEXT}{" "}
              <Link className="link" href="/integritet" target="_blank">
                Så hanteras uppgifterna
              </Link>
            </span>
          </label>
          {err("samtycke")}
          <div className="wz-trap" aria-hidden="true">
            <label>
              Webbplats
              <input type="text" name="webbplats" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
            </label>
          </div>
          {mode === "off" && <p className="wz-note">Matchningen öppnar snart. Just nu skickas inga förfrågningar.</p>}
          {general && (
            <p className="wz-err" role="alert">
              {general}
            </p>
          )}
        </div>
      )}

      <div className="wz-nav">
        {step > 0 ? (
          <button type="button" className="wz-back" onClick={() => setStep((s) => s - 1)}>
            Tillbaka
          </button>
        ) : (
          <span />
        )}
        {step < 2 ? (
          <button type="submit" className="btn btn-accent">
            Nästa
            <span className="btn-icon">
              <ArrowIcon />
            </span>
          </button>
        ) : (
          <button type="submit" className="btn btn-accent" disabled={busy || mode === "off"}>
            {busy ? "Skickar..." : "Matcha oss med förvaltare"}
            <span className="btn-icon">
              <ArrowIcon />
            </span>
          </button>
        )}
      </div>
    </form>
  );
}
