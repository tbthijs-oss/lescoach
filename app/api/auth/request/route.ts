import { NextRequest, NextResponse } from "next/server";
import {
  findLeraarByEmail,
  getSchool,
  createMagicLink,
} from "@/lib/authDb";
import { generateToken, magicLinkExpiry } from "@/lib/auth";
import { sendEmail, magicLinkEmail } from "@/lib/email";
import { rateLimit, clientIdFromRequest, rateLimitResponse } from "@/lib/rateLimit";

/**
 * POST /api/auth/request
 * Body: { email: string }
 *
 * Zoekt de leraar op email, maakt een magic-link token, en stuurt die
 * per e-mail. Geeft ALTIJD success terug (ook als de leraar niet bestaat)
 * om email-enumeration te voorkomen.
 */
export async function POST(request: NextRequest) {
    // Rate limit: 5 magic-link-requests/min per IP. Voorkomt e-mail-bombing.
  const rl = rateLimit(`auth:${clientIdFromRequest(request)}`, 5, 60_000);
  if (!rl.ok) return rateLimitResponse(rl) as unknown as Response;

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Geen geldig e-mailadres." }, { status: 400 });
    }

    // Lookup — silently ignore als e-mail onbekend is (anti-enumeration)
    const leraar = await findLeraarByEmail(email);

    if (leraar && leraar.status !== "geblokkeerd") {
      const token = generateToken();
      const verlooptOp = magicLinkExpiry();
      await createMagicLink(token, leraar.id, verlooptOp);

      const appUrl = process.env.APP_URL || "https://lescoach.nl";
      const loginUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;

      const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;
      const isFirstLogin = leraar.status === "uitgenodigd";

      const { subject, html, text } = magicLinkEmail({
        naam: leraar.naam,
        loginUrl,
        schoolnaam: school?.schoolnaam,
        isFirstLogin,
      });

      await sendEmail({ to: leraar.email, subject, html, text });
    } else if (!leraar) {
      // Loggen voor debug, maar user ziet success
      console.warn(`[auth] magic-link aangevraagd voor onbekende email: ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[auth/request] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
