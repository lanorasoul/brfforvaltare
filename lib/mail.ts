import "server-only";

// Skickar mejlet med en offertförfrågan till den som driver sajten. Inget sparas här, och inga personuppgifter skrivs till loggen.
// Tjänsten är Resend (https://resend.com/docs/api-reference/emails/send-email). Byt ut den här filen om en annan tjänst väljs.

export interface Mail {
  subject: string;
  text: string;
  /** Styrelsens e-postadress, så att ett svar går till dem. */
  replyTo?: string;
}

export type SendResult = { ok: true } | { ok: false; reason: "config" | "provider" };

type Env = Record<string, string | undefined>;

export async function sendMail(mail: Mail, env: Env = process.env): Promise<SendResult> {
  const key = env.RESEND_API_KEY;
  const to = env.REQUEST_TO_EMAIL;
  const from = env.REQUEST_FROM_EMAIL;
  if (!key || !to || !from) return { ok: false, reason: "config" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: mail.subject,
        text: mail.text,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Mejlet kunde inte skickas. E-posttjänsten svarade ${res.status}.`);
      return { ok: false, reason: "provider" };
    }
    return { ok: true };
  } catch {
    console.error("Mejlet kunde inte skickas. Ingen kontakt med e-posttjänsten.");
    return { ok: false, reason: "provider" };
  }
}
