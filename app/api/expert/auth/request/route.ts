import { NextRequest, NextResponse } from "next/server";
import { findExpertByEmail, createExpertMagicLink } from "@/lib/expertsDb";
import { generateToken, magicLinkExpiry } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { rateLimit, clientIdFromRequest, rateLimitResponse } from "@/lib/rateLimit";

/**
 * POST /api/expert/auth/request
 * Body: { email: string }
 *
 * Altijd success (anti-enumeration). Alleen bij een bestaande expert
 * wordt er daadwerkelijk een magic link verstuurd.
 */
export async function POST(request: NextRequest) {
    // Rate limit: 5 magic-link-requests/min per IP. Voorkomt e-mail-bombing.
  const rl = rateLimit(`auth:${clientIdFromRequest(request)}`, 5, 60_000);
  if (!rl.ok) return rateLimitResponse(rl) as unknown as Response;

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    // Strikte e-mailvalidatie: lengte (RFC 5321), CRLF (header-injectie),
    // basis-vorm. Voorkomt DoS via 100KB-strings en injectie via Resend.
    if (
      !email ||
      email.length > 320 ||
      /[\r\n]/.test(email) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json({ error: "Geen geldig e-mailadres." }, { status: 400 });
    }

    let expert: Awaited<ReturnType<typeof findExpertByEmail>> = null;
    try {
      expert = await findExpertByEmail(email);
    } catch (lookupErr) {
      console.warn("[expert/auth/request] expert-lookup faalde:", lookupErr);
    }
    if (expert) {
      const token = generateToken();
      const verlooptOp = magicLinkExpiry();
      await createExpertMagicLink(token, expert.id, verlooptOp);

      const appUrl = process.env.APP_URL || "https://lescoach.nl";
      const loginUrl = `${appUrl.replace(/\/$/, "")}/expert/verify?token=${encodeURIComponent(token)}`;

      const subject = "Inloggen bij LesCoach (expert)";
      const html = `<!doctype html><html><body style="font-family:-apple-system,system-ui,sans-serif;max-width:560px;margin:24px auto;padding:0 20px;color:#1e293b">
<p>Hoi ${expert.naam || "collega"},</p>
<p>Hier is je inloglink voor je LesCoach expert-profiel. Deze link werkt 15 minuten.</p>
<p><a href="${loginUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Open je profiel</a></p>
<p style="color:#64748b;font-size:13px">Of kopieer deze URL: ${loginUrl}</p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
<p style="color:#94a3b8;font-size:12px">Heb je deze e-mail niet aangevraagd? Negeer 'm gerust.</p>
</body></html>`;
      const text = `Hoi ${expert.naam || "collega"},\n\nOpen je LesCoach expert-profiel met deze link (15 min geldig):\n${loginUrl}\n`;

      await sendEmail({ to: expert.email, subject, html, text });
    } else {
      console.warn(`[expert/auth] magic-link voor onbekende expert email: ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[expert/auth/request] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
