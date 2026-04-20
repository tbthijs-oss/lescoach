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

const BASE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`;

const FIELD_MAP: Record<string, keyof Kenniskaart | null> = {
  fld3DLuFhoAMOUEph: "titel",
  fldWOw0vqNrNMTkip: "categorie",
  fldkIgAECHweJb5PW: "samenvatting",
  fldpHHTnFK9uPv4Qv: "watIsHet",
  fldGMI6li2GD9O9Bk: "gevolgen",
  fldPq0TsXzIEDMdiL: "tips",
  fld39hrdXpTYZF1NH: "trefwoorden",
  fldNo7eNNabDY2xSH: "pdfUrl",
  fldpfT1FwSVT4qNrK: "bronUrl",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseRecord(record: any): Kenniskaart {
  const fields = record.fields;
  return {
    id: record.id,
    titel: fields["fld3DLuFhoAMOUEph"] || "",
    categorie: fields["fldWOw0vqNrNMTkip"]?.name || fields["fldWOw0vqNrNMTkip"] || "",
    samenvatting: fields["fldkIgAECHweJb5PW"] || "",
    watIsHet: fields["fldpHHTnFK9uPv4Qv"] || "",
    gevolgen: fields["fldGMI6li2GD9O9Bk"] || "",
    tips: fields["fldPq0TsXzIEDMdiL"] || "",
    trefwoorden: (fields["fld39hrdXpTYZF1NH"] || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => (typeof t === "string" ? t : t.name)
    ),
    pdfUrl: fields["fldNo7eNNabDY2xSH"] || "",
    bronUrl: fields["fldpfT1FwSVT4qNrK"] || "",
  };
}

export async function getAllKenniskaarten(): Promise<Kenniskaart[]> {
  const response = await fetch(BASE_URL, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
    },
    next: { revalidate: 3600 }, // Cache 1 hour
  });

  if (!response.ok) {
    console.error("Airtable error:", response.status, await response.text());
    return [];
  }

  const data = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.records || []).map((r: any) => parseRecord(r));
}

export async function searchKenniskaarten(
  query: string,
  trefwoorden: string[] = []
): Promise<Kenniskaart[]> {
  const all = await getAllKenniskaarten();
  const queryLower = query.toLowerCase();
  const trefLower = trefwoorden.map((t) => t.toLowerCase());

  // Score each kenniskaart by relevance
  const scored = all.map((k) => {
    let score = 0;
    const searchText = [
      k.titel,
      k.categorie,
      k.samenvatting,
      k.trefwoorden.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    // Exact title match = highest score
    if (searchText.includes(queryLower)) score += 10;

    // Trefwoorden match
    trefLower.forEach((t) => {
      if (k.trefwoorden.some((kt) => kt.toLowerCase().includes(t))) score += 5;
      if (searchText.includes(t)) score += 2;
    });

    // Word-by-word matching
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

// Suppress unused warning for FIELD_MAP
void FIELD_MAP;
