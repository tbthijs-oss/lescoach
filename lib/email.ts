/**
 * E-mail verzending via Resend. Valt terug op consolelog als er geen
 * RESEND_API_KEY is ingesteld — handig tijdens dev. Opzet is minimaal:
 * één functie, platte HTML template, inline styles (mail-clients
 * negeren external styles).
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<{ sent: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Noor <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY ontbreekt — e-mail niet verzonden. Inhoud:`);
    console.warn(`[email] To: ${to}`);
    console.warn(`[email] Subject: ${subject}`);
    console.warn(`[email] Text: ${text}`);
    return { sent: false };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Resend-fout (${res.status}): ${body}`);
    return { sent: false };
  }

  return { sent: true };
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function magicLinkEmail(params: {
  naam: string;
  loginUrl: string;
  schoolnaam?: string;
  isFirstLogin?: boolean;
}): { subject: string; html: string; text: string } {
  const { naam, loginUrl, schoolnaam, isFirstLogin } = params;
  const greet = naam ? `Hoi ${naam},` : "Hoi,";
  const intro = isFirstLogin
    ? `Je bent uitgenodigd om Noor te gebruiken${schoolnaam ? ` vanuit ${schoolnaam}` : ""}. Klik op onderstaande knop om in te loggen.`
    : `Klik op onderstaande knop om in te loggen bij LesCoach.`;

  const text = `${greet}\n\n${intro}\n\n${loginUrl}\n\nDe link is 15 minuten geldig en kan één keer gebruikt worden.\n\nHeb je geen inlogverzoek gedaan? Dan kun je deze mail negeren.\n\n— Noor\nLesCoach`;

  const html = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8" /><title>Inloggen bij LesCoach</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Inter',system-ui,-apple-system,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        <tr><td>
          <div style="font-size:14px;color:#64748b;margin-bottom:8px;">LesCoach</div>
          <h1 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#0f172a;">Inloggen bij Noor</h1>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.55;color:#334155;">${greet}</p>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.55;color:#334155;">${intro}</p>
          <p style="margin:0 0 24px 0;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px;">Inloggen</a>
          </p>
          <p style="margin:0 0 8px 0;font-size:13px;line-height:1.55;color:#64748b;">Werkt de knop niet? Plak onderstaande link in je browser:</p>
          <p style="margin:0 0 24px 0;font-size:13px;line-height:1.45;color:#475569;word-break:break-all;">${loginUrl}</p>
          <p style="margin:0 0 4px 0;font-size:13px;line-height:1.55;color:#64748b;">De link is 15 minuten geldig en kan één keer gebruikt worden.</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:#64748b;">Heb je geen inlogverzoek gedaan? Negeer deze mail gerust.</p>
        </td></tr>
      </table>
      <div style="margin-top:16px;font-size:12px;color:#94a3b8;">Noor — specialist speciaal onderwijs · lescoach.nl</div>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = isFirstLogin
    ? `Welkom bij Noor${schoolnaam ? ` van ${schoolnaam}` : ""}`
    : "Je inloglink voor Noor";

  return { subject, html, text };
}
