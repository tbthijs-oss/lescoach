/**
 * Airtable-laag voor expert self-service.
 *
 * Experts zitten in de `Experts` tabel (zelfde base als Kenniskaarten).
 * Voor de magic-link auth van experts gebruiken we een aparte tabel
 * `ExpertMagicLinks` zodat de bestaande MagicLinks-tabel ongemoeid blijft.
 */

import { EXPERTS_TABLE_ID } from "@/lib/airtable";

const BASE = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_TOKEN;

function expertsUrl(suffix = ""): string {
  const base = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(EXPERTS_TABLE_ID)}`;
  return suffix ? `${base}/${suffix}` : base;
}

function linksUrl(suffix = ""): string {
  const base = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent("ExpertMagicLinks")}`;
  return suffix ? `${base}/${suffix}` : base;
}

async function at<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${init?.method || "GET"} ${url} -> ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface ExpertProfile {
  id: string;
  naam: string;
  titel: string;
  bio: string;
  specialisaties: string; // raw comma-separated
  email: string;
  telefoon: string;
  linkedin: string;
  fotoUrl: string;
  beschikbaar: boolean;
  ervaringsjaren: number;
  regio: string;
  taal: string;
}

interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime?: string;
}

interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseExpertProfile(r: AirtableRecord<any>): ExpertProfile {
  const f = r.fields;
  return {
    id: r.id,
    naam: f["Naam"] || "",
    titel: f["Titel"] || "",
    bio: f["Bio"] || "",
    specialisaties: f["Specialisaties"] || "",
    email: (f["Email"] || "").toLowerCase(),
    telefoon: f["Telefoon"] || "",
    linkedin: f["LinkedIn"] || "",
    fotoUrl: f["Foto URL"] || "",
    beschikbaar: f["Beschikbaar"] === true,
    ervaringsjaren: f["Ervaringsjaren"] || 0,
    regio: f["Regio"] || "",
    taal: f["Taal"] || "",
  };
}

export async function getExpert(id: string): Promise<ExpertProfile | null> {
  try {
    const data = await at<AirtableRecord<Record<string, unknown>>>(expertsUrl(id));
    return parseExpertProfile(data);
  } catch {
    return null;
  }
}

export async function findExpertByEmail(email: string): Promise<ExpertProfile | null> {
  const normalized = email.trim().toLowerCase();
  const formula = `LOWER({Email})='${normalized.replace(/'/g, "''")}'`;
  const url = `${expertsUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const data = await at<AirtableListResponse<Record<string, unknown>>>(url);
  const rec = (data.records || [])[0];
  return rec ? parseExpertProfile(rec) : null;
}

export async function updateExpertProfile(
  id: string,
  patch: Partial<Pick<
    ExpertProfile,
    "naam" | "titel" | "bio" | "specialisaties" | "telefoon" | "linkedin" |
    "fotoUrl" | "beschikbaar" | "ervaringsjaren" | "regio" | "taal"
  >>
): Promise<ExpertProfile> {
  const fields: Record<string, unknown> = {};
  if (patch.naam !== undefined) fields["Naam"] = patch.naam;
  if (patch.titel !== undefined) fields["Titel"] = patch.titel;
  if (patch.bio !== undefined) fields["Bio"] = patch.bio;
  if (patch.specialisaties !== undefined) fields["Specialisaties"] = patch.specialisaties;
  if (patch.telefoon !== undefined) fields["Telefoon"] = patch.telefoon;
  if (patch.linkedin !== undefined) fields["LinkedIn"] = patch.linkedin;
  if (patch.fotoUrl !== undefined) fields["Foto URL"] = patch.fotoUrl;
  if (patch.beschikbaar !== undefined) fields["Beschikbaar"] = patch.beschikbaar;
  if (patch.ervaringsjaren !== undefined) fields["Ervaringsjaren"] = patch.ervaringsjaren;
  if (patch.regio !== undefined) fields["Regio"] = patch.regio;
  if (patch.taal !== undefined) fields["Taal"] = patch.taal;
  const data = await at<AirtableRecord<Record<string, unknown>>>(expertsUrl(id), {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  });
  return parseExpertProfile(data);
}

// ─── Expert magic links ────────────────────────────────────────────────────

export interface ExpertMagicLink {
  id: string;
  token: string;
  expertId: string | null;
  verlooptOp: string;
  gebruiktOp?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseExpertLink(r: AirtableRecord<any>): ExpertMagicLink {
  const f = r.fields;
  const expertLink: string[] = f["Expert"] || [];
  return {
    id: r.id,
    token: f["Token"] || "",
    expertId: expertLink[0] || null,
    verlooptOp: f["Verloopt op"] || "",
    gebruiktOp: f["Gebruikt op"] || "",
  };
}

export async function createExpertMagicLink(
  token: string,
  expertId: string,
  verlooptOp: string
): Promise<ExpertMagicLink> {
  const data = await at<AirtableRecord<Record<string, unknown>>>(linksUrl(), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Token: token,
        Expert: [expertId],
        "Verloopt op": verlooptOp,
      },
    }),
  });
  return parseExpertLink(data);
}

export async function findExpertMagicLink(token: string): Promise<ExpertMagicLink | null> {
  const formula = `{Token}='${token.replace(/'/g, "''")}'`;
  const url = `${linksUrl()}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const data = await at<AirtableListResponse<Record<string, unknown>>>(url);
  const rec = (data.records || [])[0];
  return rec ? parseExpertLink(rec) : null;
}

export async function markExpertMagicLinkUsed(id: string): Promise<void> {
  await at(linksUrl(id), {
    method: "PATCH",
    body: JSON.stringify({
      fields: { "Gebruikt op": new Date().toISOString() },
    }),
  });
}
