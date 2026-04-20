import Link from "next/link";
import { NoorAvatar } from "@/components/JeroenAvatar";

// ─── Data ─────────────────────────────────────────────────────────────────────

const BENEFITS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    titel: "Direct antwoord, geen wachtrij",
    tekst:
      "Geen afspraak plannen, geen e-mail sturen en wachten. Noor geeft binnen 5 minuten een gericht advies — ook op zaterdag om 22:00.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    titel: "Volledig anoniem",
    tekst:
      "Je noemt nooit de naam van het kind. Noor werkt altijd met 'de leerling' — geen persoonsgegevens, geen dossier, geen AVG-risico.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    titel: "Concrete klassenstips",
    tekst:
      "Geen vage theorie. Noor geeft je tips die je morgen al kunt toepassen — specifiek voor jouw groep, jouw leerling, jouw situatie.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    titel: "De juiste expert, automatisch gematchd",
    tekst:
      "Noor zoekt de specialist die het beste past bij de specifieke uitdaging — niet een generalist, maar iemand met precies die specialisatie.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    titel: "Volledig rapport naar de expert",
    tekst:
      "Wanneer je een expert inschakelt, ontvangen zij automatisch het hele gespreksverslag en de gevonden kenniskaarten. Jij hoeft niets opnieuw uit te leggen.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    titel: "Begrijpelijke taal",
    tekst:
      "Geen DSM-codes, geen klinisch jargon. Noor legt uit in gewone taal wat er speelt en wat het betekent voor jouw klas.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    titel: "Juridisch veilig",
    tekst:
      "Noor stelt nooit een diagnose. Ze werkt binnen de kaders van de BIG-wet, AVG, Jeugdwet en de Meldcode — altijd. Dat is ingebakken, niet optioneel.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2v-1a9 9 0 10-14 0v1a2 2 0 002 2z" />
      </svg>
    ),
    titel: "Ontlast de IB-er",
    tekst:
      "Leerkrachten komen beter geïnformeerd bij de IB-er — of lossen het zelf op met de tips. Minder 'even overleggen', meer gerichte hulp.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    titel: "24/7 beschikbaar",
    tekst:
      "Ook 's avonds, in het weekend, tijdens de zomervakantie. Wanneer jij klaar bent om erover na te denken, is Noor er.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    titel: "Werkt op elke telefoon",
    tekst:
      "Even snel een vraag stellen tijdens de pauze vanaf je telefoon. Geen app downloaden, geen account aanmaken — gewoon de browser.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    titel: "Geen login, geen gedoe",
    tekst:
      "Geen account aanmaken, geen wachtwoord onthouden, geen cookie-acceptatie. Je start het gesprek en Noor helpt je meteen.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    titel: "Gebaseerd op bewezen kenniskaarten",
    tekst:
      "De kenniskaarten komen van Kennisgroep Speciaal en zijn samengesteld door specialisten. Geen Wikipedia, geen willekeurige blogs.",
  },
];

const VERGELIJK = [
  { zonder: "Wachten op een afspraak met de IB-er", met: "Direct antwoord — ook op zondagavond" },
  { zonder: "Zelf googelen op symptomen en dwalen", met: "Gerichte vragen die jouw situatie begrijpen" },
  { zonder: "Algemeenadvies dat niet bij jouw groep past", met: "Tips specifiek voor jouw leerling en context" },
  { zonder: "Extern bureau inschakelen voor eerste oriëntatie", met: "Gratis oriëntatie, expert alleen als het nodig is" },
  { zonder: "Alles opnieuw uitleggen aan elke nieuwe specialist", met: "Volledig rapport gaat automatisch mee naar de expert" },
  { zonder: "Risico op juridisch grijze uitspraken over een kind", met: "Altijd binnen BIG, AVG en Jeugdwet — geen uitzonderingen" },
];

const VOOR_WIE = [
  {
    rol: "Leerkracht",
    emoji: "👩‍🏫",
    punten: [
      "Je ziet iets bij een leerling maar weet niet precies wat",
      "Je zoekt concrete tips voor morgen in de klas",
      "Je wil weten of je je zorgen bij een expert moet neerleggen",
    ],
  },
  {
    rol: "IB-er",
    emoji: "📋",
    punten: [
      "Je wil leerkrachten een laagdrempelige eerste stap geven",
      "Je ontvangt beter voorbereide hulpvragen",
      "Je ziet welke thema's het meest spelen op school",
    ],
  },
  {
    rol: "Schooldirecteur",
    emoji: "🏫",
    punten: [
      "Je ondersteunt leerkrachten zonder extra budget voor begeleiding",
      "Je voldoet aan de zorgplicht van Wet passend onderwijs",
      "Je krijgt inzicht in de meest voorkomende uitdagingen",
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="flex flex-col min-h-[100dvh] bg-white">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <NoorAvatar size={32} />
            <span className="text-slate-800 font-semibold text-sm">LesCoach</span>
          </div>
          <Link
            href="/chat"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Gesprek starten →
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-b from-blue-50/60 to-white text-center">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <NoorAvatar size={88} className="drop-shadow-md" />
          </div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Hoi, ik ben Noor — specialist speciaal onderwijs
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-5">
            Snel de juiste{" "}
            <span className="text-blue-600">ondersteuning</span>{" "}
            voor jouw leerling
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Vertel wat je ziet. Ik stel je een paar gerichte vragen en geef je
            concrete tips — en koppel je aan de juiste expert als dat nodig is.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-colors shadow-md shadow-blue-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Vraag Noor om hulp
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Geen login · Volledig anoniem · Gratis in de pilotfase
          </p>
        </div>
      </section>

      {/* ── Hoe werkt het ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Hoe werkt het?</h2>
          <p className="text-slate-500 text-center mb-10 text-sm">Van vraag naar advies in minder dan 10 minuten</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                n: "1", kleur: "bg-blue-600",
                titel: "Vertel wat je ziet",
                tekst: "Beschrijf het gedrag of de situatie van de leerling. Noor stelt gerichte doorvragen — één tegelijk.",
              },
              {
                n: "2", kleur: "bg-blue-600",
                titel: "Ontvang kenniskaarten",
                tekst: "Je krijgt één of meer kenniskaarten met uitleg over de uitdaging en directe tips voor in de klas.",
              },
              {
                n: "3", kleur: "bg-blue-600",
                titel: "Schakel een expert in",
                tekst: "Wil je persoonlijk advies? Één klik koppelt je aan de juiste specialist — inclusief automatisch rapport.",
              },
            ].map((s) => (
              <div key={s.n} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className={`absolute -top-3 -left-3 w-8 h-8 ${s.kleur} text-white rounded-full flex items-center justify-center text-sm font-bold shadow`}>
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 mt-1">{s.titel}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Voordelen ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Alles wat LesCoach voor je doet</h2>
          <p className="text-slate-500 text-center mb-12 text-sm">Gebouwd voor leerkrachten die geen tijd hebben om te zoeken</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.titel} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  {b.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">{b.titel}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{b.tekst}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Vergelijking ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Zonder Noor vs. met Noor</h2>
          <p className="text-slate-500 text-center mb-10 text-sm">Wat verandert er voor een leerkracht?</p>
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 bg-slate-800 text-white text-sm font-semibold">
              <div className="px-5 py-3 border-r border-slate-700">Zonder LesCoach</div>
              <div className="px-5 py-3 text-blue-300">Met LesCoach</div>
            </div>
            {VERGELIJK.map((v, i) => (
              <div key={i} className={`grid grid-cols-2 text-sm border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                <div className="px-5 py-4 text-slate-500 border-r border-slate-100 flex gap-2 items-start">
                  <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                  {v.zonder}
                </div>
                <div className="px-5 py-4 text-slate-700 flex gap-2 items-start">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                  {v.met}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Wie is Noor ──────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <NoorAvatar size={88} className="shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-3">Wie is Noor?</h2>
              <p className="text-blue-100 leading-relaxed mb-4">
                Noor is een AI-assistent getraind als specialist speciaal onderwijs. Ze combineert kennis over ADHD, autisme, dyslexie, angststoornissen, motorische problemen, gedragsproblemen en meer — en koppelt die kennis aan een netwerk van echte experts.
              </p>
              <p className="text-blue-100 leading-relaxed mb-6">
                Ze stelt altijd de juiste vervolgvragen, werkt volledig anoniem en weet precies wanneer ze moet doorverwijzen. Geen diagnoses, geen medisch advies — wel concrete, toepasbare hulp.
              </p>
              <div className="flex flex-wrap gap-2">
                {["ADHD", "Autisme", "Dyslexie", "Angststoornissen", "Motorische problemen", "Gedragsproblemen", "Aandacht & concentratie", "Sociaal-emotioneel", "Taal & lezen", "Hoogbegaafdheid"].map((tag) => (
                  <span key={tag} className="bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Voor wie ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">Voor wie is LesCoach?</h2>
          <p className="text-slate-500 text-center mb-10 text-sm">Iedereen in en om de klas</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VOOR_WIE.map((v) => (
              <div key={v.rol} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="text-3xl mb-3">{v.emoji}</div>
                <h3 className="font-bold text-slate-800 mb-3">{v.rol}</h3>
                <ul className="space-y-2">
                  {v.punten.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
                      <span className="text-blue-500 shrink-0 mt-0.5">·</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Legal note ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-10 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            ⚠️ Noor is een AI-assistent en geeft geen medisch of diagnostisch advies.
            Ze ondersteunt leerkrachten en vervangt geen professionele beoordeling door een arts,
            psycholoog of orthopedagoog. Bij twijfel: altijd de IB-er, schoolarts of
            Centrum voor Jeugd en Gezin raadplegen.
          </p>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-blue-50 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Klaar om te starten?</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Stel je vraag — Noor is er meteen. Geen account, geen wachttijd, geen gedoe.
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Gesprek starten met Noor
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white">
        LesCoach · Kenniskaarten via{" "}
        <a href="https://kennisgroepspeciaal.nl" className="underline hover:text-slate-600" target="_blank" rel="noopener noreferrer">
          Kennisgroep Speciaal
        </a>
        {" "}·{" "}
        <Link href="/beheer" className="hover:text-slate-600">Beheer</Link>
      </footer>
    </main>
  );
}
