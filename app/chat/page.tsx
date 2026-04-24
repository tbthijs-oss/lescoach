"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Kenniskaart {
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

interface Expert {
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

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ContactForm {
  naam: string;
  school: string;
  email: string;
  telefoon: string;
  opmerkingen: string;
}

interface NoorAnalysis {
  profileLine: string;
  primaryKaartTitel: string;
  alternativeKaartTitels: string[];
  insight: string;
  acties: string[];
  overleg: string;
  signaal: string;
  contextChips: string[];
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">N</span>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-5">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── Chip suggestions ─────────────────────────────────────────────────────────

// ─── Voice helpers ──────────────────────────────────────────────────────────

function SpeakerButton({ text }: { text: string }) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    if (audioRef.current) {
      await audioRef.current.play().catch(() => {});
      setPlaying(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/speak?text=${encodeURIComponent(text)}`);
      if (!res.ok) throw new Error("tts");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onpause = () => setPlaying(false);
      audio.onplay = () => setPlaying(true);
      await audio.play();
    } catch {
      // Silent fail — likely TTS not configured
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 rounded-lg hover:bg-blue-50"
      aria-label={playing ? "Stop voorlezen" : "Lees voor"}
      title={playing ? "Stop voorlezen" : "Lees voor"}
      type="button"
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
          <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      ) : playing ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 4V5L9 9z" />
        </svg>
      )}
    </button>
  );
}

// SpeechRecognition is not in standard TS lib types yet
/* eslint-disable @typescript-eslint/no-explicit-any */
interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

function MicButton({ onTranscript, disabled }: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) setSupported(false);
  }, []);

  function start() {
    if (disabled) return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "nl-NL";
    rec.interimResults = true;
    rec.continuous = false;
    let finalTranscript = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interim += r[0].transcript;
      }
      onTranscript((finalTranscript + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }

  function stop() {
    recRef.current?.stop();
    setListening(false);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={disabled}
      aria-label={listening ? "Stop dicteren" : "Dicteer je bericht"}
      title={listening ? "Stop dicteren" : "Spreek je bericht in"}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
        listening
          ? "bg-rose-100 text-rose-600 ring-2 ring-rose-300 animate-pulse"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      } disabled:opacity-50`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z" />
      </svg>
    </button>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function ChipRow({
  suggestions,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
  disabled: boolean;
}) {
  if (!suggestions.length) return null;
  // Deduplicate and drop empties so we never render a squashed row.
  const unique = Array.from(
    new Set(suggestions.map((s) => s.trim()).filter(Boolean))
  );
  if (!unique.length) return null;
  return (
    <div className="flex items-start gap-3 pl-11 mt-1">
      <div className="flex flex-wrap gap-x-2 gap-y-2 max-w-full">
        {unique.map((s) => (
          <button
            type="button"
            key={s}
            disabled={disabled}
            onClick={() => onSelect(s)}
            className="inline-flex items-center text-sm leading-tight bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 disabled:opacity-40 px-3.5 py-2 rounded-full transition-colors font-medium shadow-sm whitespace-nowrap"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Kenniskaart card (collapsible, primary marker) ───────────────────────────

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
      <div className={`px-4 py-3 ${isPrimary ? "bg-blue-100/70" : "bg-blue-50"} flex items-start justify-between gap-3`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
              {kaart.categorie}
            </span>
            {isPrimary && (
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide bg-blue-200/70 px-2 py-0.5 rounded-full">
                Beste match
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 mt-0.5 break-words">{kaart.titel}</h3>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {open ? "Minder" : "Meer"}
        </button>
      </div>

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

      <div className="px-4 py-2 border-t border-slate-100 flex gap-3">
        {kaart.pdfUrl && (
          <a href={kaart.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        )}
        {kaart.bronUrl && (
          <a href={kaart.bronUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:underline flex items-center gap-1">
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

// ─── Expert card ──────────────────────────────────────────────────────────────

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
            className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-white/30" />
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-lg">
            {initials || expert.naam[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base">{expert.naam}</div>
          <div className="text-blue-200 text-xs mt-0.5">{expert.titel}</div>
          {expert.ervaringsjaren > 0 && (
            <div className="text-blue-200 text-xs mt-0.5">{expert.ervaringsjaren} jaar ervaring</div>
          )}
          <p className="text-blue-100 text-xs mt-2 leading-relaxed line-clamp-3">{expert.bio}</p>
          {expert.regio && (
            <div className="text-blue-200 text-xs mt-1.5">📍 {expert.regio}</div>
          )}
        </div>
      </div>
      <button
        onClick={() => onContact(expert)}
        className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        Vraag advies aan {expert.naam.split(" ")[0]} →
      </button>
    </div>
  );
}

// ─── Expert contact modal ─────────────────────────────────────────────────────

function ExpertModal({
  expert,
  messages,
  kenniskaarten,
  onClose,
}: {
  expert: Expert;
  messages: Message[];
  kenniskaarten: Kenniskaart[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactForm>({ naam: "", school: "", email: "", telefoon: "", opmerkingen: "" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">

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
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Vraag advies aan een expert</h2>
                  <p className="text-blue-200 text-sm mt-0.5">Het volledige rapport wordt automatisch meegestuurd</p>
                </div>
                <button onClick={onClose} className="text-blue-200 hover:text-white p-1 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                {expert.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={expert.fotoUrl} alt={expert.naam} className="w-10 h-10 rounded-full object-cover border border-white/30 shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                    {initials || expert.naam[0]}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-white">{expert.naam}</div>
                  <div className="text-xs text-blue-200">{expert.titel}</div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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

// ─── Results panel (MyDosha-style) ────────────────────────────────────────────

function ResultsPanel({
  analysis,
  kenniskaarten,
  primaryKaartId,
  alternativeKaartIds,
  experts,
  onContactExpert,
  onNewConversation,
}: {
  analysis: NoorAnalysis | null;
  kenniskaarten: Kenniskaart[];
  primaryKaartId: string | null;
  alternativeKaartIds: string[];
  experts: Expert[];
  onContactExpert: (e: Expert) => void;
  onNewConversation: () => void;
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

  return (
    <div className="print:bg-white">
      {/* Hero — success state */}
      <div className="text-center pt-8 pb-5 px-6 print:pt-0">
        <div className="inline-flex w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 items-center justify-center mb-4 shadow-sm print:shadow-none">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">Analyse klaar</h1>
        {analysis?.profileLine && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
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

      <div className="px-5 pb-8 space-y-5 max-w-2xl mx-auto">

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
                <h2 className="text-lg font-bold text-slate-900 leading-tight">{primary.titel}</h2>
                {primary.categorie && (
                  <div className="text-xs text-slate-500 mt-0.5">{primary.categorie}</div>
                )}
              </div>
            </div>
            {analysis?.insight && (
              <p className="text-sm text-slate-700 leading-relaxed">
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
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{actie}</p>
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
                className="flex items-center gap-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Stuur naar IB&apos;er
              </a>
              <a
                href={mailtoUrl}
                className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
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
            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print of PDF
          </button>
          <button
            onClick={onNewConversation}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nieuw gesprek
          </button>
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block pt-8 text-[10px] text-slate-500 border-t border-slate-200 mt-8">
          Rapport gegenereerd door LesCoach / Noor. Geen medische diagnose.
          Voor vragen over een leerling: bespreek met IB'er, zorgteam, of neem contact op met een aangesloten expert via lescoach.nl.
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [kenniskaarten, setKenniskaarten] = useState<Kenniskaart[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<NoorAnalysis | null>(null);
  const [primaryKaartId, setPrimaryKaartId] = useState<string | null>(null);
  const [alternativeKaartIds, setAlternativeKaartIds] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [piiWarning, setPiiWarning] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<"hidden" | "peek" | "full">("hidden");
  const [authedUser, setAuthedUser] = useState<{ naam: string; rol: "admin" | "leraar"; schoolnaam?: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; datum: string; primaryKaart: string; samenvatting: string; zoekterm: string; categorie: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.authenticated) return;
        setAuthedUser({
          naam: data.leraar?.naam || "",
          rol: data.leraar?.rol || "leraar",
          schoolnaam: data.school?.schoolnaam,
        });
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/chat/history");
      const data = await res.json();
      setHistory(Array.isArray(data.gesprekken) ? data.gesprekken : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadHistoryItem(id: string) {
    setHistoryOpen(false);
    try {
      const res = await fetch(`/api/chat/history/${id}`);
      if (!res.ok) return;
      const { gesprek } = await res.json();
      if (!gesprek || !Array.isArray(gesprek.berichten)) return;
      // Herstel de berichtenreeks op het scherm. We tonen de oude conversatie
      // read-only — nieuwe berichten starten een nieuwe sessie (dus leerkracht
      // moet via "Nieuw gesprek" doorvragen op deze leerling).
      setMessages(gesprek.berichten);
      setDone(true);
      setSuggestions([]);
      // Kenniskaarten worden niet in de historie bewaard — alleen titels.
      // We laten het rechterpaneel leeg; een heropgehaalde conversatie is
      // een historisch overzicht, niet een herstart.
      setKenniskaarten([]);
      setExperts([]);
      setAnalysis({
        profileLine: gesprek.samenvatting || "",
        primaryKaartTitel: gesprek.primaryKaart || "",
        alternativeKaartTitels: [],
        insight: "",
        acties: [],
        overleg: "",
        signaal: "",
        contextChips: [],
      });
    } catch {
      // silent
    }
  }
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions]);

  // Hardcoded opener — shown instantly, no API round-trip.
  // Noor's system prompt expects a prior user turn to open the intake; we prime
  // it here with a neutral sentence that is filtered out server-side if needed.
  const OPENING_MESSAGE =
    "Hoi, ik ben Noor. Vertel eens over de leerling waar je aan denkt — wat zie je in de klas?";

  useEffect(() => {
    if (!started) {
      setStarted(true);
      // Show Noor's opening instantly, without waiting for the API.
      setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
      setSuggestions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(text?: string) {
    const textToSend = (text ?? input).trim();
    if (!textToSend || loading) return;

    setSuggestions([]); // clear chips when sending
    setPiiWarning(false); // clear any prior warning when a new message is sent
    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Claude expects the first message to be a "user" turn. Our hardcoded
    // opener puts an assistant message first — strip it and replace with a
    // neutral seed so the API sees a valid conversation shape.
    const apiMessages: Message[] =
      newMessages[0]?.role === "assistant"
        ? [
            { role: "user", content: "Hallo, ik wil graag hulp voor een leerling." },
            { role: "assistant", content: newMessages[0].content },
            ...newMessages.slice(1),
          ]
        : newMessages;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();

      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
      setSuggestions(data.suggestions || []);

      if (data.piiFiltered) {
        setPiiWarning(true);
      }

      if (data.kenniskaarten?.length > 0) {
        setKenniskaarten(data.kenniskaarten);
        setDone(true);
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setMobileSheet("peek");
        }
      }
      if (data.experts?.length > 0) {
        setExperts(data.experts);
      }
      if (data.analysis) {
        setAnalysis(data.analysis as NoorAnalysis);
      }
      if (data.primaryKaartId) {
        setPrimaryKaartId(data.primaryKaartId as string);
      }
      if (Array.isArray(data.alternativeKaartIds)) {
        setAlternativeKaartIds(data.alternativeKaartIds as string[]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Sorry, er is iets misgegaan. Probeer het opnieuw." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetChat() {
    setMessages([]);
    setKenniskaarten([]);
    setExperts([]);
    setSuggestions([]);
    setInput("");
    setStarted(false);
    setDone(false);
    setSelectedExpert(null);
    setAnalysis(null);
    setPrimaryKaartId(null);
    setPiiWarning(false);
    // trigger fresh start — show hardcoded opener instantly
    setTimeout(() => {
      setStarted(true);
      setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
      setSuggestions([]);
    }, 50);
  }

  const displayExperts = experts.length > 0 ? experts : [];

  return (
    <div className="flex flex-col h-screen bg-[#fefcf7] print:bg-white print:h-auto">
      {/* Expert modal */}
      {selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          messages={messages}
          kenniskaarten={kenniskaarten}
          onClose={() => setSelectedExpert(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur border-b border-amber-100 px-4 py-3 flex items-center justify-between shrink-0 print:hidden sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-slate-800 font-semibold">LesCoach</span>
        </Link>
        <div className="flex items-center gap-2">
          {done && displayExperts.length > 0 && (
            <button
              onClick={() => setSelectedExpert(displayExperts[0])}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Expert inschakelen
            </button>
          )}
          {authedUser && authedUser.rol === "leraar" && (
            <div className="relative">
              <button
                onClick={() => historyOpen ? setHistoryOpen(false) : openHistory()}
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Eerdere gesprekken"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Eerdere gesprekken
              </button>
              {historyOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-[70vh] overflow-y-auto">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jouw laatste gesprekken</span>
                    <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
                  </div>
                  {historyLoading ? (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">Laden…</div>
                  ) : history.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500 text-center">Nog geen eerdere gesprekken.</div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {history.map((h) => (
                        <li key={h.id}>
                          <button
                            onClick={() => loadHistoryItem(h.id)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors"
                          >
                            <div className="text-sm font-medium text-slate-900 line-clamp-1">
                              {h.primaryKaart || h.categorie || h.zoekterm || "Gesprek"}
                            </div>
                            {h.samenvatting && (
                              <div className="text-xs text-slate-500 line-clamp-2 mt-0.5">{h.samenvatting}</div>
                            )}
                            <div className="text-[11px] text-slate-400 mt-1">
                              {h.datum ? new Date(h.datum).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            onClick={resetChat}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Nieuw gesprek
          </button>
          {authedUser && (
            <div className="hidden md:flex items-center gap-2 pl-3 ml-1 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-medium text-slate-700">{authedUser.naam}</div>
                {authedUser.schoolnaam ? <div className="text-[11px] text-slate-400 leading-tight">{authedUser.schoolnaam}</div> : null}
              </div>
              {authedUser.rol === "admin" && (
                <Link href="/school" className="text-xs text-blue-600 hover:underline px-2 py-1 rounded-lg hover:bg-blue-50">Team</Link>
              )}
              <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50" title="Uitloggen">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible print:block">

        {/* Chat area */}
        <div className={`flex flex-col flex-1 overflow-hidden print:hidden ${done ? "lg:max-w-[45%]" : ""}`}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div key={i} className="space-y-2">
                  <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <span className="text-white text-sm font-semibold">N</span>
                      </div>
                    )}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex flex-col gap-1 max-w-[85%]">
                      <div className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
                        msg.role === "assistant"
                          ? "bg-white border border-amber-100 text-slate-800 rounded-tl-sm"
                          : "bg-blue-600 text-white rounded-tr-sm"
                      }`}>
                        {msg.content.split("\n").map((line, j) => (
                          <span key={j}>
                            {line}
                            {j < msg.content.split("\n").length - 1 && <br />}
                          </span>
                        ))}
                      </div>
                      {msg.role === "assistant" ? (
                        <div className="flex items-center gap-1 pl-1">
                          <SpeakerButton text={msg.content} />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Chips appear below the last assistant message */}
                  {msg.role === "assistant" && isLast && suggestions.length > 0 && !loading && (
                    <ChipRow
                      suggestions={suggestions}
                      onSelect={(s) => sendMessage(s)}
                      disabled={loading}
                    />
                  )}
                </div>
              );
            })}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Subtle intake progress — visible until zoek_kenniskaarten returns results */}
          {!done && messages.filter((m) => m.role === "user").length >= 1 && messages.filter((m) => m.role === "user").length < 4 && (
            <div className="shrink-0 text-center px-4 pb-1 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="flex gap-0.5">
                  {[0,1,2,3].map((i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i < messages.filter((m) => m.role === "user").length ? "bg-blue-500" : "bg-slate-300"}`}
                    />
                  ))}
                </span>
                <span>Intake — max 4 vragen</span>
              </span>
            </div>
          )}

          {/* Mobile: done banner (sheet trigger) */}
          {done && kenniskaarten.length > 0 && mobileSheet === "hidden" && (
            <div className="lg:hidden shrink-0 mx-4 mb-3">
              <button
                onClick={() => setMobileSheet("peek")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Jouw resultaten</div>
                    <div className="text-xs text-blue-100">{kenniskaarten.length} kenniskaart{kenniskaarten.length === 1 ? "" : "en"} &middot; {displayExperts.length} expert{displayExperts.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 bg-white border-t border-amber-100 px-4 py-3 pb-[env(safe-area-inset-bottom,0.75rem)]">
            {piiWarning && (
              <div className="max-w-3xl mx-auto mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" />
                </svg>
                <div className="flex-1">
                  <span className="font-medium">Tip: gebruik geen namen, telefoonnummers of BSN.</span>{" "}
                  <span>We hebben de herkenbare gegevens automatisch weggehaald voordat Noor je bericht las. Gebruik liever initialen (bv. &quot;leerling M.&quot;) om AVG-risico te beperken.</span>
                </div>
                <button
                  onClick={() => setPiiWarning(false)}
                  aria-label="Sluiten"
                  className="shrink-0 text-amber-600 hover:text-amber-800"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <MicButton
                disabled={loading}
                onTranscript={(t) => setInput(t)}
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={done ? "Stel een vervolgvraag…" : "Typ of dicteer je bericht…"}
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-40 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              Enter om te versturen · Shift+Enter voor nieuwe regel
            </p>
          </div>
        </div>

        {/* Results panel (desktop) */}
        {done && kenniskaarten.length > 0 && (
          <div className="hidden lg:flex flex-col w-[55%] border-l border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-y-auto print:w-full print:border-0 print:block">
            <ResultsPanel
              analysis={analysis}
              kenniskaarten={kenniskaarten}
              primaryKaartId={primaryKaartId}
              alternativeKaartIds={alternativeKaartIds}
              experts={displayExperts}
              onContactExpert={(e) => setSelectedExpert(e)}
              onNewConversation={resetChat}
            />
          </div>
        )}
      </div>

      {/* Mobile bottom-sheet */}
      {done && kenniskaarten.length > 0 && (
        <>
          {/* Dim backdrop when full */}
          {mobileSheet === "full" && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-30 print:hidden"
              onClick={() => setMobileSheet("peek")}
              aria-hidden
            />
          )}
          <div
            className={`lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out print:hidden ${
              mobileSheet === "hidden"
                ? "translate-y-full"
                : mobileSheet === "peek"
                ? "translate-y-[calc(100%-180px)]"
                : "translate-y-0"
            }`}
            style={{ maxHeight: "92vh", height: "92vh" }}
          >
            <button
              onClick={() => setMobileSheet(mobileSheet === "full" ? "peek" : "full")}
              className="w-full pt-2 pb-1 flex flex-col items-center"
              aria-label={mobileSheet === "full" ? "Minimaliseer" : "Open"}
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </button>
            <div className="flex items-center justify-between px-5 pb-2 border-b border-slate-100">
              <div>
                <div className="text-sm font-semibold text-slate-900">Jouw resultaten</div>
                <div className="text-[11px] text-slate-500">
                  {kenniskaarten.length} kaart{kenniskaarten.length === 1 ? "" : "en"} &middot; {displayExperts.length} expert{displayExperts.length === 1 ? "" : "s"}
                </div>
              </div>
              <button
                onClick={() => setMobileSheet("hidden")}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Sluiten"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto bg-gradient-to-b from-amber-50/30 to-white" style={{ height: "calc(92vh - 52px)" }}>
              <ResultsPanel
                analysis={analysis}
                kenniskaarten={kenniskaarten}
                primaryKaartId={primaryKaartId}
              alternativeKaartIds={alternativeKaartIds}
                experts={displayExperts}
                onContactExpert={(e) => setSelectedExpert(e)}
                onNewConversation={resetChat}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
