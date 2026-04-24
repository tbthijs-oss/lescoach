import { NextRequest, NextResponse } from "next/server";
import { rateLimit, clientIdFromRequest, rateLimitResponse } from "@/lib/rateLimit";
import { safeEqual } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Rate-limit wachtwoord-pogingen: 10 per 10 minuten per IP. Dit voorkomt
  // een brute-force tegen ADMIN_PASSWORD. Lokale in-memory limiter is genoeg
  // — bij echt aanhoudend misbruik staat er ook Vercel edge protection voor.
  const rl = rateLimit(`beheer-auth:${clientIdFromRequest(request)}`, 10, 10 * 60_000);
  if (!rl.ok) return rateLimitResponse(rl) as unknown as Response;

  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
    }

    // Timing-safe zodat aanvallers geen prefix kunnen afleiden.
    if (!safeEqual(password, adminPassword)) {
      return NextResponse.json({ error: "Ongeldig wachtwoord" }, { status: 401 });
    }

    const token = process.env.ADMIN_TOKEN || adminPassword;

    const response = NextResponse.json({ success: true });
    response.cookies.set("beheer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("beheer_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
