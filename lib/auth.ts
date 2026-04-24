/**
 * Auth core: magic-link token generation, session cookie HMAC signing,
 * session parsing.
 *
 * Cookies zijn HTTP-only en bevatten `leraarId|timestamp|hmac`. De HMAC
 * wordt bepaald met AUTH_SECRET. Zonder AUTH_SECRET faalt de auth — dat
 * is een bewuste sanity check.
 */

import crypto from "crypto";
import { safeEqual } from "@/lib/safeEqual";
export { safeEqual };

const COOKIE_NAME = "lescoach-leraar";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000; // 15 minutes

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


// ─── Magic-link tokens ──────────────────────────────────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function magicLinkExpiry(): string {
  return new Date(Date.now() + MAGIC_LINK_TTL_MS).toISOString();
}

export function magicLinkIsFresh(verlooptOp: string): boolean {
  if (!verlooptOp) return false;
  return new Date(verlooptOp).getTime() > Date.now();
}

// ─── Session cookie ─────────────────────────────────────────────────────────

export interface Session {
  leraarId: string;
  issuedAt: number;
}

export function serializeSession(session: Session): string {
  const payload = `${session.leraarId}|${session.issuedAt}`;
  return `${payload}|${hmac(payload)}`;
}

export function parseSession(value: string | undefined | null): Session | null {
  if (!value) return null;
  const parts = value.split("|");
  if (parts.length !== 3) return null;
  const [leraarId, issuedAtStr, sig] = parts;
  const issuedAt = Number(issuedAtStr);
  if (!leraarId || !Number.isFinite(issuedAt)) return null;
  const expected = hmac(`${leraarId}|${issuedAtStr}`);
  // timingSafeEqual needs equal-length buffers
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const ageMs = Date.now() - issuedAt;
  if (ageMs < 0 || ageMs > COOKIE_MAX_AGE * 1000) return null;
  return { leraarId, issuedAt };
}

export const AUTH_COOKIE = {
  name: COOKIE_NAME,
  maxAge: COOKIE_MAX_AGE,
};
