// ─── Kenniskaart ─────────────────────────────────────────────────────────────

export interface Kenniskaart {
  id: string;
  titel: string;
  categorie: string;
  samenvatting: string;
  watIsHet: string;
  gevolgen: string;
  tips: string;
  trefwoorden: string[];
  pdfUrl: string;
  bronUrl: string;
}

const KENNISKAARTEN_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseKenniskaartRecord(record: any): Kenniskaart {
  const f = record.fields;
  return {
    id: record.id,
    titel: f["fld3DLuFhoAMOUEph"] || "",
    categorie: f["fldWOw0vqNrNMTkip"]?.name || f["fldWOw0vqNrNMTkip"] || "",
    samenvatting: f["fldkIgAECHweJb5PW"] || "",
    watIsHet: f["fldpHHTnFK9uPv4Qv"] || "",
    gevolgen: f["fldGMI6li2GD9O9Bk"] || "",
    tips: f["fldPq0TsXzIEDMdiL"] || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trefwoorden: (f["fld39hrdXpTYZF1NH"] || []).map((t: any) =>
      typeof t === "string" ? t : t.name
    ),
    pdfUrl: f["fldNo7eNNabDY2xSH"] || "",
    bronUrl: f["fldpfT1FwSVT4qNrK"] || "",
  };
}

export async function getAllKenniskaarten(): Promise<Kenniskaart[]> {
  const response = await fetch(KENNISKAARTEN_URL, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    console.error("Airtable kenniskaarten error:", response.status, await response.text());
    return [];
  }
  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.records || []).map((r: any) => parseKenniskaartRecord(r));
}

export async function searchKenniskaarten(
  query: string,
  trefwoorden: string[] = []
): Promise<Kenniskaart[]> {
  const all = await getAllKenniskaarten();
  const queryLower = query.toLowerCase();
  const trefLower = trefwoorden.map((t) => t.toLowerCase());

  const scored = all.map((k) => {
    let score = 0;
    const searchText = [k.titel, k.categorie, k.samenvatting, k.trefwoorden.join(" ")]
      .join(" ")
      .toLowerCase();

    if (searchText.includes(queryLower)) score += 10;
    trefLower.forEach((t) => {
      if (k.trefwoorden.some((kt) => kt.toLowerCase().includes(t))) score += 5;
      if (searchText.includes(t)) score += 2;
    });
    queryLower.split(" ").forEach((word) => {
      if (word.length > 3 && searchText.includes(word)) score += 1;
    });
    return { kenniskaart: k, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.kenniskaart);
}

// ─── Expert ──────────────────────────────────────────────────────────────────

export interface Expert {
  id: string;
  naam: string;
  titel: string;
  bio: string;
  specialisaties: string[]; // comma-separated in Airtable
  email: string;
  telefoon: string;
  linkedin: string;
  fotoUrl: string;
  beschikbaar: boolean;
  ervaringsjaren: number;
  regio: string;
  taal: string[];
}

// Table ID for Experts table (created 2026-04-20)
const EXPERTS_TABLE_ID = "tblX0HLiRT5lSDiYz";
const EXPERTS_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${EXPERTS_TABLE_ID}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseExpertRecord(record: any): Expert {
  const f = record.fields;
  const specialisatiesRaw: string = f["fld0q7vkM7K0YfnBw"] || "";
  return {
    id: record.id,
    naam: f["fldlIpS7xTWze43gJ"] || "",
    titel: f["fldY7YAV7ZIsHpIu5"] || "",
    bio: f["fldBMGbBncFIp5tPn"] || "",
    specialisaties: specialisatiesRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    email: f["fld1PlJECsJv70w8G"] || "",
    telefoon: f["fldgCrSlOac82CwTB"] || "",
    linkedin: f["fldx30ctWow9T40IN"] || "",
    fotoUrl: f["fldsdq91TXomWNpWZ"] || "",
    beschikbaar: f["flduj5f58FtEHZP6k"] === true,
    ervaringsjaren: f["fldAX1Acb9wJu2p6F"] || 0,
    regio: f["fldaePVPISVXp943r"] || "",
    taal: f["fldv4OaGVBlmdRQ8M"] || [],
  };
}

let expertsCache: Expert[] | null = null;
let expertsCacheTime = 0;

export async function getAllExperts(): Promise<Expert[]> {
  const now = Date.now();
  if (expertsCache && now - expertsCacheTime < 3600_000) return expertsCache;

  const response = await fetch(
    `${EXPERTS_URL}?filterByFormula={Beschikbaar}=1`,
    {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` },
    }
  );
  if (!response.ok) {
    console.error("Airtable experts error:", response.status, await response.text());
    return expertsCache || [];
  }
  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expertsCache = (data.records || []).map((r: any) => parseExpertRecord(r));
  expertsCacheTime = now;
  return expertsCache!;
}

/**
 * Find the best-matching expert(s) for a given set of trefwoorden.
 * Returns up to `limit` experts sorted by overlap score.
 */
export async function matchExperts(
  trefwoorden: string[],
  limit = 2
): Promise<Expert[]> {
  const all = await getAllExperts();
  const needle = trefwoorden.map((t) => t.toLowerCase());

  const scored = all.map((expert) => {
    const score = needle.filter((kw) =>
      expert.specialisaties.some(
        (s) => s.includes(kw) || kw.includes(s)
      )
    ).length;
    return { expert, score };
  });

  return scored
    .filter((s) => s.score > 0 || all.length <= limit)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.expert);
}
