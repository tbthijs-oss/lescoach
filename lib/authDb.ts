/**
 * Airtable-laag voor auth-entiteiten: Scholen, Leraren, MagicLinks.
 *
 * Gebruikt tabelnamen in de URL (niet tableId) zodat het makkelijk is om
 * de tabellen in Airtable te beheren. De AIRTABLE_BASE_ID env var wijst
 * naar dezelfde base als Kenniskaarten en Experts.
 */

const BASE = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_TOKEN;

function t(name: string) {
  return `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(name)}`;
}

async function airtable<T>(url: string, init?: RequestInit): Promise<T> {
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

// ─── Scholen ─────────────────────────────────────────────────────────────────

export interface School {
  id: string;
  schoolnaam: string;
  contactpersoon: string;
  contactEmail: string;
  status: "proef" | "actief" | "inactief";
  abonnementStart?: string;
  abonnementEind?: string;
  notities?: string;
  aangemaaktOp?: string;
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
function parseSchool(r: AirtableRecord<any>): School {
  const f = r.fields;
  return {
    id: r.id,
    schoolnaam: f["Schoolnaam"] || "",
    contactpersoon: f["Contactpersoon"] || "",
    contactEmail: f["Contact email"] || "",
    status: (f["Status"] || "proef") as School["status"],
    abonnementStart: f["Abonnement start"] || "",
    abonnementEind: f["Abonnement eind"] || "",
    notities: f["Notities"] || "",
    aangemaaktOp: f["Aangemaakt op"] || r.createdTime || "",
  };
}

export async function listScholen(): Promise<School[]> {
  const data = await airtable<AirtableListResponse<Record<string, unknown>>>(t("Scholen"));
  return (data.records || []).map(parseSchool);
}

export async function getSchool(id: string): Promise<School | null> {
  try {
    const data = await airtable<AirtableRecord<Record<string, unknown>>>(`${t("Scholen")}/${id}`);
    return parseSchool(data);
  } catch {
    return null;
  }
}

export async function createSchool(input: Omit<School, "id" | "aangemaaktOp">): Promise<School> {
  const data = await airtable<AirtableRecord<Record<string, unknown>>>(t("Scholen"), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Schoolnaam: input.schoolnaam,
        Contactpersoon: input.contactpersoon,
        "Contact email": input.contactEmail,
        Status: input.status,
        ...(input.abonnementStart ? { "Abonnement start": input.abonnementStart } : {}),
        ...(input.abonnementEind ? { "Abonnement eind": input.abonnementEind } : {}),
        ...(input.notities ? { Notities: input.notities } : {}),
      },
    }),
  });
  return parseSchool(data);
}

export async function updateSchool(id: string, patch: Partial<School>): Promise<School> {
  const fields: Record<string, unknown> = {};
  if (patch.schoolnaam !== undefined) fields["Schoolnaam"] = patch.schoolnaam;
  if (patch.contactpersoon !== undefined) fields["Contactpersoon"] = patch.contactpersoon;
  if (patch.contactEmail !== undefined) fields["Contact email"] = patch.contactEmail;
  if (patch.status !== undefined) fields["Status"] = patch.status;
  if (patch.abonnementStart !== undefined) fields["Abonnement start"] = patch.abonnementStart;
  if (patch.abonnementEind !== undefined) fields["Abonnement eind"] = patch.abonnementEind;
  if (patch.notities !== undefined) fields["Notities"] = patch.notities;
  const data = await airtable<AirtableRecord<Record<string, unknown>>>(`${t("Scholen")}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  return parseSchool(data);
}

export async function deleteSchool(id: string): Promise<void> {
  await airtable(`${t("Scholen")}/${id}`, { method: "DELETE" });
}

// ─── Leraren ────────────────────────────────────────────────────────────────

export interface Leraar {
  id: string;
  email: string;
  naam: string;
  schoolId: string | null;
  rol: "admin" | "leraar";
  status: "uitgenodigd" | "actief" | "geblokkeerd";
  laatsteLogin?: string;
  uitgenodigdOp?: string;
  uitgenodigdDoor?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLeraar(r: AirtableRecord<any>): Leraar {
  const f = r.fields;
  const schoolLinks: string[] = f["School"] || [];
  return {
    id: r.id,
    email: (f["Email"] || "").toLowerCase(),
    naam: f["Naam"] || "",
    schoolId: schoolLinks[0] || null,
    rol: (f["Rol"] || "leraar") as Leraar["rol"],
    status: (f["Status"] || "uitgenodigd") as Leraar["status"],
    laatsteLogin: f["Laatste login"] || "",
    uitgenodigdOp: f["Uitgenodigd op"] || r.createdTime || "",
    uitgenodigdDoor: f["Uitgenodigd door"] || "",
  };
}

export async function findLeraarByEmail(email: string): Promise<Leraar | null> {
  const normalized = email.trim().toLowerCase();
  const formula = `LOWER({Email})='${normalized.replace(/'/g, "''")}'`;
  const url = `${t("Leraren")}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const data = await airtable<AirtableListResponse<Record<string, unknown>>>(url);
  const rec = (data.records || [])[0];
  return rec ? parseLeraar(rec) : null;
}

export async function getLeraar(id: string): Promise<Leraar | null> {
  try {
    const data = await airtable<AirtableRecord<Record<string, unknown>>>(`${t("Leraren")}/${id}`);
    return parseLeraar(data);
  } catch {
    return null;
  }
}

export async function listLerarenForSchool(schoolId: string): Promise<Leraar[]> {
  const formula = `FIND('${schoolId}', ARRAYJOIN({School}))`;
  const url = `${t("Leraren")}?filterByFormula=${encodeURIComponent(formula)}`;
  const data = await airtable<AirtableListResponse<Record<string, unknown>>>(url);
  return (data.records || []).map(parseLeraar);
}

export async function createLeraar(input: {
  email: string;
  naam: string;
  schoolId: string;
  rol: Leraar["rol"];
  uitgenodigdDoor: string;
}): Promise<Leraar> {
  const data = await airtable<AirtableRecord<Record<string, unknown>>>(t("Leraren"), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Email: input.email.trim().toLowerCase(),
        Naam: input.naam,
        School: [input.schoolId],
        Rol: input.rol,
        Status: "uitgenodigd",
        "Uitgenodigd door": input.uitgenodigdDoor,
      },
    }),
  });
  return parseLeraar(data);
}

export async function updateLeraar(id: string, patch: Partial<Leraar>): Promise<Leraar> {
  const fields: Record<string, unknown> = {};
  if (patch.naam !== undefined) fields["Naam"] = patch.naam;
  if (patch.rol !== undefined) fields["Rol"] = patch.rol;
  if (patch.status !== undefined) fields["Status"] = patch.status;
  if (patch.laatsteLogin !== undefined) fields["Laatste login"] = patch.laatsteLogin;
  const data = await airtable<AirtableRecord<Record<string, unknown>>>(`${t("Leraren")}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
  return parseLeraar(data);
}

export async function deleteLeraar(id: string): Promise<void> {
  await airtable(`${t("Leraren")}/${id}`, { method: "DELETE" });
}

// ─── MagicLinks ──────────────────────────────────────────────────────────────

export interface MagicLink {
  id: string;
  token: string;
  leraarId: string | null;
  verlooptOp: string;
  gebruiktOp?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseLink(r: AirtableRecord<any>): MagicLink {
  const f = r.fields;
  const leraar: string[] = f["Leraar"] || [];
  return {
    id: r.id,
    token: f["Token"] || "",
    leraarId: leraar[0] || null,
    verlooptOp: f["Verloopt op"] || "",
    gebruiktOp: f["Gebruikt op"] || "",
  };
}

export async function createMagicLink(
  token: string,
  leraarId: string,
  verlooptOp: string
): Promise<MagicLink> {
  const data = await airtable<AirtableRecord<Record<string, unknown>>>(t("MagicLinks"), {
    method: "POST",
    body: JSON.stringify({
      fields: {
        Token: token,
        Leraar: [leraarId],
        "Verloopt op": verlooptOp,
      },
    }),
  });
  return parseLink(data);
}

export async function findMagicLink(token: string): Promise<MagicLink | null> {
  const formula = `{Token}='${token.replace(/'/g, "''")}'`;
  const url = `${t("MagicLinks")}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const data = await airtable<AirtableListResponse<Record<string, unknown>>>(url);
  const rec = (data.records || [])[0];
  return rec ? parseLink(rec) : null;
}

export async function markMagicLinkUsed(id: string): Promise<void> {
  await airtable(`${t("MagicLinks")}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      fields: { "Gebruikt op": new Date().toISOString() },
    }),
  });
}
