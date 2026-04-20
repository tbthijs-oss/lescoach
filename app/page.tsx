import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-slate-800 font-semibold text-lg">LesCoach</span>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Speciaal voor het speciaal onderwijs
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight mb-6">
            Snel de juiste{" "}
            <span className="text-blue-600">ondersteuning</span>{" "}
            voor jouw leerling
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-xl mx-auto">
            Beschrijf de situatie in de klas. LesCoach stelt je een paar gerichte vragen
            en koppelt je aan de juiste kenniskaart of expert.
          </p>

          {/* CTA */}
          <Link
            href="/chat"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg px-8 py-4 rounded-2xl transition-colors shadow-sm shadow-blue-200"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Start gesprek met LesCoach
          </Link>

          <p className="mt-4 text-sm text-slate-400">Geen login nodig · Volledig anoniem</p>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
          {[
            {
              icon: "💬",
              title: "Stel je vraag",
              desc: "Vertel over de leerling. LesCoach vraagt door om de situatie goed te begrijpen."
            },
            {
              icon: "📋",
              title: "Ontvang kenniskaart",
              desc: "Praktische informatie over de aandoening en tips voor begeleiding in de klas."
            },
            {
              icon: "👤",
              title: "Vind de juiste expert",
              desc: "Koppeling aan een specialist die passende begeleiding of advies kan bieden."
            }
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-slate-400 border-t border-slate-100 bg-white">
        LesCoach · Kenniskaarten via{" "}
        <a href="https://kennisgroepspeciaal.nl" className="underline hover:text-slate-600" target="_blank" rel="noopener noreferrer">
          Kennisgroep Speciaal
        </a>
      </footer>
    </main>
  );
}
