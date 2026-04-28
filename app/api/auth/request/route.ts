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
    // "Blijf ingelogd op dit apparaat" — staat default aan in de UI; off bij gedeelde computers.
    const persistent = body.persistent !== false;

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

    // Lookup — silently ignore als e-mail onbekend is (anti-enumeration).
    // Als de Leraren-tabel nog niet bestaat (Airtable 404), doen we alsof
    // de email onbekend is. Zo ziet een bezoeker geen "Server error".
    let leraar: Awaited<ReturnType<typeof findLeraarByEmail>> = null;
    try {
      leraar = await findLeraarByEmail(email);
    } catch (lookupErr) {
      console.warn("[auth/request] leraar-lookup faalde (tabel ontbreekt?):", lookupErr);
    }

    if (leraar && leraar.status !== "geblokkeerd") {
      const token = generateToken();
      const verlooptOp = magicLinkExpiry();
      await createMagicLink(token, leraar.id, verlooptOp);

      const appUrl = process.env.APP_URL || "https://lescoach.nl";
      const loginUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}${persistent ? "" : "&p=0"}`;

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
