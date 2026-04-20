import Link from "next/link";
import { JeroenAvatar } from "@/components/JeroenAvatar";

export default function Home() {
  return (
    <main className="flex flex-col min-h-[100dvh] bg-white">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <JeroenAvatar size={32} />
            <div>
              <span className="text-slate-800 font-semibold text-sm">LesCoach</span>
              <span className="text-slate-400 text-xs block leading-tight">door Jeroen Hendricks</span>
            </div>
          </div>
          <Link
            href="/chat"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Gesprek starten →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-2xl mx-auto text-center">

          {/* Avatar + intro */}
          <div className="flex flex-col items-center mb-8">
            <JeroenAvatar size={80} className="mb-4 drop-shadow-md" />
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Hoi, ik ben Jeroen — specialist speciaal onderwijs
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Snel de juiste{" "}
            <span className="text-blue-600">ondersteuning</span>{" "}
            voor jouw leerling
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-xl mx-auto">
            Beschrijf wat je ziet in de klas. Ik stel je een paar gerichte vragen en
            koppel je aan de juiste kenniskaart én een passende expert.
          </p>

          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-colors shadow-md shadow-blue-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Vraag Jeroen om hulp
          </Link>

          <p className="mt-4 text-sm text-slate-400">
            Geen login nodig · Volledig anoniem · Gratis te gebruiken
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 text-center mb-10">Hoe werkt het?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: "Vertel wat je ziet",
                desc: "Beschrijf het gedrag of de situatie van de leerling. Jeroen stelt gerichte vervolgvragen.",
              },
              {
                step: "2",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: "Ontvang kenniskaarten",
                desc: "Praktische informatie over de uitdaging, wat het betekent in de klas en concrete tips.",
              },
              {
                step: "3",
                icon: (
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: "Schakel een expert in",
                desc: "Wil je persoonlijk advies? Jeroen koppelt je aan een passende specialist die jouw rapport ontvangt.",
              },
            ].map((f) => (
              <div key={f.step} className="relative bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="absolute -top-3 -left-3 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                  {f.step}
                </div>
                <div className="mb-3">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Jeroen knows */}
      <section className="px-6 py-16 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <JeroenAvatar size={88} className="shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4">Wie is Jeroen?</h2>
              <p className="text-blue-100 leading-relaxed mb-4">
                Jeroen is een AI-assistent getraind als specialist in het speciaal onderwijs.
                Hij helpt leerkrachten in Nederland snel de juiste ondersteuning te vinden —
                van ADHD en autisme tot dyslexie, angst, motorische problemen en meer.
              </p>
              <p className="text-blue-100 leading-relaxed mb-6">
                Na het gesprek krijg je concrete kenniskaarten met tips voor in de klas en
                een koppeling aan een echte expert die je persoonlijk verder kan helpen.
              </p>
              <div className="flex flex-wrap gap-2">
                {["ADHD", "Autisme", "Dyslexie", "Angststoornissen", "Motorische problemen", "Gedragsproblemen", "Concentratie", "Sociaal-emotioneel"].map((tag) => (
                  <span key={tag} className="bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Legal note */}
      <section className="px-6 py-10 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            ⚠️ Jeroen is een AI-assistent en geeft geen medisch of diagnostisch advies.
            Hij ondersteunt leerkrachten en vervangt geen professionele beoordeling door een arts,
            psycholoog of orthopedagoog. Bij twijfel: raadpleeg altijd de IB-er, schoolarts of
            het Centrum voor Jeugd en Gezin.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-14 bg-white text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Klaar om te starten?</h2>
          <p className="text-slate-500 mb-8">Stel je vraag — Jeroen staat voor je klaar.</p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-7 py-3.5 rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Gesprek starten met Jeroen
          </Link>
        </div>
      </section>

      {/* Footer */}
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
