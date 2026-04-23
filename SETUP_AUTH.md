# LesCoach — Auth setup (scholen, leraren, magic link)

Deze guide beschrijft wat er éénmalig moet gebeuren om de login-functionaliteit live te zetten.

## 1. Airtable — drie nieuwe tabellen in dezelfde base

Maak deze tabellen handmatig aan in de LesCoach-base (dezelfde base als Kenniskaarten en Experts). De code zoekt op **tabelnaam**, niet op ID — houd de namen exact aan.

### Tabel: `Scholen`

| Veldnaam | Type | Opmerking |
| --- | --- | --- |
| `Schoolnaam` | Single line text | Primary field |
| `Contactpersoon` | Single line text | Naam school-admin |
| `Contact email` | Email | Wordt gebruikt voor de eerste admin-login |
| `Status` | Single select | Opties: `proef`, `actief`, `inactief` |
| `Abonnement start` | Date | ISO format |
| `Abonnement eind` | Date | ISO format |
| `Aangemaakt op` | Created time | Airtable-standaard |
| `Notities` | Long text | Optioneel |

### Tabel: `Leraren`

| Veldnaam | Type | Opmerking |
| --- | --- | --- |
| `Email` | Email | Primary field, uniek — wordt gebruikt voor login |
| `Naam` | Single line text | Voor- en achternaam |
| `School` | Link to `Scholen` | Max 1 gelinkt record |
| `Rol` | Single select | Opties: `admin`, `leraar` |
| `Status` | Single select | Opties: `uitgenodigd`, `actief`, `geblokkeerd` |
| `Laatste login` | Date + time | In UTC |
| `Uitgenodigd op` | Created time | |
| `Uitgenodigd door` | Single line text | E-mail van de persoon die uitnodigde |

### Tabel: `MagicLinks`

| Veldnaam | Type | Opmerking |
| --- | --- | --- |
| `Token` | Single line text | Primary field, lange willekeurige string |
| `Leraar` | Link to `Leraren` | Max 1 record |
| `Verloopt op` | Date + time | UTC — token is 15 minuten geldig |
| `Gebruikt op` | Date + time | Leeg zolang niet gebruikt; single-use |
| `Aangemaakt op` | Created time | |

## 2. Environment variables

Voeg toe in Vercel Dashboard → Project → Settings → Environment Variables:

| Variabele | Waarde | Toelichting |
| --- | --- | --- |
| `APP_URL` | `https://lescoach.nl` | Basis-URL voor magic-link mails |
| `AUTH_SECRET` | willekeurige string (≥ 32 tekens) | Voor cookie-signing. Gebruik `openssl rand -base64 48`. |
| `RESEND_API_KEY` | `re_xxx` | Van Resend.com. Gratis tier dekt 3000 mails/maand. Zonder deze var logt de magic link in Vercel-logs — handig tijdens dev. |
| `RESEND_FROM` | `Noor <noor@lescoach.nl>` | Verified sending domain in Resend. Fallback: `onboarding@resend.dev` voor tests. |

`AIRTABLE_API_TOKEN` en `AIRTABLE_BASE_ID` stonden al ingesteld.

## 3. Eerste school + admin aanmaken

1. Log in op `https://lescoach.nl/beheer` met het bestaande admin-wachtwoord (`LesCoach2026!`).
2. Klik op tab **Scholen** → **Nieuwe school**.
3. Vul schoolnaam en de contactpersoon in. Het contact-e-mailadres wordt meteen als school-admin aangemaakt in de Leraren-tabel.
4. De school-admin ontvangt automatisch een magic link per mail (of zie de Vercel-logs als er nog geen Resend key is).
5. School-admin logt in op `/login`, komt op `/school` en nodigt vervolgens de leraren uit.

## 4. Testen zonder Resend

Tijdens ontwikkeling is het niet verplicht om Resend in te stellen. Bij een inlogpoging zonder `RESEND_API_KEY` print de server:

```
[auth] Magic link (dev): https://lescoach.nl/api/auth/verify?token=xxxxx
```

Kopieer die URL uit de Vercel-logs en plak in je browser — exact dezelfde flow.

## 5. Beveiligingsnotities

- Magic-link tokens zijn **single-use** en **15 minuten geldig**. Bij verificatie wordt `Gebruikt op` ingevuld en het record uitgesloten voor hergebruik.
- Sessie-cookies zijn HTTP-only, Secure (productie), SameSite=Lax, TTL 30 dagen. Inhoud is alleen het leraar-record-ID plus een HMAC-ondertekening op basis van `AUTH_SECRET`.
- Rate limiting op `/api/auth/request` (IP + e-mail) moet later komen. Voor nu: Vercel's built-in DDoS-bescherming.
- Bij afmelden wordt het cookie geleegd; tokens blijven staan (niet nodig om extra op te ruimen — ze verlopen uit zichzelf).

