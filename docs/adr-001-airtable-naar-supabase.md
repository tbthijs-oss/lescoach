# ADR-001: Datalaag migreren van Airtable naar Supabase (EU)

**Status:** Voorgesteld
**Datum:** 8 juni 2026
**Beslissers:** Thomas Thijs (oprichter)

## Context

De volledige datalaag van LesCoach draait op Airtable, benaderd via losse `fetch()`-aanroepen
naar de Airtable REST API in zes `lib/`-modules (`airtable.ts`, `authDb.ts`, `expertsDb.ts`,
`gesprekkenDb.ts`, `meldcodeDb.ts`, plus de auth-helpers). Acht tabellen: Kenniskaarten,
Experts, Scholen, Leraren, MagicLinks, ExpertMagicLinks, Gesprekken, MeldcodeSignalen.

Krachten die nu spelen:

- **AVG en Normenkader IBP.** Het SSOE-voorstel verkoopt "AVG-veilig" en aansluiting op het
  Normenkader IBP. De eigen privacypagina vermeldt Airtable als verwerker in de **VS**, onder
  SCC's. Voor een koper wiens hele zorg datagovernance is, is data-in-de-VS de zwakste schakel.
  EU-hosting (Supabase, regio Frankfurt) is een aantoonbaar sterker verhaal en een concreet
  partnerschaps-deliverable.
- **Relationele groei.** Het datamodel is in de kern relationeel (Leraren horen bij Scholen,
  Gesprekken bij Leraren en Scholen, MeldcodeSignalen bij Leraren, Scholen en Gesprekken).
  Airtable is daar niet voor gebouwd: geen echte foreign keys, geen transacties, geen
  row-level security, en de basis is al een keer opnieuw geimporteerd waardoor `tbl`-id's
  veranderden (vandaar de naam-fallback in `airtable.ts`).
- **Limieten.** Airtable kent 5 requests/seconde per basis en 100.000 records per tabel. De
  Gesprekken-tabel groeit per gesprek; op termijn wordt dat een plafond.
- **Timing.** Dit speelt midden in het SSOE-traject. De live demo moet blijven werken precies
  wanneer Jeroen of de directie kan gaan kijken. Een migratie die productie destabiliseert is
  een groter risico dan VS-hosting.

## Decision

Migreer de datalaag naar **Supabase (managed Postgres), regio EU-Frankfurt**, in fasen achter
een dunne data-access-laag, met behoud van de huidige HMAC-cookie-magic-link-auth. Niet
uitvoeren onder deal-druk: inplannen als gefinancierd, afgebakend pilotwerk zodra SSOE tekent,
of in een rustig venster waarin productie niet onder de aandacht van de koper staat.

## Options Considered

### Optie A: Blijven op Airtable

| Dimensie | Beoordeling |
|----------|-------------|
| Complexiteit | Laag (niets doen) |
| Kosten | Laag |
| Schaalbaarheid | Beperkt (rate limit, recordplafond, geen relaties/RLS) |
| AVG / IBP | Zwak (VS-hosting, alleen SCC's) |
| Teamvertrouwdheid | Hoog |

**Pros:** geen werk, geen risico, productie blijft draaien.
**Cons:** ondermijnt het compliance-verhaal dat je aan SSOE verkoopt; loopt op termijn tegen
limieten; geen echte governance-controls.

### Optie B: Supabase (Postgres, EU-Frankfurt), aanbevolen

| Dimensie | Beoordeling |
|----------|-------------|
| Complexiteit | Middel (6 modules herschrijven, schema + data-import) |
| Kosten | Laag (gratis tier volstaat nu; Pro ~25 USD/maand) |
| Schaalbaarheid | Hoog (echte Postgres, indexen, RLS, transacties) |
| AVG / IBP | Sterk (EU-datacentrum, verwerkersovereenkomst, RLS) |
| Teamvertrouwdheid | Middel (SQL bekend; Supabase-client nieuw) |

**Pros:** EU-data-residency past direct in het IBP-verhaal; echte relaties en RLS; ruimte voor
groei; Supabase levert een kant-en-klare verwerkersovereenkomst.
**Cons:** echte migratie met risico; je beheert nu een database; data-import vereist zorg.

### Optie C: Neon of Vercel Postgres

| Dimensie | Beoordeling |
|----------|-------------|
| Complexiteit | Middel (zelfde herschrijf, minder kant-en-klare features) |
| Kosten | Laag |
| Schaalbaarheid | Hoog |
| AVG / IBP | Sterk mits EU-regio gekozen |
| Teamvertrouwdheid | Middel |

**Pros:** strak in het Vercel-ecosysteem; goedkope, snelle Postgres.
**Cons:** geen ingebouwde RLS-UI, auth of opslag; meer zelf bouwen. Voor LesCoach levert
Supabase meer out-of-the-box waarde (RLS, verwerkersovereenkomst, dashboard, later auth/opslag).

## Trade-off Analysis

De keuze is in essentie: **wegen compliance en relationele degelijkheid op tegen migratierisico
en beheerlast?** Voor LesCoach als zelfstandig product met een AVG-gevoelige B2B-koper: ja. Het
EU-data-residency-argument is geen nice-to-have maar het hart van de pitch. Tussen B en C wint
Supabase omdat het naast Postgres ook RLS, een verwerkersovereenkomst en (later) auth en opslag
levert: precies de bouwstenen die een eenpersoonsproduct niet zelf wil onderhouden. De
doorslaggevende beperking is **timing, niet techniek**: doe dit niet als de demo onder de loep
van de koper kan liggen.

## Schema-mapping (Airtable -> Postgres)

| Airtable-tabel | Postgres-tabel | Kernkolommen en relaties |
|---|---|---|
| Kenniskaarten | `kenniskaarten` | titel, categorie, samenvatting, wat_is_het, gevolgen, tips, trefwoorden `text[]`, pdf_url, bron_url |
| Experts | `experts` | naam, titel, bio, specialisaties `text[]`, email, telefoon, linkedin, foto_url, beschikbaar `bool`, ervaringsjaren, regio, taal |
| Scholen | `scholen` | schoolnaam, contactpersoon, contact_email, status, abonnement_start/eind, notities |
| Leraren | `leraren` | email `unique`, naam, **school_id `fk -> scholen`**, rol `enum`, status `enum`, laatste_login, uitgenodigd_door |
| MagicLinks | `magic_links` | token `unique`, **leraar_id `fk -> leraren`**, verloopt_op, gebruikt_op |
| ExpertMagicLinks | `expert_magic_links` | token, **expert_id `fk -> experts`**, verloopt_op, gebruikt_op |
| Gesprekken | `gesprekken` | zoekterm, categorie, datum, tokens_in/out, **school_id**, **leraar_id**, berichten `jsonb`, primary_kaart, samenvatting |
| MeldcodeSignalen | `meldcode_signalen` | datum, signaal_tekst, samenvatting, status `enum`, beoordeeld_door, notitie, **leraar_id**, **school_id**, **gesprek_id** |

Indexen: `leraren(email)`, `magic_links(token)`, `gesprekken(leraar_id, datum)`,
`meldcode_signalen(school_id, status)`. Berichten als `jsonb` (was JSON-string in Airtable).

## Row-Level Security (kernwinst t.o.v. Airtable)

- Leraren zien alleen hun eigen gesprekken: `leraar_id = auth-leraar`.
- School-admins en de aandachtsfunctionaris zien alleen rijen van hun eigen school.
- Meldcode-signalen alleen zichtbaar voor de aandachtsfunctionaris van die school.
- Kenniskaarten en beschikbare experts: publiek leesbaar.

Omdat de app HMAC-cookies gebruikt (geen Supabase Auth), draaien queries server-side met de
service-role-key en wordt autorisatie in de API-routes afgedwongen; RLS staat als tweede,
defensieve laag aan voor het geval een query lekt. (Bij latere overstap naar Supabase Auth kan
RLS de primaire laag worden.)

## Auth-besluit

**Behoud in fase 1 de bestaande HMAC-cookie-magic-link-auth.** Die zit in `auth.ts` /
`expertAuth.ts` en is niet structureel met Airtable verweven; alleen de Leraren/Experts- en
MagicLinks-records verhuizen naar Postgres. Dat houdt de migratie klein en het risico laag.
Supabase Auth is een aparte, latere beslissing (eigen ADR), niet nodig voor het EU-verhaal.

## Migratieplan (gefaseerd, omkeerbaar)

1. [ ] **Seam aanbrengen.** Introduceer een dunne `lib/db/`-interface (dezelfde functienamen die
   de modules nu exporteren). Eerst alleen Airtable erachter, gedrag identiek, geen risico.
2. [ ] **Supabase-project** in regio EU-Frankfurt; verwerkersovereenkomst activeren.
3. [ ] **Schema** via migratie-SQL (tabellen, enums, FK's, indexen hierboven).
4. [ ] **Data-import** met een eenmalig script: Airtable-export -> transform (JSON-string
   berichten -> jsonb, linked-record-id's -> FK's) -> insert. Verifieer recordaantallen per
   tabel.
5. [ ] **Module voor module** de Supabase-implementatie achter de seam zetten, beginnend bij de
   minst risicovolle (Kenniskaarten, read-only) en eindigend bij Gesprekken/Meldcode (schrijf).
   Per module: shadow-read en vergelijk met Airtable voor cutover.
6. [ ] **RLS-policies** activeren als defensieve laag.
7. [ ] **Env-vars** toevoegen (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`);
   Airtable-vars pas verwijderen na cutover.
8. [ ] **Cutover** met een feature-flag (`DATA_BACKEND=supabase`) zodat terugschakelen één env-
   wijziging is.
9. [ ] **`/api/health`** uitbreiden met een Supabase-ping naast de bestaande checks.
10. [ ] **Privacypagina** bijwerken: verwerker Supabase (EU) i.p.v. Airtable (VS).

## Consequences

**Makkelijker:** EU-data-residency en een sterker IBP/AVG-verhaal; echte relaties, transacties,
indexen en RLS; betrouwbare audit-trail voor meldcode; geen rate-limit-/recordplafond-zorgen;
de "verwerkersovereenkomst beschikbaar"-belofte wordt hard.

**Moeilijker:** je beheert nu een database (back-ups, migraties, monitoring); de data-import
vereist zorgvuldige verificatie; tweede systeem om in de gaten te houden.

**Later herzien:** overstap naar Supabase Auth (eigen ADR); of analytics en zware queries beter
in Postgres-views passen; opslag van PDF-kenniskaarten naar Supabase Storage.

## Effort en timing

Grove inschatting: **3 tot 5 werkdagen** (seam + schema + import + 6 modules + flag + verificatie),
plus een stabilisatieweek met dubbel draaien. **Niet** uitvoeren terwijl de SSOE-demo onder de
aandacht kan zijn. Aanbevolen volgorde: voorstel nu versturen met "EU-datahosting" als
partnerschaps-deliverable op de roadmap; migratie uitvoeren zodra getekend of in een rustig
venster.
