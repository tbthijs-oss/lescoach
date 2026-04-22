/**
 * Server-side PII-filter voor LesCoach.
 *
 * Doel: voorkomen dat direct identificerende persoonsgegevens van leerlingen,
 * ouders of medewerkers ongefilterd naar Anthropic worden verstuurd. Dit is
 * een beheersmaatregel die in de DPIA (LesCoach-DPIA-Concept.md) is toegezegd
 * en die de ernst van risico 2 (onbedoelde PII-invoer) verlaagt.
 *
 * Wat hier gefilterd wordt:
 *  - e-mailadressen
 *  - IBAN-rekeningnummers
 *  - BSN (9 cijfers)
 *  - Nederlandse telefoonnummers (mobiel en vast, met of zonder landcode)
 *  - Nederlandse postcodes (1234 AB)
 *  - Geboortedata (DD-MM-YYYY en varianten)
 *
 * Wat bewust NIET hier gefilterd wordt:
 *  - Voor- en achternamen. De valse-positief-rate is te hoog ("Groep Vijf",
 *    "De Vries" als straatnaam, enzovoort). In plaats daarvan instrueert de
 *    system prompt Noor om geen namen te verwerken en de leerkracht terug
 *    te sturen naar initialen. Dat is laag 1. Laag 2 is dit regex-filter.
 *    Laag 3 zou een NER-model kunnen zijn — later overwegen.
 *
 * Aanroep vanuit app/api/chat/route.ts:
 *   const { messages: filtered, anyDetected } = filterPiiFromMessages(messages);
 */

export interface PiiDetection {
  type: string;
  count: number;
}

export interface PiiFilterResult {
  filtered: string;
  detections: PiiDetection[];
  hasPii: boolean;
}

const PATTERNS: Array<{ type: string; re: RegExp; replacement: string }> = [
  // E-mail: [word chars incl . _ % + -]@[domain].[tld 2+]
  {
    type: "email",
    re: /\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g,
    replacement: "[EMAIL]",
  },
  // IBAN: 2 letters + 2 digits + 4-30 letters/digits, met optionele spaties
  {
    type: "iban",
    re: /\b[A-Z]{2}\d{2}\s?(?:[A-Z0-9]\s?){8,30}\b/g,
    replacement: "[IBAN]",
  },
  // BSN: precies 9 cijfers, als los woord. Pakt ook "123.456.789" varianten niet —
  // die zijn zeldzaam genoeg om in laag 3 te laten vallen.
  {
    type: "bsn",
    re: /\b\d{9}\b/g,
    replacement: "[BSN]",
  },
  // Nederlandse telefoonnummers: +31 / 0031 / 0 gevolgd door 9 of 10 cijfers,
  // met spaties of streepjes toegestaan.
  {
    type: "telefoon",
    re: /(?:\+31|0031|\b0)[\s-]?\d(?:[\s-]?\d){8,9}\b/g,
    replacement: "[TELEFOON]",
  },
  // Nederlandse postcode: 4 cijfers + optionele spatie + 2 hoofdletters
  {
    type: "postcode",
    re: /\b\d{4}\s?[A-Z]{2}\b/g,
    replacement: "[POSTCODE]",
  },
  // Geboortedatum: DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY met jaar 19xx of 20xx
  {
    type: "geboortedatum",
    re: /\b(?:0?[1-9]|[12]\d|3[01])[-/.](?:0?[1-9]|1[0-2])[-/.](?:19|20)\d{2}\b/g,
    replacement: "[DATUM]",
  },
];

/**
 * Filter één tekststring. Vervangt herkende PII-patronen door placeholders
 * en geeft terug welke typen zijn aangetroffen.
 */
export function filterPii(input: string): PiiFilterResult {
  if (!input) {
    return { filtered: input ?? "", detections: [], hasPii: false };
  }

  let out = input;
  const detections: PiiDetection[] = [];

  for (const { type, re, replacement } of PATTERNS) {
    // match() met /g geeft array of null — geen lastIndex-problemen.
    const matches = out.match(re);
    if (matches && matches.length > 0) {
      detections.push({ type, count: matches.length });
      out = out.replace(re, replacement);
    }
  }

  return {
    filtered: out,
    detections,
    hasPii: detections.length > 0,
  };
}

/**
 * Filter alle user-berichten in een gesprek. Assistant-berichten worden
 * niet gefilterd omdat die uit de modeluitvoer komen (waar we Noor al
 * instrueren om geen PII te gebruiken).
 *
 * Merk op: dit filtert de VOLLEDIGE geschiedenis bij elke aanroep. Dat is
 * bewust — zo hoeft de frontend niets bij te houden over wat al gefilterd is,
 * en een datalek in de conversatie­opslag bevat nooit ongefilterde PII.
 */
export function filterPiiFromMessages<T extends { role: string; content: string }>(
  messages: T[]
): {
  messages: T[];
  anyDetected: boolean;
  detections: PiiDetection[];
} {
  const allDetections: PiiDetection[] = [];
  const filtered = messages.map((m) => {
    if (m.role !== "user" || typeof m.content !== "string") return m;
    const result = filterPii(m.content);
    if (result.hasPii) {
      allDetections.push(...result.detections);
    }
    return { ...m, content: result.filtered };
  });

  return {
    messages: filtered,
    anyDetected: allDetections.length > 0,
    detections: allDetections,
  };
}

/**
 * Geeft een korte, mens­leesbare samenvatting van wat er gefilterd is.
 * Gebruik voor logging (niet voor eindgebruikers — die krijgen een
 * algemene melding via de UI).
 */
export function summarizeDetections(detections: PiiDetection[]): string {
  if (detections.length === 0) return "geen PII gedetecteerd";
  return detections
    .map((d) => (d.count > 1 ? `${d.type} ×${d.count}` : d.type))
    .join(", ");
}
