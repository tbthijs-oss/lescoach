"use client";

import { useState } from "react";
import { NoorAvatar } from "@/components/JeroenAvatar";

/* ─────────────────────────────────────────────────────────────────────────────
   /ssoe: strategisch partnerschapsvoorstel voor SSOE
   Publieke, conversiegerichte landingspagina. Geen auth (niet in middleware
   matcher). Persoonlijk gericht op de directie van SSOE.
   ──────────────────────────────────────────────────────────────────────────── */

const NAVY = "#16243f";
const BLUE = "#1e40af";
const AMBER = "#f59e0b";

function Check() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function Cross() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const WAAROM = [
  {
    titel: "AI wordt al gebruikt, zonder kader",
    tekst:
      "Op veel scholen gebruiken leerkrachten vandaag al gratis AI-tools, ook met leerlinggegevens. LesCoach is het AVG-veilige alternatief: geen leerlingnamen opgeslagen, verwerkersovereenkomst beschikbaar.",
  },
  {
    titel: "Normenkader IBP: 2027 nadert",
    tekst:
      "Schoolbesturen moeten per 1 januari 2027 hun positie kennen ten opzichte van het Normenkader IBP. Gecontroleerd AI-gebruik is daar onderdeel van. LesCoach helpt die positie aantoonbaar te versterken.",
  },
  {
    titel: "Werkdruk en kennisbehoud",
    tekst:
      "Snellere antwoorden in de klas, minder beroep op begeleiders voor losse vragen, en de expertise van uw specialisten geborgd, ook als mensen vertrekken.",
  },
];

const STAPPEN = [
  "Leerkracht beschrijft de situatie in eigen woorden, geen formulieren.",
  "Noor stelt 2 tot 4 gerichte vragen om de context scherp te krijgen.",
  "Noor geeft een onderbouwde kenniskaart: wat is het, gevolgen, wat kun je doen.",
  "Noor koppelt de leerkracht aan de juiste expert binnen SSOE, met het hele verslag erbij.",
];

const VERVANGT: [string, "nu" | "roadmap", string][] = [
  ["Snel, onderbouwd advies over gedrag of leerprobleem", "nu", "Algemeen, niet voor het SO, geen bron"],
  ["Koppeling aan de juiste expert binnen SSOE", "nu", "Niet mogelijk"],
  ["Geen leerlinggegevens opgeslagen", "nu", "Onbekend waar data heen gaat"],
  ["Verwerkersovereenkomst beschikbaar", "nu", "Niet aanwezig"],
  ["Werkbladen en teksten op leesniveau", "roadmap", "Ja, maar zonder kader of doelgroep"],
  ["Conceptbrieven aan ouders", "roadmap", "Ja, maar in willekeurige tools"],
  ["Sociale verhalen op maat", "roadmap", "Ja, tijdrovend en ongestructureerd"],
  ["Inzicht voor de schoolleiding", "roadmap", "Niet mogelijk"],
]

const TOEKOMST = [
  ["Lesvoorbereiding en differentiatie", "Werkbladen, teksten op leesniveau, toetsvragen, passend bij de doelgroep en gekoppeld aan de kenniskaarten."],
  ["Oudercommunicatie", "Conceptbrieven en mails in heldere taal, ook meertalig, in de toon van de school."],
  ["Sociale verhalen en visuele steun", "Sociale verhalen op maat van de situatie van de leerling, een veelgevraagde en tijdrovende taak in het SO."],
  ["Verslaglegging en handelingsplannen", "Van het gesprek met Noor naar een concepttekst voor het handelingsplan of OPP, zonder leerlinggegevens in externe tools."],
  ["Inzicht voor de schoolleiding", "Anonieme analyse van thema's die per school spelen, als input voor studiedagen, professionalisering en beleid."],
];

const PARTNERSCHAP = [
  ["Kennisborging", "Sessies met uw specialisten vertalen we naar kenniskaarten op maat. De kennis van SSOE blijft behouden en wordt schaalbaar, ook bij vertrek van medewerkers."],
  ["AFAS-koppeling", "Automatische leerkrachtaccounts en eenmalig inloggen via AFAS-connectoren, zodat toegang meebeweegt met uw HR. Geen dubbel beheer."],
  ["Normenkader IBP", "Privacy by design en documentatie die meetelt in uw IBP-groeipad richting 2027 en 2030."],
  ["HKZ en KSO", "Audit-trail, meldcodesignalering en rapportages die passen binnen de kwaliteitscyclus van HKZ en de Kwaliteitsnorm Speciaal Onderwijs."],
  ["Regionaal expertiseplatform", "LesCoach onder gezamenlijke naam aanbieden aan de scholen die het Autisme Steunpunt begeleidt, met een omzetdeling voor SSOE."],
];

const TIERS = [
  {
    naam: "Stichtingslicentie",
    prijs: "€ 16.500",
    per: "per jaar",
    regels: ["Noor voor alle scholen", "Onbeperkt aantal leerkrachten", "Support en doorontwikkeling"],
    advies: false,
  },
  {
    naam: "Strategisch partnerschap",
    prijs: "€ 29.500",
    per: "per jaar",
    regels: [
      "Alles uit de stichtingslicentie",
      "Kennisborgingsprogramma",
      "AFAS-koppeling en IBP-documentatie",
      "Vaste stuurgroep en kwartaalreviews",
      "Prioriteit op de roadmap",
    ],
    advies: true,
  },
  {
    naam: "Regionaal expertiseplatform",
    prijs: "vanaf € 60.000",
    per: "per jaar",
    regels: ["Alles uit het partnerschap", "Co-branded uitrol via het Autisme Steunpunt", "Omzetdeling voor SSOE"],
    advies: false,
  },
];

const FAQ = [
  [
    "En als LesCoach als klein bedrijf wegvalt?",
    "Begrijpelijke vraag bij een meerjarig partnerschap. We leggen continuiteit vast: een afspraak over toegang tot de broncode en uw data, zodat SSOE nooit afhankelijk is van een enkele persoon. Dit bespreken we open in de overeenkomst.",
  ],
  [
    "Is dit AVG-proof?",
    "Ja. Noor werkt altijd anoniem over de leerling, er worden geen leerlingnamen of dossiers opgeslagen, en er is een verwerkersovereenkomst beschikbaar. Het is juist het veilige alternatief voor het ongecontroleerde gebruik van gratis AI-tools dat nu al plaatsvindt.",
  ],
  [
    "Waarom een looptijd van drie jaar?",
    "Een partnerschap waarin we samen kennis borgen en koppelingen bouwen heeft tijd nodig om waarde te leveren. Daarom liggen de prijzen voor SSOE als founding partner drie jaar vast. Een eenjarige variant van het partnerschap is mogelijk voor € 35.500.",
  ],
  [
    "Vervangt dit onze eigen specialisten?",
    "Nee, het tegenovergestelde. Noor handelt de losse, herhalende vragen af en koppelt voor het echte werk door naar uw eigen experts, met het hele verslag erbij. Uw expertise wordt beter benut, niet vervangen.",
  ],
  [
    "Waarom geen losse tool maar een partnerschap?",
    "Een tool lost een vraag op, een partnerschap lost het probleem op. We bouwen mee aan wat SSOE als expertisecentrum nodig heeft: koppelingen, kennisborging, regionaal aanbod. U bepaalt in de stuurgroep wat eerst komt.",
  ],
  [
    "Wordt onze data gebruikt om het AI-model te trainen?",
    "Nee. Noor draait op de zakelijke API van Anthropic; gesprekken worden niet gebruikt om modellen te trainen. Noor werkt bovendien anoniem over de leerling, zonder namen of dossiers, dus er gaat geen herleidbare leerlinginformatie naar derden.",
  ],
  [
    "Waar staat onze data, en hoe zit het met EU-hosting?",
    "Omdat Noor geen leerlingnamen of dossiers opslaat, is het AVG-risico structureel laag, ongeacht de locatie. Data loopt nu via gevestigde verwerkers onder een verwerkersovereenkomst en EU-modelcontracten (SCC's). EU-datahosting staat als concrete stap op de roadmap van het partnerschap, passend bij uw IBP-groeipad.",
  ],
  [
    "Wat moeten wij als ICT doen om dit uit te rollen?",
    "Vrijwel niets om te starten: geen installatie, geen software op apparaten, geen koppeling met uw systemen nodig. Leerkrachten gebruiken Noor gewoon in de browser. Een AFAS-koppeling voor automatische accounts is optioneel en pakken we later in het partnerschap op, op uw tempo.",
  ],
  [
    "Wat als een leerkracht een onvolledig of verkeerd advies krijgt?",
    "Noor stelt nooit een diagnose en werkt binnen de kaders van de BIG-wet, AVG, Jeugdwet en de Meldcode. Ze geeft een onderbouwde richting en koppelt voor het echte werk door naar uw eigen expert. De professional houdt altijd de eindverantwoordelijkheid; Noor ondersteunt, beslist niet.",
  ],
  [
    "Waar komen de kenniskaarten vandaan?",
    "De kenniskaarten zijn gebaseerd op vakliteratuur en praktijk in het speciaal onderwijs, geschreven in begrijpelijke taal. In het partnerschap vullen we ze aan met de kennis van uw eigen specialisten, zodat de inhoud aansluit op uw doelgroepen.",
  ],
  [
    "Hoe weten we of leerkrachten het echt gaan gebruiken?",
    "Dat meet de pilot. Vooraf spreken we criteria af (gebruik, tevredenheid, tijdwinst) en bij het beslismoment in week 10 kijkt u naar de feiten, niet naar beloftes. Een korte onboarding houdt de drempel laag.",
  ],
  [
    "Wat gebeurt er als Noor een zorgsignaal oppikt?",
    "Herkent Noor een signaal dat past bij de Meldcode, dan markeert ze dat. Uw aandachtsfunctionaris ziet die signalen in een eigen overzicht en bepaalt zelf de vervolgstap. De meldcode-route blijft volledig bij u, met een betere registratie.",
  ],
  [
    "Van wie is de kennis die we samen opbouwen?",
    "De kennis en kenniskaarten die we met uw specialisten ontwikkelen, blijven van SSOE. Het partnerschap borgt die kennis en maakt haar schaalbaar; het neemt haar niet over.",
  ],
]

function Section({ id, children, alt }: { id?: string; children: React.ReactNode; alt?: boolean }) {
  return (
    <section id={id} className={`py-16 px-5 ${alt ? "bg-[#f8f5ed]" : ""}`}>
      <div className="max-w-5xl mx-auto">{children}</div>
    </section>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: NAVY }}>
      {children}
    </h2>
  );
}

export default function SsoePage() {
  const [leerkrachten, setLeerkrachten] = useState(100);
  const [minuten, setMinuten] = useState(20);
  const weken = 40;
  const urenPerJaar = Math.round((leerkrachten * minuten * weken) / 60);
  const indicatieEuro = (urenPerJaar * 50).toLocaleString("nl-NL");

  return (
    <main className="text-[#1e293b]" style={{ background: "#fefcf7" }}>
      <title>LesCoach voor SSOE: partnerschapsvoorstel</title>
      <meta name="robots" content="noindex, nofollow" />

      {/* Sticky CTA bar */}
      <div className="sticky top-0 z-50 backdrop-blur bg-[#16243f]/95 text-white">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <span className="font-semibold text-sm sm:text-base">LesCoach × SSOE</span>
          <div className="flex items-center gap-2">
            <a href="#pilot" className="hidden sm:inline text-sm text-white/80 hover:text-white">
              Pilot
            </a>
            <a href="#investering" className="hidden sm:inline text-sm text-white/80 hover:text-white">
              Investering
            </a>
            <a
              href="#contact"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#16243f]"
              style={{ background: AMBER }}
            >
              Plan een gesprek
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <header className="px-5 pt-14 pb-16" style={{ background: NAVY }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <NoorAvatar size={44} />
            <span className="text-white/70 text-sm">Vertrouwelijk voorstel · juni 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight max-w-3xl">
            Een AI-assistent voor uw leerkrachten, binnen de kaders van SSOE.
          </h1>
          <p className="text-white/80 mt-5 max-w-2xl text-lg">
            Noor geeft leerkrachten in het SO en VSO binnen vijf minuten een onderbouwd advies en
            koppelt ze daarna aan de juiste expert binnen uw eigen organisatie. Geen losse tool,
            maar het begin van een meerjarig partnerschap.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a
              href="#contact"
              className="rounded-full px-6 py-3 font-semibold text-[#16243f]"
              style={{ background: AMBER }}
            >
              Plan een kennismaking
            </a>
            <a
              href="#hoe"
              className="rounded-full px-6 py-3 font-semibold text-white border border-white/30 hover:bg-white/10"
            >
              Hoe het werkt
            </a>
            <a
              href="/ssoe-voorstel.pdf"
              className="rounded-full px-6 py-3 font-semibold text-white/80 hover:text-white underline underline-offset-4"
            >
              Download als PDF
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-10 max-w-2xl">
            {[
              ["5 min", "tot een advies"],
              ["100%", "AVG-veilig"],
              ["24/7", "beschikbaar"],
              ["SO / VSO", "speciaal hiervoor"],
            ].map(([a, b]) => (
              <div key={a} className="bg-white/5 rounded-xl px-3 py-4 text-center">
                <div className="text-xl font-bold" style={{ color: AMBER }}>
                  {a}
                </div>
                <div className="text-white/60 text-xs mt-1">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Persoonlijke intro */}
      <Section>
        <div className="rounded-2xl border border-[#e7e2d6] bg-white p-6 sm:p-8">
          <p className="text-lg leading-relaxed">
            Beste meneer De Vries, op 7 mei presenteerden wij LesCoach aan uw collega&apos;s Jeroen
            Hendriks en Mario van Och. Jeroen stelde voor het voorstel ook rechtstreeks aan u voor te
            leggen. Deze pagina vat samen wat we voor SSOE voor ogen hebben. Alles is bespreekbaar in
            een kennismaking.
          </p>
        </div>
      </Section>

      {/* Waarom nu */}
      <Section id="waarom" alt>
        <H2>Waarom dit nu relevant is</H2>
        <div className="grid sm:grid-cols-3 gap-5 mt-8">
          {WAAROM.map(({ titel, tekst }) => (
            <div key={titel} className="bg-white rounded-2xl border border-[#e7e2d6] p-6">
              <div className="w-9 h-1.5 rounded-full mb-4" style={{ background: AMBER }} />
              <h3 className="font-bold mb-2" style={{ color: NAVY }}>
                {titel}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">{tekst}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Hoe het werkt */}
      <Section id="hoe">
        <H2>Hoe het werkt</H2>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {STAPPEN.map((s, i) => (
            <div key={i} className="flex gap-4 items-start bg-white rounded-2xl border border-[#e7e2d6] p-5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                style={{ background: BLUE }}
              >
                {i + 1}
              </div>
              <p className="text-[#334155] leading-relaxed pt-1">{s}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#475569] bg-[#fef3e8] border border-[#f5d9b0] rounded-xl p-4">
          <strong>De expert blijft centraal.</strong> Noor handelt de losse vragen af en schakelt voor
          het echte werk door naar uw eigen specialisten, met het volledige gespreksverslag erbij. Uw
          expertise wordt beter benut, niet vervangen.
        </p>
      </Section>

      {/* Vergelijking met gratis AI */}
      <Section id="vergelijking" alt>
        <H2>Wat uw leerkrachten nu in gratis AI doen, veilig binnen SSOE</H2>
        <p className="text-[#475569] mt-2 max-w-2xl">
          Het gebruik is er al. De vraag is of het binnen of buiten uw kaders gebeurt. Wat Noor vandaag al
          doet ziet u hieronder; de items op de roadmap bouwen we samen in het partnerschap.
        </p>
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#e7e2d6] bg-white">
          <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[2fr_1fr_1fr] gap-px bg-[#e7e2d6] text-sm">
            <div className="bg-[#16243f] text-white font-semibold p-4">Taak</div>
            <div className="bg-[#16243f] text-white font-semibold p-4 text-center">LesCoach</div>
            <div className="bg-[#16243f] text-white font-semibold p-4 text-center hidden sm:block">
              Gratis AI-tool
            </div>
            {VERVANGT.map(([taak, status, losse], i) => (
              <Row key={i} taak={taak} status={status} losse={losse} />
            ))}
          </div>
        </div>
      </Section>

      {/* Indicatieve tijdwinst calculator */}
      <Section id="rekenhulp">
        <H2>Reken zelf met uw eigen aannames</H2>
        <p className="text-[#475569] mt-2 max-w-2xl">
          Geen belofte, maar een rekenhulp. Vul in wat u realistisch acht en zie wat het aan tijd kan
          schelen.
        </p>
        <div className="grid md:grid-cols-2 gap-6 mt-8 items-stretch">
          <div className="bg-white rounded-2xl border border-[#e7e2d6] p-6 space-y-7">
            <Slider
              label="Actieve leerkrachten"
              value={leerkrachten}
              min={5}
              max={300}
              step={5}
              suffix=""
              onChange={setLeerkrachten}
            />
            <Slider
              label="Tijdwinst per leerkracht per week"
              value={minuten}
              min={5}
              max={60}
              step={5}
              suffix=" min"
              onChange={setMinuten}
            />
            <p className="text-xs text-[#94a3b8]">
              Gerekend over circa {weken} schoolweken per jaar.
            </p>
          </div>
          <div className="rounded-2xl p-6 text-white flex flex-col justify-center" style={{ background: NAVY }}>
            <div className="text-white/70 text-sm">Indicatieve tijdwinst per jaar</div>
            <div className="text-4xl sm:text-5xl font-bold mt-1" style={{ color: AMBER }}>
              {urenPerJaar.toLocaleString("nl-NL")} uur
            </div>
            <div className="text-white/70 text-sm mt-5">Ter illustratie omgerekend (€ 50 per uur)</div>
            <div className="text-2xl font-semibold mt-1">€ {indicatieEuro}</div>
            <p className="text-white/50 text-xs mt-5 leading-relaxed">
              Indicatief, geen belofte. Bedoeld om met uw eigen aannames te rekenen. De werkelijke
              waarde zit in tijd voor de klas, gerichtere inzet van specialisten en het voorkomen van
              risico&apos;s.
            </p>
          </div>
        </div>
      </Section>

      {/* Toekomst */}
      <Section id="toekomst" alt>
        <H2>Verder kijken: wat Noor kan worden</H2>
        <p className="text-[#475569] mt-2 max-w-2xl">
          Alles wat leerkrachten nu in gratis tools doen, kan stap voor stap naar Noor. U bepaalt in de
          stuurgroep wat eerst komt.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {TOEKOMST.map(([t, d]) => (
            <div key={t} className="bg-white rounded-2xl border border-[#e7e2d6] p-5">
              <h3 className="font-bold mb-1" style={{ color: NAVY }}>
                {t}
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Partnerschap richtingen */}
      <Section id="partnerschap">
        <H2>Het partnerschap, concreet</H2>
        <div className="space-y-3 mt-8">
          {PARTNERSCHAP.map(([t, d]) => (
            <div key={t} className="flex gap-4 bg-white rounded-2xl border border-[#e7e2d6] p-5">
              <Check />
              <div>
                <h3 className="font-bold" style={{ color: NAVY }}>
                  {t}
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed mt-1">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pilot */}
      <Section id="pilot" alt>
        <H2>Beginnen met een pilot, met een helder beslismoment</H2>
        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            ["Fase 1 · maand 1 tot 3", "Pilot op één school met 5 tot 10 leerkrachten. Inrichting en training inbegrepen. Vooraf afgesproken criteria: gebruik, tevredenheid, tijdwinst."],
            ["Fase 2 · maand 2 en 3", "Kennisborging start: eerste sessies met uw specialisten, kenniskaarten op maat voor uw doelgroepen."],
            ["Fase 3 · week 10", "Beslismoment tegen de afgesproken criteria. Gaat u door, dan brengen wij de pilot volledig in mindering op de eerste jaarfactuur."],
          ].map(([t, d]) => (
            <div key={t} className="bg-white rounded-2xl border border-[#e7e2d6] p-5">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: BLUE }}>
                {t}
              </div>
              <p className="text-sm text-[#475569] leading-relaxed mt-2">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border-2 border-[#f5d9b0] bg-[#fef3e8] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg" style={{ color: NAVY }}>
              De pilot kost u per saldo niets
            </div>
            <p className="text-sm text-[#475569] mt-1">
              De pilot kost € 5.000. Besluit u door te gaan, dan trekken wij dat volledig af van de
              eerste jaarfactuur.
            </p>
          </div>
          <a href="#contact" className="rounded-full px-5 py-3 font-semibold text-[#16243f] flex-shrink-0" style={{ background: AMBER }}>
            Pilot bespreken
          </a>
        </div>
      </Section>

      {/* Investering */}
      <Section id="investering">
        <H2>Investering</H2>
        <p className="text-[#475569] mt-2 max-w-2xl">
          Eén licentie voor de hele stichting, ongeacht het aantal leerkrachten. Als founding partner
          liggen de prijzen voor SSOE drie jaar vast en bepaalt u de roadmap mee.
        </p>
        <div className="grid md:grid-cols-3 gap-5 mt-8 items-start">
          {TIERS.map((t) => (
            <div
              key={t.naam}
              className={`rounded-2xl p-6 border-2 ${
                t.advies ? "bg-white shadow-lg" : "bg-white"
              }`}
              style={{ borderColor: t.advies ? AMBER : "#e7e2d6" }}
            >
              {t.advies && (
                <div
                  className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3 text-[#16243f]"
                  style={{ background: AMBER }}
                >
                  ONS ADVIES
                </div>
              )}
              <h3 className="font-bold text-lg" style={{ color: NAVY }}>
                {t.naam}
              </h3>
              <div className="mt-2 mb-4">
                <span className="text-2xl font-bold" style={{ color: BLUE }}>
                  {t.prijs}
                </span>
                <span className="text-sm text-[#94a3b8]"> {t.per}</span>
              </div>
              <ul className="space-y-2">
                {t.regels.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-[#475569]">
                    <Check />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94a3b8] mt-4">
          Looptijd drie jaar met vaste prijs. Een eenjarige variant van het partnerschap is mogelijk
          voor € 35.500. Genoemde prijzen gelden voor de huidige functionaliteit; elke uitbreiding van
          de software wordt in de stuurgroep vastgelegd, met een bijbehorende aanpassing van het tarief.
        </p>
      </Section>

      {/* FAQ / objection handling */}
      <Section id="faq" alt>
        <H2>Veelgestelde vragen</H2>
        <div className="mt-8 space-y-3">
          {FAQ.map(([v, a]) => (
            <details key={v} className="group bg-white rounded-2xl border border-[#e7e2d6] p-5">
              <summary className="font-semibold cursor-pointer list-none flex justify-between items-center" style={{ color: NAVY }}>
                {v}
                <span className="text-[#94a3b8] group-open:rotate-45 transition-transform text-xl leading-none">
                  +
                </span>
              </summary>
              <p className="text-sm text-[#475569] leading-relaxed mt-3">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      {/* Contact / CTA */}
      <Section id="contact">
        <div className="rounded-3xl p-8 sm:p-12 text-center text-white" style={{ background: NAVY }}>
          <h2 className="text-2xl sm:text-3xl font-bold">Een gesprek van 30 minuten?</h2>
          <p className="text-white/80 mt-3 max-w-xl mx-auto">
            Met een besluit vóór de zomervakantie draait de pilot direct na de start van het nieuwe
            schooljaar. Ik laat u Noor dan graag live zien. Jeroen en Mario zijn van harte welkom om
            aan te sluiten.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <a
              href="mailto:thomas@lescoach.nl?subject=Kennismaking%20LesCoach%20en%20SSOE&body=Beste%20Thomas%2C%20we%20maken%20graag%20een%20afspraak.%20Een%20moment%20dat%20ons%20schikt%20is%3A%20"
              className="rounded-full px-6 py-3 font-semibold text-[#16243f]"
              style={{ background: AMBER }}
            >
              Plan een afspraak
            </a>
            <a
              href="mailto:thomas@lescoach.nl"
              className="rounded-full px-6 py-3 font-semibold border border-white/30 hover:bg-white/10"
            >
              thomas@lescoach.nl
            </a>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Thomas Thijs · Oprichter LesCoach · lescoach.nl
          </p>
        </div>
      </Section>

      <footer className="px-5 py-8 text-center text-xs text-[#94a3b8]">
        Vertrouwelijk voorstel voor SSOE · LesCoach · juni 2026
      </footer>
    </main>
  );
}

function Row({ taak, status, losse }: { taak: string; status: "nu" | "roadmap"; losse: string }) {
  return (
    <>
      <div className="bg-white p-4 text-[#334155]">{taak}</div>
      <div className="bg-white p-4 flex justify-center">
        {status === "nu" ? (
          <Check />
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#b45309] bg-[#fef3e8] rounded-full px-2 py-1 whitespace-nowrap">
            Op de roadmap
          </span>
        )}
      </div>
      <div className="bg-white p-4 text-xs text-[#94a3b8] hidden sm:flex items-center gap-2">
        <Cross />
        <span>{losse}</span>
      </div>
    </>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-medium text-[#334155]">{label}</label>
        <span className="font-bold text-lg" style={{ color: BLUE }}>
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#1e40af]"
      />
    </div>
  );
}
