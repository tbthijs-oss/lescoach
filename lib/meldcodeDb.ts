/**
 * Airtable-laag voor meldcode-signalen.
 *
 * Wanneer Noor in het `<noor-data>` JSON-blok het `signaal`-veld vult met een
 * niet-lege waarde, interpreteert dat als een mogelijk meldcode-signaal
 * (kindermishandeling, huiselijk geweld, onveilige thuissituatie). We loggen
 * dit naar de MeldcodeSignalen-tabel zodat een school-admin / aandachts-
 * functionaris het kan beoordelen.
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

export interface MeldcodeSignaal {
  id: string;
  datum: string;
  signaalTekst: string;
  samenvatting: string;
  status: "Nieuw" | "Beoordeeld" | "Doorverwezen" | "Geen actie";
  beoordeeldDoor: string;
  beoordelingsNotitie: string;
  leraarId: string | null;
  schoolId: string | null;
  gesprekId: string | null;
}

interface AirtableRecord<T> { id: string; fields: T; createdTime?: string }
interface AirtableListResponse<T> { records: AirtableRecord<T>[]; offset?: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parse(r: AirtableRecord<any>): MeldcodeSignaal {
  const f = r.fields;
  const leraar: string[] = f["Leraar"] || [];
  const school: string[] = f["School"] || [];
  const gesprek: string[] = f["Gesprek"] || [];
  return {
    id: r.id,
    datum: f["Datum"] || r.createdTime || "",
    signaalTekst: f["SignaalTekst"] || "",
    samenvatting: f["Samenvatting"] || "",
    status: (f["Status"] as MeldcodeSignaal["status"]) || "Nieuw",
    beoordeeldDoor: f["BeoordeeldDoor"] || "",
    beoordelingsNotitie: f["BeoordelingsNotitie"] || "",
    leraarId: leraar[0] || null,
    schoolId: school[0] || null,
    gesprekId: gesprek[0] || null,
  };
}

/**
 * Non-blocking: als Airtable faalt loggen we alleen en gaan door. Meldcode
 * detectie mag nooit de chat breken.
 */
export async function logMeldcodeSignaal(input: {
  signaalTekst: string;
  samenvatting: string;
  leraarId: string | null;
  schoolId: string | null;
  gesprekId: string | null;
}): Promise<void> {
  try {
    const fields: Record<string, unknown> = {
      Datum: new Date().toISOString(),
      SignaalTekst: input.signaalTekst.slice(0, 2000),
      Samenvatting: input.samenvatting.slice(0, 500),
      Status: "Nieuw",
    };
    if (input.leraarId) fields["Leraar"] = [input.leraarId];
    if (input.schoolId) fields["School"] = [input.schoolId];
    if (input.gesprekId) fields["Gesprek"] = [input.gesprekId];
    await at(tableUrl("MeldcodeSignalen"), {
      method: "POST",
      body: JSON.stringify({ fields, typecast: true }),
    });
  } catch (err) {
    console.warn("[meldcode] log mislukt:", err);
  }
}

export async function listMeldcodeSignalen(schoolId?: string): Promise<MeldcodeSignaal[]> {
  const url = schoolId
    ? `${tableUrl("MeldcodeSignalen")}?filterByFormula=${encodeURIComponent(`FIND('${schoolId}', ARRAYJOIN({School}))`)}&pageSize=100&sort%5B0%5D%5Bfield%5D=Datum&sort%5B0%5D%5Bdirection%5D=desc`
    : `${tableUrl("MeldcodeSignalen")}?pageSize=100&sort%5B0%5D%5Bfield%5D=Datum&sort%5B0%5D%5Bdirection%5D=desc`;
  try {
    const data = await at<AirtableListResponse<Record<string, unknown>>>(url);
    return (data.records || []).map(parse);
  } catch (err) {
    console.warn("[meldcode] list mislukt:", err);
    return [];
  }
}
