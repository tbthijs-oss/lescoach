import { NextResponse } from "next/server";

/**
 * GET /api/health
 *
 * Lichtgewicht check van externe afhankelijkheden. Retourneert:
 *   { status: "ok" | "degraded" | "down", checks: {airtable, anthropic, resend} }
 *
 * Gebruikt door monitoring/uptime-dashboards. Geen secrets in de response;
 * alleen aanwezigheid van env vars + een HEAD-achtige reachability check.
 *
 * Doet GEEN volledig API-call naar Anthropic (te duur) — alleen controle op
 * sleutel-aanwezigheid. Voor Airtable doen we één lichte lijst-call met
 * maxRecords=1 zodat we én auth én base-bereikbaarheid testen.
 */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; reason?: string }> = {};

  // Airtable check — één records-call met maxRecords=1
  const airtableToken = process.env.AIRTABLE_API_TOKEN;
  const airtableBase = process.env.AIRTABLE_BASE_ID;
  if (!airtableToken || !airtableBase) {
    checks.airtable = { ok: false, reason: "env_missing" };
  } else {
    const t0 = Date.now();
    try {
      const res = await fetch(
        `https://api.airtable.com/v0/${airtableBase}/${encodeURIComponent("Kenniskaarten")}?maxRecords=1`,
        { headers: { Authorization: `Bearer ${airtableToken}` }, cache: "no-store" }
      );
      checks.airtable = { ok: res.ok, ms: Date.now() - t0, reason: res.ok ? undefined : `http_${res.status}` };
    } catch (err) {
      checks.airtable = { ok: false, ms: Date.now() - t0, reason: String(err).slice(0, 80) };
    }
  }

  // Anthropic check — alleen env-var aanwezigheid (echte call zou kosten + latency toevoegen)
  checks.anthropic = process.env.ANTHROPIC_API_KEY
    ? { ok: true }
    : { ok: false, reason: "env_missing" };

  // Resend check — alleen env-var aanwezigheid
  checks.resend = process.env.RESEND_API_KEY
    ? { ok: true }
    : { ok: false, reason: "env_missing" };

  const allOk = Object.values(checks).every((c) => c.ok);
  const anyOk = Object.values(checks).some((c) => c.ok);
  const status = allOk ? "ok" : anyOk ? "degraded" : "down";

  return NextResponse.json(
    {
      status,
      checks,
      tookMs: Date.now() - started,
      deployedAt: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || "unknown",
      region: process.env.VERCEL_REGION || "unknown",
    },
    { status: allOk ? 200 : 503 }
  );
}
