import { NextRequest, NextResponse } from "next/server";

interface ContactInfo {
  naam: string;
  school: string;
  email: string;
  telefoon?: string;
  opmerkingen?: string;
}

interface Kenniskaart {
  id: string;
  titel: string;
  categorie: string;
  samenvatting: string;
  watIsHet?: string;
  gevolgen?: string;
  tips?: string;
  trefwoorden: string[];
  pdfUrl?: string;
  bronUrl?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      kenniskaarten,
      contact,
    }: {
      messages: Message[];
      kenniskaarten: Kenniskaart[];
      contact: ContactInfo;
    } = await request.json();

    if (!contact.naam || !contact.school || !contact.email) {
      return NextResponse.json(
        { error: "Naam, school en e-mailadres zijn verplicht." },
        { status: 400 }
      );
    }

    const expertEmail = process.env.EXPERT_EMAIL || "tbthijs@gmail.com";
    const resendKey = process.env.RESEND_API_KEY;

    const reportHtml = buildReportHtml(contact, messages, kenniskaarten);

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LesCoach <onboarding@resend.dev>",
          to: [expertEmail],
          reply_to: contact.email,
          subject: `LesCoach aanvraag: ${contact.naam} – ${contact.school}`,
          html: reportHtml,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Resend fout:", err);
        // Niet falen — rapport is gelogd
      }
    } else {
      // Fallback: log het rapport naar Vercel-logs
      console.log("=== LesCoach Expert Rapport ===");
      console.log("Contact:", JSON.stringify(contact, null, 2));
      console.log(
        "Kenniskaarten:",
        kenniskaarten.map((k) => k.titel).join(", ")
      );
      console.log(
        "Transcript:",
        messages.map((m) => `[${m.role}] ${m.content}`).join("\n---\n")
      );
      console.log("=== Einde rapport ===");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact expert fout:", error);
    return NextResponse.json(
      { error: "Er is iets misgegaan. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}

function buildReportHtml(
  contact: ContactInfo,
  messages: Message[],
  kenniskaarten: Kenniskaart[]
): string {
  const now = new Date().toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Filter out the auto-start message
  const relevantMessages = messages.filter(
    (m) =>
      !(
        m.role === "user" &&
        m.content === "Hallo, ik wil graag hulp voor een leerling."
      )
  );

  const transcriptRows = relevantMessages
    .map(
      (m) => `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 10px 14px; font-weight: 600; color: ${
          m.role === "user" ? "#2563eb" : "#374151"
        }; white-space: nowrap; vertical-align: top; width: 120px; font-size: 13px;">
          ${m.role === "user" ? contact.naam || "Leerkracht" : "LesCoach"}
        </td>
        <td style="padding: 10px 14px; color: #374151; font-size: 14px; line-height: 1.6;">
          ${m.content.replace(/\n/g, "<br>")}
        </td>
      </tr>
    `
    )
    .join("");

  const kenniskaartBlocks = kenniskaarten
    .map(
      (k) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; margin-bottom: 16px; background: white;">
        <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">${k.categorie}</div>
        <div style="font-size: 17px; font-weight: 700; color: #1f2937; margin: 4px 0 8px;">${k.titel}</div>
        ${k.trefwoorden?.length ? `<div style="margin-bottom: 10px;">${k.trefwoorden.map((t) => `<span style="display: inline-block; background: #eff6ff; color: #3b82f6; font-size: 11px; padding: 2px 8px; border-radius: 20px; margin-right: 4px;">${t}</span>`).join("")}</div>` : ""}
        <p style="color: #4b5563; margin: 0 0 12px; font-size: 14px; line-height: 1.6;">${k.samenvatting}</p>
        ${k.watIsHet ? `<div style="margin-bottom: 10px;"><div style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Wat is het?</div><p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.6;">${k.watIsHet}</p></div>` : ""}
        ${k.gevolgen ? `<div style="margin-bottom: 10px;"><div style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Gevolgen in de klas</div><p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.6;">${k.gevolgen}</p></div>` : ""}
        ${k.tips ? `<div style="background: #f0fdf4; border-left: 3px solid #22c55e; padding: 12px 14px; border-radius: 0 6px 6px 0; margin-top: 10px;"><div style="font-size: 11px; font-weight: 700; color: #16a34a; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;">Tips voor de leerkracht</div><p style="color: #166534; font-size: 13px; margin: 0; line-height: 1.6;">${k.tips}</p></div>` : ""}
        ${
          k.pdfUrl || k.bronUrl
            ? `<div style="margin-top: 12px; font-size: 13px;">
          ${k.pdfUrl ? `<a href="${k.pdfUrl}" style="color: #2563eb; margin-right: 16px;">📄 Download PDF</a>` : ""}
          ${k.bronUrl ? `<a href="${k.bronUrl}" style="color: #6b7280;">🔗 Meer informatie</a>` : ""}
        </div>`
            : ""
        }
      </div>
    `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LesCoach rapport – ${contact.naam}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6;">

  <!-- Header -->
  <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 36px 32px; text-align: center;">
    <div style="font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">LesCoach</div>
    <div style="color: #bfdbfe; margin-top: 6px; font-size: 15px;">Nieuwe aanvraag voor expertadvies</div>
  </div>

  <div style="max-width: 680px; margin: 0 auto; padding: 0 16px 40px;">

    <!-- Contact info -->
    <div style="background: white; border-radius: 12px; padding: 28px; margin-top: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h2 style="color: #111827; margin: 0 0 18px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Contactgegevens</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #9ca3af; font-size: 13px; width: 120px;">Naam</td><td style="font-weight: 600; color: #111827; font-size: 15px;">${contact.naam}</td></tr>
        <tr><td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">School</td><td style="font-weight: 600; color: #111827; font-size: 15px;">${contact.school}</td></tr>
        <tr><td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">E-mail</td><td><a href="mailto:${contact.email}" style="color: #2563eb; font-size: 15px;">${contact.email}</a></td></tr>
        ${contact.telefoon ? `<tr><td style="padding: 6px 0; color: #9ca3af; font-size: 13px;">Telefoon</td><td style="color: #111827; font-size: 15px;">${contact.telefoon}</td></tr>` : ""}
        ${contact.opmerkingen ? `<tr><td style="padding: 6px 0; color: #9ca3af; font-size: 13px; vertical-align: top; padding-top: 8px;">Opmerkingen</td><td style="color: #374151; font-size: 14px; padding-top: 8px; line-height: 1.6;">${contact.opmerkingen.replace(/\n/g, "<br>")}</td></tr>` : ""}
      </table>
      <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
        Aanvraag ingediend op ${now} via lescoach.nl
      </div>
    </div>

    <!-- Quick action -->
    <div style="text-align: center; margin: 20px 0;">
      <a href="mailto:${contact.email}?subject=Re: LesCoach aanvraag"
         style="display: inline-block; background: #2563eb; color: white; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">
        ✉️ Reageer op ${contact.naam}
      </a>
    </div>

    <!-- Kenniskaarten -->
    <div style="background: #eff6ff; border-radius: 12px; padding: 28px; margin-top: 8px;">
      <h2 style="color: #1e40af; margin: 0 0 18px; font-size: 16px; font-weight: 700;">
        📋 Gevonden kenniskaarten (${kenniskaarten.length})
      </h2>
      ${kenniskaartBlocks}
    </div>

    <!-- Transcript -->
    <div style="background: white; border-radius: 12px; padding: 28px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <h2 style="color: #111827; margin: 0 0 18px; font-size: 16px; font-weight: 700;">💬 Gespreksverslag</h2>
      <table style="width: 100%; border-collapse: collapse; border-radius: 8px; overflow: hidden; border: 1px solid #f3f4f6;">
        ${transcriptRows}
      </table>
    </div>

  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
    Automatisch gegenereerd door <a href="https://lescoach.nl" style="color: #3b82f6;">LesCoach</a> ·
    Speciaal onderwijs · Nederland
  </div>

</body>
</html>`;
}
