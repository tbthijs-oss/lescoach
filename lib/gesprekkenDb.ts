/**
 * Airtable-laag voor gesprekslogs (analytics).
 *
 * Elke voltooide Noor-sessie (d.w.z. een eindrapport is geproduceerd)
 * wordt hier gelogd met een minimale voetafdruk: geen ruwe berichten,
 * alleen zoekterm + categorie + kenniskaarten + meta, zodat de
 * `/school/gebruik` pagina trends kan tonen zonder AVG-risico.
 */

const BASE = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_TOKEN;

function tableUrl(name: string, suffix = ""): string {
  const base = `https://api.airtable.com/v0/${BASE}/${encodeURIComponent(name)}`;
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

interface AirtableRecord<T> { id: string; fields: T; createdTime?: string }
interface AirtableListResponse<T> { records: AirtableRecord<T>[]; offset?: string }

export interface Gesprek {
  id: string;
  schoolId: string | null;
  leraarId: string | null;
  zoekterm: string;
  categorie: string;
  kenniskaartTitels: string;
  datum: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGesprek(r: AirtableRecord<any>): Gesprek {
  const f = r.fields;
  const school: string[] = f["School"] || [];
  const leraar: string[] = f["Leraar"] || [];
  return {
    id: r.id,
    schoolId: school[0] || null,
    leraarId: leraar[0] || null,
    zoekterm: f["Zoekterm"] || "",
    categorie: f["Categorie"] || "",
    kenniskaartTitels: f["Kenniskaarten"] || "",
    datum: f["Datum"] || r.createdTime || "",
  };
}

/**
 * Log een afgerond Noor-gesprek. Non-blocking: als Airtable faalt,
 * loggen we alleen en gaan we door (het mag de chat nooit breken).
 */
export async function logGesprek(input: {
  schoolId: string | null;
  leraarId: string | null;
  zoekterm: string;
  categorie: string;
  kenniskaartTitels: string[];
}): Promise<void> {
  try {
    const fields: Record<string, unknown> = {
      Zoekterm: input.zoekterm.slice(0, 200),
      Categorie: input.categorie.slice(0, 200),
      Kenniskaarten: input.kenniskaartTitels.join(", ").slice(0, 1000),
      Datum: new Date().toISOString(),
    };
    if (input.schoolId) fields["School"] = [input.schoolId];
    if (input.leraarId) fields["Leraar"] = [input.leraarId];
    await at(tableUrl("Gesprekken"), {
      method: "POST",
      body: JSON.stringify({ fields, typecast: true }),
    });
  } catch (err) {
    console.warn("[gesprekken] log mislukt:", err);
  }
}

export async function listGesprekkenForSchool(
  schoolId: string,
  sinceIso?: string
): Promise<Gesprek[]> {
  const filters = [`FIND('${schoolId}', ARRAYJOIN({School}))`];
  if (sinceIso) filters.push(`IS_AFTER({Datum}, '${sinceIso}')`);
  const formula = filters.length > 1 ? `AND(${filters.join(",")})` : filters[0];
  const url = `${tableUrl("Gesprekken")}?filterByFormula=${encodeURIComponent(formula)}&pageSize=100`;
  const records: Gesprek[] = [];
  let next: string | undefined;
  let safety = 0;
  do {
    const paged: string = next ? `${url}&offset=${encodeURIComponent(next)}` : url;
    const data = await at<AirtableListResponse<Record<string, unknown>>>(paged);
    records.push(...(data.records || []).map(parseGesprek));
    next = data.offset;
    safety++;
  } while (next && safety < 20);
  return records;
}
