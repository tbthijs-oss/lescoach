# Data-import Airtable -> Supabase (ADR-001, stap 4)

Eenmalig script (Node), uit te voeren bij de cutover. Volgorde respecteert foreign keys.

## Volgorde
1. `scholen`, `kenniskaarten`, `experts` (geen FK's)
2. `leraren` (FK -> scholen)
3. `magic_links` (FK -> leraren), `expert_magic_links` (FK -> experts)
4. `gesprekken` (FK -> scholen, leraren)
5. `meldcode_signalen` (FK -> leraren, scholen, gesprekken)

## Transformaties
- **Linked records -> foreign keys.** Airtable linkt via record-id-arrays. Bouw een
  `airtableId -> supabaseUuid` map per tabel tijdens de insert en zet de FK met die map.
- **Berichten.** In Airtable een JSON-*string* in Gesprekken.Berichten; insert als `jsonb`
  (`JSON.parse` voor het wegschrijven).
- **Multi-select -> text[].** `Trefwoorden`, `Specialisaties` worden Postgres `text[]`.
- **Checkbox -> boolean.** `Beschikbaar`.
- **Datums.** Airtable ISO-strings -> `timestamptz` / `date`.

## Verificatie
Vergelijk `count(*)` per tabel met Airtable. Steekproef 5 gesprekken: berichten-jsonb gelijk
aan origineel. Controleer dat elke `leraar.school_id` resolveert.

## Toepassen
Met de Supabase MCP (`apply_migration`) of de Supabase CLI. Migratiebestand:
`supabase/migrations/0001_init.sql`.
