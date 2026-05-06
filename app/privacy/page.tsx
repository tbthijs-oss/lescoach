import Link from "next/link";
import { NoorAvatar } from "@/components/JeroenAvatar";

export const metadata = {
  title: "Privacybeleid – LesCoach",
  description: "Hoe LesCoach omgaat met gegevens van leerkrachten en leerlingen.",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-[100dvh] bg-white">
      <header className="bg-white/85 backdrop-blur border-b border-amber-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <NoorAvatar size={32} />
            <span className="text-slate-800 font-semibold text-sm">LesCoach</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Terug naar home
          </Link>
        </div>
      </header>

      <article className="max-w-2xl mx-auto px-6 py-14 text-slate-700">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacybeleid</h1>
        <p className="text-sm text-slate-400 mb-10">Laatst bijgewerkt: mei 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">1. Wie zijn wij?</h2>
          <p className="text-sm leading-relaxed">
            LesCoach is een AI-ondersteund platform voor leerkrachten in het (speciaal) onderwijs. De dienst wordt aangeboden door Thomas Thijs, gevestigd in Nederland. Voor vragen over dit beleid kunt u contact opnemen via{" "}
            <a href="mailto:thomas@lescoach.nl" className="text-blue-600 underline">thomas@lescoach.nl</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">2. Welke gegevens verwerken wij?</h2>
          <p className="text-sm leading-relaxed mb-3">
            LesCoach verwerkt zo min mogelijk persoonsgegevens. Wij onderscheiden twee categorieën:
          </p>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4 text-sm">
            <div>
              <div className="font-semibold text-slate-800 mb-1">Leerkrachtgegevens (bij inloggen via school)</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1 leading-relaxed">
                <li>Naam en e-mailadres (voor magic-link inlog)</li>
                <li>School en rol (leraar / admin)</li>
                <li>Laatste inlogmoment</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-800 mb-1">Gespreksdata (anoniem)</div>
              <ul className="list-disc list-inside text-slate-600 space-y-1 leading-relaxed">
                <li>De berichten die u met Noor wisselt — <strong>geen namen van leerlingen</strong></li>
                <li>Zoekterm, gevonden kenniskaart, categorie</li>
                <li>Tijdstip en school (geen individuele leerling)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">3. Geen leerlingdossiers — PII-filter</h2>
          <p className="text-sm leading-relaxed">
            LesCoach vraagt nooit om namen, BSN-nummers, geboortedata of andere direct identificerende gegevens van leerlingen. Wij hanteren een automatisch PII-filter op de server: e-mailadressen, BSN-nummers, telefoonnummers en postcodes worden gefilterd vóórdat de tekst door Noor verwerkt wordt. Zo kunnen leerkrachten veilig over een leerling schrijven zonder het risico van AVG-overtredingen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">4. Waar worden gegevens opgeslagen?</h2>
          <p className="text-sm leading-relaxed mb-3">
            LesCoach maakt gebruik van de volgende diensten:
          </p>
          <div className="text-sm space-y-2">
            {[
              { dienst: "Vercel (hosting)", locatie: "VS / wereldwijd", toelichting: "Verwerker — SCCs van toepassing" },
              { dienst: "Airtable (database)", locatie: "VS", toelichting: "Verwerker — SCCs van toepassing" },
              { dienst: "Anthropic (AI-model)", locatie: "VS", toelichting: "Geen training op uw data via de API" },
              { dienst: "Resend (e-mail)", locatie: "VS", toelichting: "Alleen voor magic-link e-mails" },
            ].map((r) => (
              <div key={r.dienst} className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 text-sm">
                <span className="font-medium text-slate-700">{r.dienst}</span>
                <span className="text-slate-500">{r.locatie}</span>
                <span className="text-slate-500">{r.toelichting}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-4 leading-relaxed">
            Voor doorgifte buiten de EER zijn Standard Contractual Clauses (SCCs) van toepassing. Anthropic gebruikt gegevens die via de API worden verwerkt niet voor het trainen van zijn modellen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">5. Bewaartermijnen</h2>
          <p className="text-sm leading-relaxed">
            Gespreksdata wordt bewaard zolang de school een actief abonnement heeft, met een maximum van 2 jaar na het laatste gesprek. Leerkrachtaccounts worden verwijderd op verzoek van de schoolbeheerder of bij beëindiging van het abonnement. Magic-links verlopen automatisch.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">6. Uw rechten (AVG)</h2>
          <p className="text-sm leading-relaxed">
            U heeft het recht op inzage, correctie, verwijdering en bezwaar met betrekking tot uw persoonsgegevens. Neem hiervoor contact op via{" "}
            <a href="mailto:thomas@lescoach.nl" className="text-blue-600 underline">thomas@lescoach.nl</a>. We reageren binnen 4 weken.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">7. Verwerkersovereenkomst</h2>
          <p className="text-sm leading-relaxed">
            Scholen die LesCoach afnemen via een abonnement kunnen een verwerkersovereenkomst (AVG art. 28) sluiten. Neem contact op via{" "}
            <a href="mailto:thomas@lescoach.nl" className="text-blue-600 underline">thomas@lescoach.nl</a> voor het opvragen van de modelovereenkomst.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">8. Beveiliging</h2>
          <p className="text-sm leading-relaxed">
            Sessies worden beveiligd via HMAC-gesigneerde cookies (Secure, SameSite=Strict). Alle communicatie verloopt over HTTPS. Inloggen gaat via magic-links — er worden geen wachtwoorden opgeslagen. De API is beveiligd met rate-limiting en invoervalidatie.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">9. Cookies</h2>
          <p className="text-sm leading-relaxed">
            LesCoach gebruikt uitsluitend functionele cookies (sessiebeheer). Er worden geen tracking- of advertentiecookies geplaatst. Er is geen cookie-banner nodig omdat wij geen toestemming-plichtige cookies gebruiken.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">10. Klachten</h2>
          <p className="text-sm leading-relaxed">
            Heeft u een klacht over de verwerking van uw gegevens? U kunt een klacht indienen bij de Autoriteit Persoonsgegevens via{" "}
            <a href="https://autoriteitpersoonsgegevens.nl" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">autoriteitpersoonsgegevens.nl</a>.
          </p>
        </section>
      </article>

      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white">
        <Link href="/" className="hover:text-slate-600">← Terug naar LesCoach</Link>
      </footer>
    </main>
  );
}
