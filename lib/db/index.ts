/**
 * Data-access seam (ADR-001).
 *
 * Doel: call sites importeren datalaag-functies voortaan uit `@/lib/db` in
 * plaats van rechtstreeks uit `@/lib/airtable`, `@/lib/authDb`, enz. Zo kan de
 * implementatie per module van Airtable naar Supabase omschakelen zonder de
 * call sites opnieuw aan te raken.
 *
 * Status: fase 1. Alles delegeert nog naar de bestaande Airtable-modules; gedrag
 * is identiek. De Supabase-implementaties landen later achter dezelfde namen,
 * geselecteerd via DATA_BACKEND. Zie docs/adr-001-airtable-naar-supabase.md.
 */
export const DATA_BACKEND = (process.env.DATA_BACKEND ?? "airtable") as
  | "airtable"
  | "supabase";

export * from "@/lib/airtable";
export * from "@/lib/authDb";
export * from "@/lib/expertsDb";
export * from "@/lib/gesprekkenDb";
export * from "@/lib/meldcodeDb";
