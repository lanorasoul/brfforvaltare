"use client";

/** Sista utvägen om själva sidmallen inte kan ritas. Står på egna ben, utan sajtens stilmallar. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="sv">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#141418", background: "#fff" }}>
        <main style={{ maxWidth: 560, margin: "18vh auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: 40, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Något gick fel</h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: "#55565e", margin: "0 0 24px" }}>Sidan kunde inte visas just nu. Försök igen om en stund.</p>
          <button type="button" onClick={() => reset()} style={{ height: 48, padding: "0 22px", border: 0, borderRadius: 14, background: "#141418", color: "#fff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            Försök igen
          </button>
        </main>
      </body>
    </html>
  );
}
