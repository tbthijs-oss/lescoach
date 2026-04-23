import { NextResponse } from "next/server";
import { EXPERT_COOKIE } from "@/lib/expertAuth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(EXPERT_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
