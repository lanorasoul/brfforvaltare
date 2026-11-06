"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "./icons";
import { num } from "@/lib/format";
import { NEED_LABEL, NEEDS, type Need } from "@/lib/guide";
import { CONSENT_TEXT, LIMITS, type FieldErrors, type SubmitResponse } from "@/lib/requests";

interface Props {
  /** De valda förvaltarna, i den ordning styrelsen kryssade dem. */
  providers: { slug: string; name: string }[];
  initial: { ort: string; lgh: string; behov: Need };
  /** Serverns signerade tidsstämpel från när sidan ritades. Skickas tillbaka oförändrad. */
  token: string;
  mode: "preview" | "live";
  /** Tillbaka till guiden med samma svar. */
  backHref: string;
}

const FIELD_ORDER: (keyof FieldErrors)[] = ["forening", "ort", "lgh", "behov", "nuvarande", "namn", "roll", "epost", "telefon", "meddelande", "samtycke", "forvaltare", "form"];

/** Formuläret för en offertförfrågan. Skickas som JSON till /api/forfragan, som inte sparar något. */
export function RequestForm({ providers, initial, token, mode, backHref }: Props) {
  const [v, setV] = useState({
    forening: "",
    ort: initial.ort,
    lgh: initial.lgh,
    behov: initial.behov as Need,
    nuvarande: "",
    namn: "",
    roll: "",
    epost: "",
    telefon: "",
    meddelande: "",
  });
  const [consent, setConsent] = useState(false);
  const [trap, setTrap] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [general, setGeneral] = useState<string | null>(null);
  const [done, setDone] = useState<SubmitResponse | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const errorKeys = FIELD_ORDER.filter((k) => errors[k]);
  const hasProblem = errorKeys.length > 0 || general !== null;

  useEffect(() => {
    if (hasProblem) summaryRef.current?.focus();
  }, [hasProblem, errors, general]);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((prev) => ({ ...prev, [k]: e.target.value }));

  const describe = (k: keyof FieldErrors, hint = false) => [errors[k] ? `rf-${k}-err` : null, hint ? `rf-${k}-hint` : null].filter(Boolean).join(" ") || undefined;
  const invalid = (k: keyof FieldErrors) => (errors[k] ? true : undefined);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setGeneral(null);
    try {
      const res = await fetch("/api/forfragan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, forvaltare: providers.map((p) => p.slug), samtycke: consent, webbplats: trap, token }),
      });
      const data = (await res.json()) as SubmitResponse;
      if (data.ok) setDone(data);
      else if (data.reason === "invalid") setErrors(data.errors);
      else setGeneral(data.message);
    } catch {
      setGeneral("Det gick inte att nå sajten. Kontrollera uppkopplingen och försök igen.");
    } finally {
      setBusy(false);
    }
  }

  if (done && done.ok) {
    const names = providers.map((p) => p.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} och ${names[names.length - 1]}` : names[0];
    return (
      <div className="panel rf-done" ref={doneRef} tabIndex={-1} role="status">
        {done.mode === "preview" ? (
          <>
            <h2 className="h3">Förhandsvisning: ingenting skickades</h2>
            <p className="muted">Läget är satt till förhandsvisning, så inget mejl har gått iväg och inget är sparat. Så här skulle mejlet se ut:</p>
            <p className="rf-preview-subject">
              <strong>{done.preview.subject}</strong>
            </p>
            <pre className="rf-preview">{done.preview.text}</pre>
          </>
        ) : (
          <>
            <h2 className="h3">Tack, förfrågan är skickad</h2>
            <p className="muted">
              Vi skickar den vidare till {list}. De svarar er direkt på e-postadressen ni angav. Vi kan inte säga när de svarar, och ni väljer själva om ni går vidare med någon av dem.
            </p>
            <p className="small muted">Vi sparar ingenting på sajten. Förfrågan finns bara i vår e-post tills den är skickad vidare.</p>
          </>
        )}
        <div className="gsec-actions">
          <Link className="btn btn-dark" href={backHref}>
            Tillbaka till förvaltarna
            <span className="btn-icon">
              <ArrowIcon size={12} />
            </span>
          </Link>
          <Link className="btn btn-light btn-flat" href="/byta-forvaltare">
            Läs hur man byter förvaltare
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="rf" onSubmit={submit} noValidate>
      {hasProblem && (
        <div className="rf-summary" ref={summaryRef} tabIndex={-1} role="alert">
          <p className="rf-summary-title">{errorKeys.length > 0 ? "Det saknas något eller är fel ifyllt" : "Förfrågan skickades inte"}</p>
          {general && <p>{general}</p>}
          {errorKeys.length > 0 && (
            <ul>
              {errorKeys.map((k) => (
                <li key={k}>
                  {k === "form" || k === "forvaltare" ? errors[k] : <a href={`#rf-${k}`}>{errors[k]}</a>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <fieldset className="rf-set">
        <legend className="h4 rf-legend">Om föreningen</legend>

        <div className="rf-field">
          <label className="rf-label" htmlFor="rf-forening">
            Föreningens namn
          </label>
          <input id="rf-forening" name="forening" className="rf-input" type="text" autoComplete="organization" maxLength={LIMITS.forening} value={v.forening} onChange={set("forening")} aria-invalid={invalid("forening")} aria-describedby={describe("forening")} />
          {errors.forening && (
            <p className="rf-error" id="rf-forening-err">
              {errors.forening}
            </p>
          )}
        </div>

        <div className="rf-row">
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-ort">
              Ort
            </label>
            <input id="rf-ort" name="ort" className="rf-input" type="text" autoComplete="address-level2" maxLength={LIMITS.ort} value={v.ort} onChange={set("ort")} aria-invalid={invalid("ort")} aria-describedby={describe("ort")} />
            {errors.ort && (
              <p className="rf-error" id="rf-ort-err">
                {errors.ort}
              </p>
            )}
          </div>
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-lgh">
              Antal lägenheter
            </label>
            <input id="rf-lgh" name="lgh" className="rf-input rf-input-short" type="text" inputMode="numeric" autoComplete="off" value={v.lgh} onChange={set("lgh")} aria-invalid={invalid("lgh")} aria-describedby={describe("lgh")} />
            {errors.lgh && (
              <p className="rf-error" id="rf-lgh-err">
                {errors.lgh}
              </p>
            )}
          </div>
        </div>

        <fieldset className="rf-field rf-choices" id="rf-behov" aria-describedby={describe("behov")}>
          <legend className="rf-label">Vad vill ni ha offert på?</legend>
          <div className="g-choice">
            {NEEDS.map((n) => (
              <label key={n} className="g-pill">
                <input className="g-pill-input" type="radio" name="behov" value={n} checked={v.behov === n} onChange={() => setV((prev) => ({ ...prev, behov: n }))} />
                <span className="g-pill-text">{NEED_LABEL[n]}</span>
              </label>
            ))}
          </div>
          {errors.behov && (
            <p className="rf-error" id="rf-behov-err">
              {errors.behov}
            </p>
          )}
        </fieldset>

        <div className="rf-field">
          <label className="rf-label" htmlFor="rf-nuvarande">
            Nuvarande förvaltare <span className="rf-opt">(valfritt)</span>
          </label>
          <p className="rf-hint" id="rf-nuvarande-hint">
            Lämna tomt om ni inte har någon eller inte vill säga.
          </p>
          <input id="rf-nuvarande" name="nuvarande" className="rf-input" type="text" autoComplete="off" maxLength={LIMITS.nuvarande} value={v.nuvarande} onChange={set("nuvarande")} aria-invalid={invalid("nuvarande")} aria-describedby={describe("nuvarande", true)} />
          {errors.nuvarande && (
            <p className="rf-error" id="rf-nuvarande-err">
              {errors.nuvarande}
            </p>
          )}
        </div>
      </fieldset>

      <fieldset className="rf-set">
        <legend className="h4 rf-legend">Kontakt</legend>

        <div className="rf-row">
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-namn">
              Ert namn
            </label>
            <input id="rf-namn" name="namn" className="rf-input" type="text" autoComplete="name" maxLength={LIMITS.namn} value={v.namn} onChange={set("namn")} aria-invalid={invalid("namn")} aria-describedby={describe("namn")} />
            {errors.namn && (
              <p className="rf-error" id="rf-namn-err">
                {errors.namn}
              </p>
            )}
          </div>
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-roll">
              Roll i föreningen <span className="rf-opt">(valfritt)</span>
            </label>
            <input id="rf-roll" name="roll" className="rf-input" type="text" autoComplete="organization-title" maxLength={LIMITS.roll} value={v.roll} onChange={set("roll")} aria-invalid={invalid("roll")} aria-describedby={describe("roll")} />
            {errors.roll && (
              <p className="rf-error" id="rf-roll-err">
                {errors.roll}
              </p>
            )}
          </div>
        </div>

        <div className="rf-row">
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-epost">
              E-post
            </label>
            <input id="rf-epost" name="epost" className="rf-input" type="email" autoComplete="email" maxLength={LIMITS.epost} value={v.epost} onChange={set("epost")} aria-invalid={invalid("epost")} aria-describedby={describe("epost")} />
            {errors.epost && (
              <p className="rf-error" id="rf-epost-err">
                {errors.epost}
              </p>
            )}
          </div>
          <div className="rf-field">
            <label className="rf-label" htmlFor="rf-telefon">
              Telefon <span className="rf-opt">(valfritt)</span>
            </label>
            <input id="rf-telefon" name="telefon" className="rf-input" type="tel" autoComplete="tel" maxLength={LIMITS.telefon} value={v.telefon} onChange={set("telefon")} aria-invalid={invalid("telefon")} aria-describedby={describe("telefon")} />
            {errors.telefon && (
              <p className="rf-error" id="rf-telefon-err">
                {errors.telefon}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset className="rf-set">
        <legend className="h4 rf-legend">Meddelande</legend>
        <div className="rf-field">
          <label className="rf-label" htmlFor="rf-meddelande">
            Något förvaltaren bör veta <span className="rf-opt">(valfritt)</span>
          </label>
          <p className="rf-hint" id="rf-meddelande-hint">
            Till exempel när avtalet går ut, vad ni är missnöjda med eller vad ni särskilt vill ha med.
          </p>
          <textarea id="rf-meddelande" name="meddelande" className="rf-input rf-textarea" rows={5} maxLength={LIMITS.meddelande} value={v.meddelande} onChange={set("meddelande")} aria-invalid={invalid("meddelande")} aria-describedby={describe("meddelande", true)} />
          <p className="fine rf-count">
            <span className="num">{num(v.meddelande.length)}</span> av {num(LIMITS.meddelande)} tecken
          </p>
          {errors.meddelande && (
            <p className="rf-error" id="rf-meddelande-err">
              {errors.meddelande}
            </p>
          )}
        </div>
      </fieldset>

      {/* Dolt fält för att stoppa automatiska formulärfyllare. Människor ser det inte och når det inte med tangentbordet. */}
      <div className="rf-trap" aria-hidden="true">
        <label>
          Webbplats
          <input type="text" name="webbplats" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
        </label>
      </div>

      <div className="rf-consent">
        <label className="rf-check">
          <input id="rf-samtycke" className="cbox" type="checkbox" name="samtycke" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={invalid("samtycke")} aria-describedby={describe("samtycke")} />
          <span>{CONSENT_TEXT}</span>
        </label>
        {errors.samtycke && (
          <p className="rf-error" id="rf-samtycke-err">
            {errors.samtycke}
          </p>
        )}
        <p className="fine">
          <Link className="link" href="/integritet" target="_blank" rel="noopener noreferrer">
            Så hanteras uppgifterna
          </Link>{" "}
          (öppnas i ny flik). Vi sparar ingenting på sajten.
        </p>
      </div>

      <div className="rf-actions">
        <button type="submit" className="btn btn-accent" disabled={busy}>
          {busy ? "Skickar" : mode === "preview" ? "Skicka förfrågan (förhandsvisning)" : "Skicka förfrågan"}
          <span className="btn-icon">
            <ArrowIcon />
          </span>
        </button>
        <Link className="link" href={backHref}>
          Ändra urvalet
        </Link>
      </div>
    </form>
  );
}
