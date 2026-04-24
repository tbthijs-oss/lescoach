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

// Kenniskaarten-tabel — bij voorkeur via env var AIRTABLE_TABLE_ID (een tbl...-id),
// met fallback op de tabelnaam "Kenniskaarten" zodat een geÃ¯mporteerde/gekloonde
// base altijd blijft werken ook al wisselt het ID.
const KENNISKAARTEN_TABLE = process.env.AIRTABLE_TABLE_ID || "Kenniskaarten";
const KENNISKAARTEN_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(KENNISKAARTEN_TABLE)}`;

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

// In-memory cache — mirrored pattern van experts (5 min TTL).
// Airtable-calls zijn duur genoeg om vermijden, en kenniskaarten muteren
// zelden (~1 keer per week via beheer-flow).
let kennisCache: Kenniskaart[] | null = null;
let kennisCacheTime = 0;
const KENNIS_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchKenniskaartenFromUrl(url: string): Promise<{ ok: boolean; status: number; records: unknown[]; body?: string }> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    const body = await response.text();
    return { ok: false, status: response.status, records: [], body };
  }
  const data = await response.json();
  return { ok: true, status: 200, records: data.records || [] };
}

export async function getAllKenniskaarten(): Promise<Kenniskaart[]> {
  const now = Date.now();
  if (kennisCache && now - kennisCacheTime < KENNIS_CACHE_TTL_MS) {
    return kennisCache;
  }

  // 1e poging: gebruik wat in de env var staat (ID Ã³f naam).
  const primary = await fetchKenniskaartenFromUrl(KENNISKAARTEN_URL);
  if (primary.ok && primary.records.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kennisCache = primary.records.map((r: any) => parseKenniskaartRecord(r));
    kennisCacheTime = now;
    return kennisCache;
  }

  // 2e poging: fallback op tabelnaam "Kenniskaarten" — self-healing als
  // het env var een verouderde tbl-id bevat na base-reimport.
  if (!primary.ok) {
    console.warn(
      `[airtable] primary kenniskaarten fetch faalde (${primary.status}); val terug op tabelnaam. Body: ${(primary.body || "").slice(0, 200)}`
    );
  } else if (primary.records.length === 0 && KENNISKAARTEN_TABLE !== "Kenniskaarten") {
    console.warn(
      `[airtable] primary fetch gaf 0 records voor '${KENNISKAARTEN_TABLE}'; val terug op tabelnaam "Kenniskaarten".`
    );
  }

  if (KENNISKAARTEN_TABLE !== "Kenniskaarten") {
    const fallbackUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent("Kenniskaarten")}`;
    const fallback = await fetchKenniskaartenFromUrl(fallbackUrl);
    if (fallback.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kennisCache = fallback.records.map((r: any) => parseKenniskaartRecord(r));
      kennisCacheTime = now;
      return kennisCache;
    }
    console.error(
      `[airtable] fallback op "Kenniskaarten" ook gefaald (${fallback.status}): ${(fallback.body || "").slice(0, 200)}`
    );
  }

  // Fallback faalde ook — we cachen NIET om op volgende call opnieuw te proberen.
  return [];
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
  // so the conversation always produces some result. We log this as a
  // "coverage miss" — it tells us which queries don't match any kenniskaart,
  // which is signal for content gaps we should fill.
  if (matched.length === 0) {
    console.warn(
      `[coverage-miss] geen kenniskaart-match voor zoekterm="${query}" trefwoorden="${trefwoorden.join(",")}"`
    );
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

// Table ID for Experts table in the LesCoach base (appUffpnWXsdmrhiw).
// Overridable via AIRTABLE_EXPERTS_TABLE_ID env var for forked bases.
export const EXPERTS_TABLE_ID =
  process.env.AIRTABLE_EXPERTS_TABLE_ID || "Experts";
const EXPERTS_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(EXPERTS_TABLE_ID)}`;

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
  // 5 min TTL: low enough that self-service edits via /expert/profiel land quickly,
  // high enough to absorb chat traffic without hammering Airtable.
  if (expertsCache && now - expertsCacheTime < 300_000) return expertsCache;

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
