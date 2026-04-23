import { NextRequest, NextResponse } from "next/server";
import { findExpertMagicLink, markExpertMagicLinkUsed, getExpert } from "@/lib/expertsDb";
import { magicLinkIsFresh } from "@/lib/auth";
import { serializeExpertSession, EXPERT_COOKIE } from "@/lib/expertAuth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL("/expert/login?error=invalid", origin));
  }
  const link = await findExpertMagicLink(token);
  if (!link) return NextResponse.redirect(new URL("/expert/login?error=invalid", origin));
  if (link.gebruiktOp) return NextResponse.redirect(new URL("/expert/login?error=used", origin));
  if (!magicLinkIsFresh(link.verlooptOp)) return NextResponse.redirect(new URL("/expert/login?error=expired", origin));
  if (!link.expertId) return NextResponse.redirect(new URL("/expert/login?error=invalid", origin));

  const expert = await getExpert(link.expertId);
  if (!expert) return NextResponse.redirect(new URL("/expert/login?error=invalid", origin));

  await markExpertMagicLinkUsed(link.id);

  const sessionValue = serializeExpertSession({
    expertId: expert.id,
    issuedAt: Date.now(),
  });

  const response = NextResponse.redirect(new URL("/expert/profiel", origin));
  response.cookies.set(EXPERT_COOKIE.name, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: EXPERT_COOKIE.maxAge,
    path: "/",
  });
  return response;
}
