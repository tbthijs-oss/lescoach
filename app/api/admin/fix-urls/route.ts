/**
 * Tijdelijke admin-route: controleert en repareert URL-velden in Kenniskaarten.
 * Verwijder dit bestand na gebruik.
 * Beschermd via ADMIN_TOKEN cookie (zelfde als /beheer).
 */
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.AIRTABLE_BASE_ID!;
const TOKEN = process.env.AIRTABLE_API_TOKEN!;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN!;
const TABLE = "Kenniskaarten";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}
interface AirtableListResp {
  records: AirtableRecord[];
  offset?: string;
}

async function atFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AT ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

function tableUrl(suffix = "") {
  const base = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(TABLE)}`;
  return suffix ? `${base}/${suffix}` : base;
}

/** Returns true if URL is bad/dead-looking */
function isBadUrl(raw: unknown): boolean {
  if (!raw || typeof raw !== "string" || raw.trim() === "") return false; // empty = not bad, just missing
  const s = raw.trim();
  if (!s.startsWith("http://") && !s.startsWith("https://")) return true;
  if (s.includes(" ")) return true;
  // Known dead patterns
  if (s.includes("members.ziggo.nl")) return true;
  if (s.includes("members.home.nl")) return true;
  try {
    new URL(s);
    return false;
  } catch {
    return true;
  }
}

export async function GET() {
  // Auth check
  const cookieStore = await cookies();
  const tok = cookieStore.get("beheer_token")?.value;
  if (!tok || tok !== ADMIN_TOKEN) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  // Fetch all kenniskaarten
  const all: AirtableRecord[] = [];
  let offset: string | undefined;
  let safety = 0;
  do {
    const url = offset
      ? `${tableUrl()}?pageSize=100&offset=${encodeURIComponent(offset)}`
      : `${tableUrl()}?pageSize=100`;
    const data = await atFetch<AirtableListResp>(url);
    all.push(...data.records);
    offset = data.offset;
    safety++;
  } while (offset && safety < 20);

  // Find records with bad URLs
  const toFix: { id: string; titel: string; field: string; oldVal: string }[] = [];
  for (const rec of all) {
    const pdfUrl = rec.fields["PDF URL"];
    const bronUrl = rec.fields["Bronpagina URL"];
    const titel = String(rec.fields["Titel"] || rec.id);
    if (isBadUrl(pdfUrl)) {
      toFix.push({ id: rec.id, titel, field: "PDF URL", oldVal: String(pdfUrl) });
    }
    if (isBadUrl(bronUrl)) {
      toFix.push({ id: rec.id, titel, field: "Bronpagina URL", oldVal: String(bronUrl) });
    }
  }

  if (toFix.length === 0) {
    return NextResponse.json({ status: "ok", message: "Geen slechte URLs gevonden.", checked: all.length });
  }

  // Fix: clear bad URL fields in Airtable
  const fixed: typeof toFix = [];
  const errors: { id: string; titel: string; error: string }[] = [];

  for (const item of toFix) {
    try {
      await atFetch(tableUrl(item.id), {
        method: "PATCH",
        body: JSON.stringify({ fields: { [item.field]: "" } }),
      });
      fixed.push(item);
    } catch (e) {
      errors.push({ id: item.id, titel: item.titel, error: String(e) });
    }
  }

  return NextResponse.json({
    status: errors.length === 0 ? "ok" : "partial",
    checked: all.length,
    fixed: fixed.map((f) => ({ titel: f.titel, field: f.field, was: f.oldVal })),
    errors,
  });
}
