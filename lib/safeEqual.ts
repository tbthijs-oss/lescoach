/**
 * Pure-JS constant-time string compare. Geen Node crypto imports zodat
 * deze module ook werkt in Next.js Edge middleware. Gebruik dit voor
 * admin-tokens en wachtwoorden i.p.v. `===`/`!==`.
 */
export function safeEqual(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
