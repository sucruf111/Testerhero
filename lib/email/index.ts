import "server-only";
import { getBaseUrl } from "@/lib/config";
import { signUnsubscribeToken } from "@/lib/auth/tokens";

export type EmailContent = {
  subject: string;
  /** Vorschauzeile im Posteingang */
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** zusätzliche Infobox mit Label und Wert */
  highlight?: { label: string; value: string }[];
  footnote?: string;
};

type Recipient = { id: string; email: string; firstName: string };

type Message = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  headers?: Record<string, string>;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function unsubscribeLinks(testerId: string) {
  const token = await signUnsubscribeToken(testerId);
  const base = getBaseUrl();
  return {
    page: `${base}/abmelden?token=${token}`,
    oneClick: `${base}/api/abmelden?token=${token}`,
  };
}

function renderHtml(content: EmailContent, unsubscribeUrl: string | null) {
  const base = getBaseUrl();
  const paragraphs = content.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3d3a52">${escapeHtml(p)}</p>`)
    .join("");
  const highlight = content.highlight?.length
    ? `<table role="presentation" width="100%" style="margin:8px 0 24px;background:#fff6ef;border-radius:14px" cellpadding="0" cellspacing="0"><tr><td style="padding:18px 20px">${content.highlight
        .map(
          (h) =>
            `<div style="font-size:13px;color:#8a5a3c;margin-bottom:2px">${escapeHtml(h.label)}</div><div style="font-size:17px;font-weight:700;color:#1d1a3b;margin-bottom:10px">${escapeHtml(h.value)}</div>`,
        )
        .join("")}</td></tr></table>`
    : "";
  const cta = content.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:#ff5a36"><a href="${content.cta.url}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(content.cta.label)}</a></td></tr></table>`
    : "";
  const footnote = content.footnote
    ? `<p style="margin:0;font-size:13px;line-height:1.6;color:#8a8799">${escapeHtml(content.footnote)}</p>`
    : "";
  const unsubscribe = unsubscribeUrl
    ? ` Du willst keine Produkte und E-Mails mehr? <a href="${unsubscribeUrl}" style="color:#8a8799">Hier abmelden</a>.`
    : "";

  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f6f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escapeHtml(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ea;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 8px 20px"><a href="${base}" style="text-decoration:none;font-size:20px;font-weight:800;color:#1d1a3b">Tester<span style="color:#ff5a36">Hero</span></a></td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:28px 28px;box-shadow:0 1px 2px rgba(29,26,59,.06)">
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#1d1a3b">${escapeHtml(content.heading)}</p>
${paragraphs}${highlight}${cta}<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#3d3a52">Viele Grüße<br>dein TesterHero-Team</p>${footnote}
</td></tr>
<tr><td style="padding:20px 8px;font-size:12px;line-height:1.6;color:#8a8799">Du bekommst diese E-Mail, weil du bei TesterHero angemeldet bist.${unsubscribe}<br><a href="${base}/impressum" style="color:#8a8799">Impressum</a> · <a href="${base}/datenschutz" style="color:#8a8799">Datenschutz</a></td></tr>
</table></td></tr></table></body></html>`;
}

function renderText(content: EmailContent, unsubscribeUrl: string | null) {
  return [
    content.heading,
    "",
    ...content.paragraphs.flatMap((p) => [p, ""]),
    ...(content.highlight ?? []).map((h) => `${h.label}: ${h.value}`),
    content.cta ? `\n${content.cta.label}: ${content.cta.url}\n` : "",
    "Viele Grüße",
    "dein TesterHero-Team",
    "",
    content.footnote ?? "",
    unsubscribeUrl ? `Abmelden: ${unsubscribeUrl}` : "",
  ].join("\n");
}

async function buildMessage(
  to: Recipient,
  content: EmailContent,
  opts: { includeUnsubscribe: boolean },
): Promise<Message> {
  const links = opts.includeUnsubscribe ? await unsubscribeLinks(to.id) : null;
  const message: Message = {
    from: process.env.EMAIL_FROM || "TesterHero <onboarding@resend.dev>",
    to: [to.email],
    subject: content.subject,
    html: renderHtml(content, links?.page ?? null),
    text: renderText(content, links?.page ?? null),
  };
  if (process.env.EMAIL_REPLY_TO) message.reply_to = process.env.EMAIL_REPLY_TO;
  if (links) {
    message.headers = {
      "List-Unsubscribe": `<${links.oneClick}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  return message;
}

function logInsteadOfSending(messages: Message[]) {
  for (const m of messages) {
    const links = [...m.text.matchAll(/https?:\/\/\S+/g)].map((x) => x[0]);
    console.info(
      `\n📧 [E-Mail – nicht versendet, RESEND_API_KEY fehlt]\n   An: ${m.to.join(", ")}\n   Betreff: ${m.subject}\n${links.map((l) => `   Link: ${l}`).join("\n")}\n`,
    );
  }
}

async function postToResend(path: string, body: unknown) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`E-Mail-Versand fehlgeschlagen (${res.status}): ${detail}`);
  }
}

/**
 * Sendet eine E-Mail an einen Tester.
 * Abgemeldete oder gesperrte Tester erhalten nur noch reine Konto-Mails (z. B. Passwort-Reset).
 */
export async function sendEmail(
  to: Recipient,
  content: EmailContent,
  opts: { transactional?: boolean } = {},
) {
  const message = await buildMessage(to, content, { includeUnsubscribe: !opts.transactional });
  if (!process.env.RESEND_API_KEY) {
    logInsteadOfSending([message]);
    return;
  }
  try {
    await postToResend("/emails", message);
  } catch (error) {
    console.error(error);
  }
}

/** Massenversand (z. B. neues Produkt) – in Paketen à 100 über die Resend-Batch-API. */
export async function sendBulkEmail(
  recipients: Recipient[],
  build: (r: Recipient) => EmailContent,
) {
  const messages = await Promise.all(
    recipients.map((r) => buildMessage(r, build(r), { includeUnsubscribe: true })),
  );
  if (!process.env.RESEND_API_KEY) {
    logInsteadOfSending(messages);
    return { sent: messages.length, simulated: true };
  }
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    await postToResend("/emails/batch", chunk);
    sent += chunk.length;
  }
  return { sent, simulated: false };
}
