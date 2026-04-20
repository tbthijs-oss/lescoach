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
    titel: f["Titel"] || "",
    categorie: f["Categorie"] || "",
    samenvatting: f["Samenvatting"] || "",
    watIsHet: f["Wat is het"] || "",
    gevolgen: f["Gevolgen voor schoolvaardigheden"] || "",
    tips: f["Tips voor begeleiding"] || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trefwoorden: (f["Trefwoorden"] || []).map((t: any) =>
      typeof t === "string" ? t : t.name
    ),
    pdfUrl: f["PDF URL"] || "",
    bronUrl: f["Bronpagina URL"] || "",
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
    const searchText = [k.titel, k.categorie, k.samenvatting, k.watIsHet, k.gevolgen, k.tips, k.trefwoorden.join(" ")]
      .join(" ")
      .toLowerCase();

    if (searchText.includes(queryLower)) score += 10;
    trefLower.forEach((t) => {
      if (k.trefwoorden.some((kt) => kt.toLowerCase().includes(t))) score += 5;
      if (searchText.includes(t)) score += 2;
    });
    queryLower.split(/\s+/).forEach((word) => {
      if (word.length > 3 && searchText.includes(word)) score += 2;
      // Partial stem match: handles Dutch/English spelling variants (e.g. prosopagnosia → prosopagnosie)
      else if (word.length > 7) {
        const stem = word.slice(0, word.length - 2); // strip last 2 chars
        if (searchText.split(/\W+/).some((sw) => sw.startsWith(stem))) score += 1;
      }
    });
    return { kenniskaart: k, score };
  });

  const matched = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.kenniskaart);

  // Fallback: if nothing matched, return the top 3 by alphabetical order
  // so the conversation always produces some result
  if (matched.length === 0) {
    return all.slice(0, 3);
  }

  return matched;
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
  const specialisatiesRaw: string = f["Specialisaties"] || "";
  return {
    id: record.id,
    naam: f["Naam"] || "",
    titel: f["Titel"] || "",
    bio: f["Bio"] || "",
    specialisaties: specialisatiesRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    email: f["Email"] || "",
    telefoon: f["Telefoon"] || "",
    linkedin: f["LinkedIn"] || "",
    fotoUrl: f["Foto URL"] || f["FotoUrl"] || "",
    beschikbaar: f["Beschikbaar"] === true,
    ervaringsjaren: f["Ervaringsjaren"] || 0,
    regio: f["Regio"] || "",
    taal: f["Taal"] || [],
  };
}

let expertsCache: Expert[] | null = null;
let expertsCacheTime = 0;

export async function getAllExperts(): Promise<Expert[]> {
  const now = Date.now();
  if (expertsCache && now - expertsCacheTime < 3600_000) return expertsCache;

  const response = await fetch(
    `${EXPERTS_URL}?filterByFormula={Beschikbaar}`,
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
