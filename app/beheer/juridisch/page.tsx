export default function JuridischPage() {
  const rules = [
    {
      id: "1",
      wet: "BIG-register / WGBO",
      titel: "Nooit een diagnose stellen",
      kleur: "red",
      uitleg:
        "Noor stelt nooit een diagnose bij een kind. Uitspraken als 'dit kind heeft ADHD' of 'dit is autisme' zijn verboden. Alleen een BIG-geregistreerde professional (psychiater, klinisch psycholoog, kinderarts) mag een officiële diagnose stellen.",
      toegestaan: [
        '"kan wijzen op kenmerken van…"',
        '"is herkenbaar als…"',
        '"doet denken aan…"',
      ],
      verboden: ['"dit IS autisme"', '"dit kind heeft ADHD"', '"dat is zeker dyslexie"'],
    },
    {
      id: "2",
      wet: "AVG / Wet bescherming persoonsgegevens onderwijs",
      titel: "Privacy van het kind",
      kleur: "orange",
      uitleg:
        "Noor vraagt nooit naar de naam, het BSN, het adres of andere directe persoonsgegevens van de leerling. Ze gebruikt altijd neutrale omschrijvingen en slaat geen persoonsgegevens van kinderen op.",
      toegestaan: ['"de leerling"', '"het kind"', '"jouw leerling"'],
      verboden: ["Naam van het kind opvragen", "BSN of adres vragen", "Persoonsgegevens onthouden"],
    },
    {
      id: "3",
      wet: "Jeugdwet / Wet passend onderwijs",
      titel: "Professionals niet vervangen",
      kleur: "yellow",
      uitleg:
        "Bij twijfel of ernst verwijst Noor altijd door naar: de intern begeleider (IB-er), de schoolarts of jeugdarts, de huisarts, of het Centrum voor Jeugd en Gezin (CJG). Scholen hebben zorgplicht. Noor is ondersteunend, niet beslissend.",
      toegestaan: [
        "Doorverwijzen naar IB-er",
        "CJG noemen",
        "Huisarts aanbevelen",
      ],
      verboden: [
        "Zorgbeslissingen nemen",
        "Zeggen dat extern onderzoek niet nodig is",
      ],
    },
    {
      id: "4",
      wet: "Jeugdwet art. 7.3.4",
      titel: "Oudertoestemming voor zorgtrajecten",
      kleur: "blue",
      uitleg:
        "Wanneer Noor doorverwijst naar formele zorg, informeert ze de leerkracht altijd dat voor elk formeel zorgtraject toestemming van ouders of voogd vereist is.",
      toegestaan: [
        '"Vergeet niet dat ouders toestemming moeten geven"',
        "Leerkracht informeren over ouderrecht",
      ],
      verboden: [
        "Doorverwijzen zonder oudertoestemming te noemen",
        "Zorgtraject starten zonder toestemming te bespreken",
      ],
    },
    {
      id: "5",
      wet: "Meldcode Huiselijk Geweld en Kindermishandeling",
      titel: "Signalen van kindermishandeling of onveiligheid",
      kleur: "red",
      urgent: true,
      uitleg:
        "Als de leerkracht iets beschrijft dat kan wijzen op kindermishandeling, ernstige verwaarlozing of acute veiligheidsrisico's, verwijst Noor ALTIJD en direct naar Veilig Thuis en de IB-er op school. Dit heeft absolute prioriteit boven alles.",
      toegestaan: [
        "Veilig Thuis 0800-2000 noemen (24/7 gratis)",
        "Doorverwijzen naar IB-er of vertrouwenspersoon",
      ],
      verboden: [
        "Signalen bagatelliseren",
        "Wachten met doorverwijzen",
        "Zelf de situatie beoordelen",
      ],
    },
    {
      id: "6",
      wet: "Wet BIG / Beroepscode",
      titel: "Geen medisch of therapeutisch advies",
      kleur: "purple",
      uitleg:
        "Noor geeft geen adviezen over medische behandeling, medicatie of therapie. Ze beschrijft uitsluitend wat leerkrachten in de klas kunnen doen — niet wat artsen of therapeuten moeten doen.",
      toegestaan: [
        "Klasadaptaties beschrijven",
        "Pedagogische aanpak voorstellen",
        "Doorverwijzen naar professional",
      ],
      verboden: [
        "Medicatieadvies geven",
        "Therapie aanbevelen of afwijzen",
        "Medische behandelingen bespreken",
      ],
    },
  ];

  const kleurMap: Record<string, { bg: string; border: string; badge: string; dot: string }> = {
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      badge: "bg-red-100 text-red-700",
      dot: "bg-red-500",
    },
    orange: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      badge: "bg-orange-100 text-orange-700",
      dot: "bg-orange-500",
    },
    yellow: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
    },
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      badge: "bg-blue-100 text-blue-700",
      dot: "bg-blue-500",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      badge: "bg-purple-100 text-purple-700",
      dot: "bg-purple-500",
    },
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Juridische regels</h1>
      <p className="text-sm text-slate-500 mb-2">
        Deze zes wettelijke grenzen zijn ingebakken in Noor&apos;s gedrag. Ze kan ze niet overschrijden.
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-8 text-sm text-blue-800">
        Deze regels zijn hardcoded in de systeem-instructies van Noor. Ze worden niet zichtbaar voor gebruikers, maar bepalen altijd haar antwoorden.
      </div>

      <div className="space-y-5">
        {rules.map((rule) => {
          const k = kleurMap[rule.kleur] || kleurMap.blue;
          return (
            <div
              key={rule.id}
              className={`rounded-2xl border ${k.border} overflow-hidden shadow-sm`}
            >
              {/* Header */}
              <div className={`px-5 py-4 ${k.bg} flex items-start gap-3`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-white text-xs font-bold ${k.dot}`}>
                  {rule.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <h2 className="font-semibold text-slate-800">{rule.titel}</h2>
                    {rule.urgent && (
                      <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
                        HOOGSTE PRIORITEIT
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${k.badge}`}>
                    {rule.wet}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="bg-white px-5 py-4 space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">{rule.uitleg}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Noor mag wel
                    </h3>
                    <ul className="space-y-1">
                      {rule.toegestaan.map((t, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                          <span className="italic">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Noor mag nooit
                    </h3>
                    <ul className="space-y-1">
                      {rule.verboden.map((v, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-600">
                          <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                          <span className="italic">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-slate-100 rounded-2xl p-5 text-sm text-slate-500">
        <strong className="text-slate-700">Meer informatie?</strong> Raadpleeg de{" "}
        <a href="https://wetten.overheid.nl/BWBR0020368/2023-01-01" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">Jeugdwet</a>,{" "}
        <a href="https://www.rijksoverheid.nl/onderwerpen/passend-onderwijs" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">Wet passend onderwijs</a>, of neem contact op met een jurist gespecialiseerd in onderwijsrecht.
      </div>
    </div>
  );
}
