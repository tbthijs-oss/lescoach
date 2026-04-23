/**
 * Expert session cookies: HMAC-signed `expertId|timestamp` payload,
 * los van de leraar-sessie zodat beide flows tegelijk kunnen bestaan.
 */

import crypto from "crypto";

const COOKIE_NAME = "lescoach-expert";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is niet ingesteld of te kort (minimum 16 tekens)");
  }
  return s;
}

function hmac(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export interface ExpertSession {
  expertId: string;
  issuedAt: number;
}

export function serializeExpertSession(s: ExpertSession): string {
  const payload = `${s.expertId}|${s.issuedAt}`;
  return `${payload}|${hmac(payload)}`;
}

export function parseExpertSession(value: string | undefined | null): ExpertSession | null {
  if (!value) return null;
  const parts = value.split("|");
  if (parts.length !== 3) return null;
  const [expertId, issuedAtStr, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!expertId || !Number.isFinite(issuedAt)) return null;
  const expected = hmac(`${expertId}|${issuedAtStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > COOKIE_MAX_AGE * 1000) return null;
  return { expertId, issuedAt };
}

export const EXPERT_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
};
