import { NextRequest, NextResponse } from "next/server";
import { listScholen, createSchool, listLerarenForSchool, createLeraar } from "@/lib/authDb";
import { generateToken, magicLinkExpiry } from "@/lib/auth";
import { createMagicLink } from "@/lib/authDb";
import { sendEmail, magicLinkEmail } from "@/lib/email";

export async function GET() {
  try {
    const scholen = await listScholen();
    // Optioneel: teacher count per school
    const withCounts = await Promise.all(
      scholen.map(async (s) => {
        try {
          const leraren = await listLerarenForSchool(s.id);
          return { ...s, lerarenAantal: leraren.length };
        } catch {
          return { ...s, lerarenAantal: 0 };
        }
      })
    );
    return NextResponse.json({ scholen: withCounts });
  } catch (err) {
    console.error("[beheer/scholen] GET:", err);
    return NextResponse.json({ error: "Kon scholen niet laden" }, { status: 500 });
  }
}

/**
 * POST maakt een school aan. Als `adminEmail` + `adminNaam` zijn meegegeven,
 * wordt ook een admin-leraar aangemaakt EN een magic-link verzonden.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      schoolnaam,
      contactpersoon,
      contactEmail,
      status = "proef",
      notities,
      adminEmail,
      adminNaam,
    } = body || {};

    if (!schoolnaam || !contactEmail) {
      return NextResponse.json({ error: "Schoolnaam en contact email zijn verplicht." }, { status: 400 });
    }

    const school = await createSchool({
      schoolnaam,
      contactpersoon: contactpersoon || "",
      contactEmail,
      status,
      notities,
    });

    let admin = null;
    if (adminEmail && adminNaam) {
      admin = await createLeraar({
        email: adminEmail,
        naam: adminNaam,
        schoolId: school.id,
        rol: "admin",
        uitgenodigdDoor: "LesCoach",
      });

      // Direct magic-link sturen
      const token = generateToken();
      const verlooptOp = magicLinkExpiry();
      await createMagicLink(token, admin.id, verlooptOp);

      const appUrl = process.env.APP_URL || "https://lescoach.nl";
      const loginUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;
      const { subject, html, text } = magicLinkEmail({
        naam: admin.naam,
        loginUrl,
        schoolnaam: school.schoolnaam,
        isFirstLogin: true,
      });
      await sendEmail({ to: admin.email, subject, html, text });
    }

    return NextResponse.json({ school, admin });
  } catch (err) {
    console.error("[beheer/scholen] POST:", err);
    return NextResponse.json({ error: "Kon school niet aanmaken" }, { status: 500 });
  }
}
