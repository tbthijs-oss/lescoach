# LesCoach — Project Instructions

> Plak deze inhoud als project instructions in het Cowork-project dat aan `C:\Projects\LesCoach` hangt. Laatst bijgewerkt 28 april 2026.

---

## Wat is LesCoach?

Een Nederlandstalige AI-chatbot voor leerkrachten in het speciaal onderwijs. AI-persona heet **Noor**. Ze stelt gerichte vragen, zoekt kenniskaarten op uit Airtable, en koppelt aan een passende expert. Twee gebruikersrollen: `leraar` (gewone gebruiker) en `admin` (school-beheerder + aandachtsfunctionaris).

- **Live:** https://lescoach.nl
- **Beheer (Thomas, eigenaar):** https://lescoach.nl/beheer (wachtwoord: `LesCoach2026!`)
- **School-admin:** https://lescoach.nl/school
- **Expert self-service:** https://lescoach.nl/expert/profiel
- **GitHub:** github.com/tbthijs-oss/lescoach
- **Health-check:** https://lescoach.nl/api/health

---

## Werkmap (canoniek — niet meer in OneDrive)

- **Lokale werkmap:** `C:\Projects\LesCoach`
- **Selected folder in Cowork:** zelfde — `C:\Projects\LesCoach`
- **Secrets:** `C:\Projects\LesCoach\.env.local` (gedekt door `.env*` in `.gitignore`)
- **NOOIT** werken vanuit `C:\Users\tbthi\OneDrive\...` — die map is afgeschaft per 2026-04-27 omdat OneDrive-sync silent files afknipt bij multi-file edits.

## Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) met Tool Use
- **Database:** Airtable, base ID `appUffpnWXsdmrhiw` (workspace "My True Dosha")
- **Hosting:** Vercel — project `prj_4OfLQ2VObO8u2JSIrKgB5RNqWWEa`, team `team_pTl1R1MDX0Dtx9DbMt4qyLTm`
- **Email:** Resend, geverifieerd domein `lescoach.nl` (`noor@lescoach.nl` als afzender)
- **Auth:** magic-link e-mail naar leraren (HMAC-signed cookie sessie 30 dagen). Voor `/beheer` aparte ADMIN_TOKEN cookie.

---

## Airtable-schema (base `appUffpnWXsdmrhiw`)

| Tabel | ID | Belangrijkste velden |
|---|---|---|
| Kenniskaarten | `tbl5mFsbWetGe5Yyi` | Titel, Categorie, Samenvatting, Wat is het, Gevolgen, Tips, Trefwoorden, PDF URL, Bronpagina URL |
| Experts | `tbluWjE1A4oVazNDR` | Naam, Titel, Bio, Specialisaties, Email, Telefoon, LinkedIn, Foto URL, Beschikbaar, Ervaringsjaren, Regio, Taal |
| Scholen | `tblWcFqMwX5Yod6Tv` | Schoolnaam, Contactpersoon, Contact email, Status, Abonnement start/eind, Notities |
| Leraren | `tblRnse1hrexn6cTW` | Email, Naam, School (link), Rol, Status, Laatste login, Uitgenodigd door |
| MagicLinks | `tblXMibtfpZV8TE6q` | Token, Leraar, Verloopt op, Gebruikt op |
| ExpertMagicLinks | `tblARLZjwWWmAx2lN` | (zelfde shape) |
| Gesprekken | `tblFkWxgq19ckqXIs` | Zoekterm, Categorie, Kenniskaarten, Datum, TokensIn/Out, School, Leraar, Berichten (JSON), PrimaryKaart, Samenvatting |
| MeldcodeSignalen | `tblZxD3Yyn2M0DpXD` | Datum, SignaalTekst, Samenvatting, Status, BeoordeeldDoor, BeoordelingsNotitie, Leraar, School, Gesprek |

---

## Codebase-highlights

```
C:\Projects\LesCoach\
├── app/
│   ├── chat/page.tsx                # Chat-UI: chips, eerdere gesprekken, mobile full-page results
│   ├── api/chat/route.ts            # tool_choice "none" <3 turns, force tool 4+ turns
│   ├── school/                      # School-admin dashboard
│   ├── expert/profiel/page.tsx      # Self-service expert
│   └── beheer/                      # Thomas-only CMS
├── lib/
│   ├── systemPrompt.ts              # Noor persona — minimum 2 substantiële vragen
│   ├── airtable.ts                  # Kenniskaarten + experts (5-min cache, name-fallback)
│   ├── auth.ts / authDb.ts          # HMAC sessies + magic-links
│   ├── gesprekkenDb.ts              # gesprekkenlog
│   ├── meldcodeDb.ts                # meldcode-signalen
│   └── pii.ts                       # regex PII filter
├── middleware.ts                     # Beschermt /chat, /school, /expert, /beheer, /api/*
└── .env.local                       # GITHUB_PAT, VERCEL_TOKEN (NIET committen)
```

---

## Noor — gespreksregels

Drie fasen: intake (min 2, max 4 vragen), check-in, tool-aanroep, eindrapport met `<noor-data>` JSON-blok. Volledige regels in `lib/systemPrompt.ts`.

**Hard enforcement** in `app/api/chat/route.ts`:

- `userTurnCount < 3` → `tool_choice: { type: "none" }` — Noor MOET nog een vraag stellen. Voorkomt dat ze al na 1-2 zinnen springt naar het rapport.
- `userTurnCount >= 4` → `tool_choice: { type: "tool", name: "zoek_kenniskaarten" }` — Noor MOET het rapport schrijven.
- 3 user-turns → `auto`, Noor mag zelf kiezen.

**Mobiel UX:** resultaten op een **aparte volledige pagina** met `← Terug naar gesprek`-knop, geen bottom-sheet meer. Auto-switch naar resultaten zodra de tool klaar is.

**Verboden zinnen** ("Fijn dat je contact opneemt", "Je bent op de juiste plek", etc.) staan in `systemPrompt.ts`. Nederlandse taalkwaliteit-regels (onderwerp-werkwoord-congruentie, geen anglicismen) ook ingebakken.

**Meldcode-protocol:** als Noor een signaal herkent vult ze `signaal` in `<noor-data>`. De chat-route logt automatisch naar `MeldcodeSignalen`-tabel; aandachtsfunctionaris ziet het op `/school/meldcode`.

---

## Secrets — `.env.local`

Bestand: `C:\Projects\LesCoach\.env.local` (al aangemaakt; staat in `.gitignore`).

```env
GITHUB_PAT=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxx
AIRTABLE_API_TOKEN=
AIRTABLE_BASE_ID=appUffpnWXsdmrhiw
AIRTABLE_TABLE_ID=Kenniskaarten
ANTHROPIC_API_KEY=
AUTH_SECRET=
```

**GitHub PAT** — https://github.com/settings/tokens, Classic PAT, scope `repo`, 7-30 dagen. Vervangen na elke sessie waarin gedeeld met Claude.

**Vercel token** — https://vercel.com/account/settings/tokens, expiration 1 dag aanbevolen. Voor handmatige deploy-trigger als de GitHub-webhook stilvalt.

Productie-env vars staan in Vercel zelf, niet hier.

## Vercel productie-env vars (al gezet)

| Var | Doel |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API |
| `AIRTABLE_API_TOKEN` | PAT voor Airtable base |
| `AIRTABLE_BASE_ID` | `appUffpnWXsdmrhiw` |
| `AIRTABLE_TABLE_ID` | `Kenniskaarten` |
| `RESEND_API_KEY` / `RESEND_FROM` | mailing van `noor@lescoach.nl` |
| `AUTH_SECRET` / `APP_URL` | sessie HMAC + base URL |
| `ADMIN_TOKEN` / `ADMIN_PASSWORD` | `/beheer` toegang |
| `EXPERT_EMAIL` | fallback contact-expert |
| `FOUNDER_NAAM` / `FOUNDER_EMAIL` | Thomas' identiteit voor founder-shortcut |
| `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` | (nog te zetten) TTS |

---

## Workflow

```powershell
cd C:\Projects\LesCoach

# Lokaal draaien
npm run dev

# Build verifiëren
npm run build

# Wijzigingen pushen
git add -A
git commit -m "msg"
git push origin main
```

Vercel auto-deploy via GitHub-webhook is wisselend betrouwbaar. Fallback met `.env.local` token:

```powershell
$env:VERCEL_TOKEN = (Get-Content .env.local | Select-String '^VERCEL_TOKEN=' | ForEach-Object { ($_ -split '=', 2)[1] })

curl.exe -X POST -H "Authorization: Bearer $env:VERCEL_TOKEN" -H "Content-Type: application/json" `
  "https://api.vercel.com/v13/deployments?teamId=team_pTl1R1MDX0Dtx9DbMt4qyLTm&forceNew=1&skipAutoDetectionConfirmation=1" `
  -d '{\"name\":\"lescoach\",\"target\":\"production\",\"project\":\"prj_4OfLQ2VObO8u2JSIrKgB5RNqWWEa\",\"gitSource\":{\"type\":\"github\",\"ref\":\"main\",\"repoId\":1216025760}}'
```

---

## Werkafspraken met Claude

- **Beslis zelf, vraag niet.** Geen multiple-choice vragen voor operationele keuzes (env-var-namen, defaults, port-nummers). Kies de redelijke default, voer uit, rapporteer achteraf. Alleen vragen bij strategische keuzes (positionering, prijs, tone).
- **Werk autonoom.** Airtable, GitHub, Vercel, Resend zelf afhandelen — gebruik `.env.local` voor PAT/tokens. Geen taken naar Thomas doorschuiven als je het kunt regelen.
- **Werk in `C:\Projects\LesCoach`** — niet in OneDrive. OneDrive-sync corrumpeert multi-file edits silent.
- **Bij blocker (DNS, externe API, manual UI-click)**, niet wachten — beschrijf de blocker, sla over, ga door met ander werk.
- **Resultaten teruggeven met `computer://` links** zodat Thomas direct files kan openen.

---

## Wat er al staat

- Homepage, onboarding, chat-UI met chips + top-3 + Noor-avatar (owl)
- Mobiel-first responsive design met **separate full-page results view** (geen bottom-sheet meer)
- TTS (ElevenLabs proxy) + STT (Web Speech API)
- Magic-link auth (leraar + expert + admin)
- School-dashboard `/school` met onboarding-checklist + leraren-CRUD + batch-uitnodiging
- Analytics-pagina `/school/gebruik` met gesprekken-trend en categorieën
- Meldcode-pagina `/school/meldcode` met status-flow
- Expert self-service `/expert/profiel`
- Beheer-CMS `/beheer` (alleen voor Thomas)
- PII-filter (regex laag 2)
- Rate-limit op `/api/chat` (30/min) en `/api/auth/*` (5/min)
- Security headers + CSP, error.tsx, not-found.tsx, loading.tsx
- Kenniskaarten in-memory cache (5 min) + name-fallback bij dode env-var
- Fuzzy expert matching met 21-cluster synoniem-map
- Gespreksgeschiedenis (laatste 10 gesprekken per leraar)
- Meldcode audit-trail (auto-log, admin-review-flow)
- `/api/health` endpoint (Airtable + env-checks)
- Structured JSON error-logging in chat-route
- Resend `lescoach.nl` domein geverifieerd, mails komen van `noor@lescoach.nl`
- **Minimum 2 substantiële vragen** voordat Noor naar Fase 2 gaat (commit `069b876`)
- **Mobile full-page results** met `← Terug naar gesprek`-knop (commit `069b876`)

---

## Mogelijke volgende stappen

- Bestuur-pitch doorlopen (concept-deck + verwerkersovereenkomst staan in OneDrive)
- ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID env vars zetten zodat de spreek-knop bij Noor's berichten werkt
- Echte experts in productie zetten via `/beheer/experts`
- Kenniskaarten uitbreiden — gebruik `[coverage-miss]` logs in Vercel om content-gaps te vinden
- Echte PDF-download (nu via browser print-to-PDF) als leerkrachten dat vragen
- Email-notificatie naar admin bij nieuwe meldcode-signalen
- Naam van oprichter toevoegen aan homepage
- Onboarding-fee strategie

---

## Handige IDs (niet-gevoelig)

- Admin-wachtwoord (`/beheer`): `LesCoach2026!`
- Admin-cookie (`beheer_token`): `lescoach-beheer-267327eadaa9d63464abf673c46d295a`
- GitHub repo ID: `1216025760`
- Resend domein-id (lescoach.nl): `fcfee201-0c0f-4d5f-a42d-10d66e5c9d20`
- Vercel project ID: `prj_4OfLQ2VObO8u2JSIrKgB5RNqWWEa`
- Vercel team ID: `team_pTl1R1MDX0Dtx9DbMt4qyLTm`
- Airtable base ID (LesCoach): `appUffpnWXsdmrhiw`

Gevoelige tokens (Vercel API, GitHub PAT, Airtable PAT) niet in dit document. In `.env.local` opslaan en sessie-specifiek vervangen.
