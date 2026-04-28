"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Kenniskaart {
  id: string;
  titel: string;
  categorie: string;
  samenvatting: string;
  watIsHet: string;
  gevolgen: string;
  tips: string;
  trefwoorden: string[];
  pdfUrl: string;
  bronUrl: string;
}

export interface Expert {
  id: string;
  naam: string;
  titel: string;
  bio: string;
  specialisaties: string[];
  email: string;
  telefoon: string;
  linkedin: string;
  fotoUrl: string;
  beschikbaar: boolean;
  ervaringsjaren: number;
  regio: string;
  taal: string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ContactForm {
  naam: string;
  school: string;
  email: string;
  telefoon: string;
  opmerkingen: string;
}

export interface NoorAnalysis {
  profileLine: string;
  primaryKaartTitel: string;
  alternativeKaartTitels: string[];
  insight: string;
  acties: string[];
  overleg: string;
  signaal: string;
  contextChips: string[];
}

// ─── KenniskaartCard ──────────────────────────────────────────────────────────

function KenniskaartCard({
  kaart,
  isPrimary,
  defaultOpen,
}: {
  kaart: Kenniskaart;
  isPrimary?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm border ${
        isPrimary ? "border-blue-300 ring-1 ring-blue-200 bg-white" : "border-blue-100 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full text-left px-4 py-3.5 ${
          isPrimary ? "bg-blue-100/70" : "bg-blue-50"
        } flex items-start justify-between gap-3 active:bg-blue-100/80 transition-colors`}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
              {kaart.categorie}
            </span>
            {isPrimary && (
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide bg-blue-200/70 px-2 py-0.5 rounded-full">
                Beste match
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 mt-0.5 break-words text-[15px] leading-snug">
            {kaart.titel}
          </h3>
        </div>
        <span
          className={`shrink-0 w-7 h-7 rounded-full bg-white/80 border border-blue-200 flex items-center justify-center text-blue-600 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div className="px-4 py-3">
        <p className="text-sm text-slate-600 leading-relaxed">{kaart.samenvatting}</p>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-4">
          {kaart.watIsHet && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Wat is het?</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.watIsHet}</p>
            </div>
          )}
          {kaart.gevolgen && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Gevolgen in de klas</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.gevolgen}</p>
            </div>
          )}
          {kaart.tips && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Tips voor de leerkracht</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.tips}</p>
            </div>
          )}
          {kaart.trefwoorden.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kaart.trefwoorden.map((t) => (
                <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-slate-100 flex flex-wrap gap-x-4 gap-y-1.5">
        {kaart.pdfUrl && (
          <a href={kaart.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 min-h-[28px]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        )}
        {kaart.bronUrl && (
          <a href={kaart.bronUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:underline flex items-center gap-1 min-h-[28px]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Meer informatie
          </a>
        )}
      </div>
    </div>
  );
}

// ─── ExpertCard ───────────────────────────────────────────────────────────────

function ExpertCard({ expert, onContact }: { expert: Expert; onContact: (e: Expert) => void }) {
  const initials = expert.naam
    .split(" ")
    .filter((w) => w.match(/^[A-Z]/))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-start gap-4">
        {expert.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={expert.fotoUrl} alt={expert.naam}
            className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-white/30" />
        ) : (
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-lg">
            {initials || expert.naam[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base leading-snug">{expert.naam}</div>
          <div className="text-blue-200 text-xs mt-0.5">{expert.titel}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-blue-200 text-[11px]">
            {expert.ervaringsjaren > 0 && <span>{expert.ervaringsjaren} jaar ervaring</span>}
            {expert.regio && <span>📍 {expert.regio}</span>}
          </div>
          <p className="text-blue-100 text-xs mt-2 leading-relaxed line-clamp-3">{expert.bio}</p>
        </div>
      </div>
      <button
        onClick={() => onContact(expert)}
        className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 font-semibold text-sm py-3 rounded-xl transition-colors"
      >
        Vraag advies aan {expert.naam.split(" ")[0]} →
      </button>
    </div>
  );
}

// ─── ExpertModal ──────────────────────────────────────────────────────────────

export function ExpertModal({
  expert,
  messages,
  kenniskaarten,
  onClose,
  defaultValues,
}: {
  expert: Expert;
  messages: Message[];
  kenniskaarten: Kenniskaart[];
  onClose: () => void;
  defaultValues?: { naam?: string; school?: string; email?: string };
}) {
  const [form, setForm] = useState<ContactForm>({
    naam: defaultValues?.naam || "",
    school: defaultValues?.school || "",
    email: defaultValues?.email || "",
    telefoon: "",
    opmerkingen: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function update(field: keyof ContactForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact-expert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, kenniskaarten, contact: form, expert }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const initials = expert.naam.split(" ").filter((w) => w.match(/^[A-Z]/)).slice(0, 2).map((w) => w[0]).join("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92dvh] flex flex-col">

        {status === "sent" ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Aanvraag verstuurd!</h2>
            <p className="text-slate-500 text-sm mb-6">
              {expert.naam} ontvangt jouw aanvraag met het volledige gespreksverslag en de gevonden kenniskaarten. Je hoort zo snel mogelijk van ons.
            </p>
            <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              Sluiten
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold">Vraag advies aan een expert</h2>
                  <p className="text-blue-200 text-xs sm:text-sm mt-0.5">Het volledige rapport wordt automatisch meegestuurd</p>
                </div>
                <button onClick={onClose} aria-label="Sluiten" className="text-blue-200 hover:text-white p-2 -mr-2 rounded-lg shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-3 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                {expert.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={expert.fotoUrl} alt={expert.naam} className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                    {initials || expert.naam[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{expert.naam}</div>
                  <div className="text-xs text-blue-200 truncate">{expert.titel}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Naam <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.naam} onChange={(e) => update("naam", e.target.value)}
                    placeholder="Jouw naam"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    School <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.school} onChange={(e) => update("school", e.target.value)}
                    placeholder="Naam van de school"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                  placeholder="jouw@school.nl"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Telefoonnummer <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <input type="tel" value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)}
                  placeholder="06 12345678"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Aanvullende opmerkingen <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <textarea value={form.opmerkingen} onChange={(e) => update("opmerkingen", e.target.value)}
                  placeholder="Iets wat je wil meegeven…" rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  Er is iets misgegaan. Probeer opnieuw of neem direct contact op via {expert.email}.
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={status === "sending"}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                  {status === "sending" ? "Versturen…" : "Verstuur aanvraag →"}
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                  Annuleren
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">
                {expert.naam} ontvangt automatisch het gespreksverslag en de kenniskaarten.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ReportView (hoofdcomponent) ──────────────────────────────────────────────

/**
 * ReportView — toont kenniskaarten + experts + insight in één rapport.
 *
 * Twee varianten:
 *  - "panel": ingebed naast de chat op desktop. Compacte hero, geen sticky CTA.
 *  - "page" : eigen pagina (bv. /resultaten op mobiel). Compactere hero (er is
 *    al een page-header), grotere typografie, sticky bottom-CTA als experts er zijn.
 */
export function ReportView({
  analysis,
  kenniskaarten,
  primaryKaartId,
  alternativeKaartIds,
  experts,
  onContactExpert,
  onNewConversation,
  variant = "panel",
}: {
  analysis: NoorAnalysis | null;
  kenniskaarten: Kenniskaart[];
  primaryKaartId: string | null;
  alternativeKaartIds: string[];
  experts: Expert[];
  onContactExpert: (e: Expert) => void;
  onNewConversation: () => void;
  variant?: "panel" | "page";
}) {
  const primary = kenniskaarten.find((k) => k.id === primaryKaartId) ?? kenniskaarten[0];
  // Top-3: als Noor alternatieve kaart-ids heeft meegegeven (= twijfel over welke
  // primair is), behandelen we die als aanvullende top-hits en tonen we ze direct
  // naast de primaire kaart in plaats van ingeklapt bij de overige kaarten.
  const topAlternatives: Kenniskaart[] = [];
  for (const id of alternativeKaartIds) {
    const k = kenniskaarten.find((x) => x.id === id);
    if (k && k.id !== primary?.id) topAlternatives.push(k);
  }
  const topIds = new Set<string>([primary?.id, ...topAlternatives.map((k) => k.id)].filter(Boolean) as string[]);
  const overige = kenniskaarten.filter((k) => !topIds.has(k.id));

  // Build share text for WhatsApp / email — compact summary for IB'er
  const shareText = [
    analysis?.profileLine,
    primary?.titel ? `\nKenniskaart: ${primary.titel}` : "",
    analysis?.insight ? `\n${analysis.insight}` : "",
    analysis?.acties?.length
      ? "\n\nMorgen in de klas:\n" + analysis.acties.map((a, i) => `${i + 1}. ${a}`).join("\n")
      : "",
    "\n\nVia LesCoach (lescoach.nl) — Noor, specialist speciaal onderwijs.",
  ].join("");

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(
    "LesCoach-rapport: " + (primary?.titel ?? "leerling")
  )}&body=${encodeURIComponent(shareText)}`;

  const isPage = variant === "page";

  return (
    <div className="print:bg-white">
      {/* Hero — success state. Compacter op /resultaten omdat de page zelf al een header heeft. */}
      <div className={`text-center px-5 print:pt-0 ${isPage ? "pt-5 pb-4" : "pt-8 pb-5"}`}>
        {!isPage && (
          <div className="inline-flex w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 items-center justify-center mb-4 shadow-sm print:shadow-none">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {isPage ? (
          <div className="inline-flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Analyse klaar
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">Analyse klaar</h1>
        )}
        {analysis?.profileLine && (
          <p className={`text-slate-700 leading-relaxed max-w-md mx-auto ${isPage ? "text-base font-medium" : "text-sm text-slate-600"}`}>
            {analysis.profileLine}
          </p>
        )}

        {/* Context chips — what Noor picked up from the intake */}
        {analysis?.contextChips && analysis.contextChips.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
            {analysis.contextChips.map((chip, i) => (
              <span
                key={i}
                className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={`px-4 sm:px-5 space-y-5 max-w-2xl mx-auto ${isPage && experts.length > 0 ? "pb-32" : "pb-8"}`}>

        {/* Primary insight card */}
        {primary && (
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 mb-2">
              Beeld dat hierbij past
            </div>
            <div className="flex items-start gap-3 mb-3">
              <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2.4 5.4L18 8.4l-4 3.9.9 5.7L10 15.4 5.1 18l.9-5.7-4-3.9 5.6-1L10 2z" />
              </svg>
              <div className="min-w-0">
                <h2 className={`font-bold text-slate-900 leading-tight ${isPage ? "text-xl" : "text-lg"}`}>
                  {primary.titel}
                </h2>
                {primary.categorie && (
                  <div className="text-xs text-slate-500 mt-0.5">{primary.categorie}</div>
                )}
              </div>
            </div>
            {analysis?.insight && (
              <p className={`text-slate-700 leading-relaxed ${isPage ? "text-[15px]" : "text-sm"}`}>
                {analysis.insight}
              </p>
            )}

            {/* Primary-kaart trefwoorden as pills — quick scan of adjacent themes */}
            {primary.trefwoorden && primary.trefwoorden.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {primary.trefwoorden.slice(0, 6).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium text-blue-700 bg-white/70 border border-blue-200 px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 text-xs text-slate-500 italic">
              Dit wordt in een gesprek met een expert verder verkend — Noor stelt geen diagnose.
            </div>
          </div>
        )}

        {/* Signaal — meldcode warning (only if present) */}
        {analysis?.signaal && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" />
              </svg>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-800 mb-1">
                  Signaal om met de aandachtsfunctionaris te bespreken
                </div>
                <p className="text-sm text-amber-900 leading-relaxed">{analysis.signaal}</p>
                <p className="text-xs text-amber-800 mt-2">
                  Bij acute zorg: Veilig Thuis — 0800-2000.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Morgen in de klas — three concrete actions */}
        {analysis?.acties && analysis.acties.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-1">
              Morgen in de klas
            </h3>
            <div className="space-y-2">
              {analysis.acties.slice(0, 3).map((actie, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3.5"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className={`text-slate-700 leading-relaxed ${isPage ? "text-[15px]" : "text-sm"}`}>{actie}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overleg — when present */}
        {analysis?.overleg && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Overleg intern
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{analysis.overleg}</p>
          </div>
        )}

        {/* Expert CTA — prominent */}
        {experts.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-1 print:hidden">
              {experts.length === 1 ? "Passende expert" : "Passende experts"}
            </h3>
            <div className="space-y-3 print:hidden">
              {experts.map((expert) => (
                <ExpertCard
                  key={expert.id}
                  expert={expert}
                  onContact={onContactExpert}
                />
              ))}
            </div>
          </div>
        )}

        {/* All kenniskaarten — primary first, top alternatives styled as co-primary, rest collapsed */}
        {kenniskaarten.length > 0 && (
          <div className="pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-1">
              {topAlternatives.length > 0
                ? `Top ${1 + topAlternatives.length} kenniskaarten (van ${kenniskaarten.length})`
                : `Alle kenniskaarten (${kenniskaarten.length})`}
            </h3>
            {topAlternatives.length > 0 && (
              <p className="text-xs text-slate-500 mb-3 px-1">
                Noor twijfelt tussen deze kaarten — ze passen allemaal bij het beeld. Lees ze naast elkaar om te kiezen wat voor jouw leerling het sterkst resoneert.
              </p>
            )}
            <div className="space-y-3">
              {primary && (
                <KenniskaartCard kaart={primary} isPrimary defaultOpen={false} />
              )}
              {topAlternatives.map((k) => (
                <KenniskaartCard key={k.id} kaart={k} isPrimary defaultOpen={false} />
              ))}
              {overige.map((k) => (
                <KenniskaartCard key={k.id} kaart={k} />
              ))}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 flex flex-wrap gap-2 print:hidden">
          {analysis && (
            <>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Stuur naar IB&apos;er
              </a>
              <a
                href={mailtoUrl}
                className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Mailen
              </a>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print of PDF
          </button>
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nieuw gesprek
          </button>
        </div>

        {/* Disclaimer — always visible, niet alleen bij printen */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] leading-relaxed text-slate-500">
          <div className="flex gap-2 items-start">
            <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <strong className="text-slate-600">Noor ondersteunt jou als leerkracht; ze stelt geen diagnose en vervangt geen zorgprofessional.</strong>
              {" "}Bij zorg over een leerling: bespreek met IB&rsquo;er, zorgteam of jeugdarts. Bij vermoeden van onveiligheid: Veilig Thuis 0800-2000.
            </div>
          </div>
        </div>

        {/* Print-only extra footer */}
        <div className="hidden print:block pt-4 text-[10px] text-slate-500 mt-4">
          Rapport gegenereerd door LesCoach / Noor. Geen medische diagnose.
          Voor vragen over een leerling: bespreek met IB&rsquo;er, zorgteam, of neem contact op met een aangesloten expert via lescoach.nl.
        </div>
      </div>
    </div>
  );
}

// ─── StickyExpertCTA — sticky bottom-bar voor mobiel-first /resultaten pagina ──

/**
 * Sticky onderbalk met de primaire expert-CTA.
 * Toon alleen op de eigen `/resultaten` pagina (variant="page") en
 * verberg automatisch wanneer de gebruiker bijna onderaan is — dan staat
 * de volledige expert-kaart al in beeld.
 */
export function StickyExpertCTA({
  expert,
  onContact,
}: {
  expert: Expert;
  onContact: (e: Expert) => void;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    function onScroll() {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      // Verberg in de laatste 200px — de kaart zelf is dan al zichtbaar.
      setHidden(total > 0 && total - y < 200);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hidden) return null;

  const initials = expert.naam
    .split(" ")
    .filter((w) => w.match(/^[A-Z]/))
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden print:hidden pointer-events-none">
      <div className="px-3 pb-[calc(env(safe-area-inset-bottom,0.5rem)+0.5rem)] pt-3 bg-gradient-to-t from-white via-white/95 to-white/0 pointer-events-auto">
        <button
          onClick={() => onContact(expert)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99] text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg flex items-center gap-3 transition-all"
        >
          {expert.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={expert.fotoUrl} alt="" className="w-9 h-9 rounded-full object-cover border-2 border-white/30 shrink-0" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {initials || expert.naam[0]}
            </span>
          )}
          <span className="flex-1 text-left text-sm leading-tight">
            <span className="block text-[11px] text-blue-200 font-medium">Vraag advies aan</span>
            <span className="block">{expert.naam}</span>
          </span>
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}