"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { JeroenAvatar } from "@/components/JeroenAvatar";

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

// ─── Onboarding screen ────────────────────────────────────────────────────────

function OnboardingScreen({ onStart }: { onStart: (name: string, school: string) => void }) {
  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim(), school.trim());
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gradient-to-b from-blue-50 to-white px-6 py-10">
      <div className="w-full max-w-sm">
        {/* Logo + avatar */}
        <div className="flex flex-col items-center mb-8">
          <JeroenAvatar size={80} className="mb-4 drop-shadow-lg" />
          <h1 className="text-2xl font-bold text-slate-800">Hoi, ik ben Jeroen</h1>
          <p className="text-slate-500 text-sm mt-2 text-center leading-relaxed">
            Specialist speciaal onderwijs. Ik help je snel de juiste ondersteuning vinden voor jouw leerling.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="onboard-name">
              Wat is jouw naam? <span className="text-red-500">*</span>
            </label>
            <input
              id="onboard-name"
              ref={nameRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Lisa"
              autoComplete="given-name"
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor="onboard-school">
              Op welke school werk je? <span className="text-slate-400 font-normal">(optioneel)</span>
            </label>
            <input
              id="onboard-school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="Naam van de school"
              autoComplete="organization"
              className="w-full border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors text-base mt-2 shadow-sm"
          >
            Start het gesprek →
          </button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-6 leading-relaxed">
          Ik vraag nooit naar persoonlijke gegevens van leerlingen. Jouw gesprek wordt niet opgeslagen.
        </p>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <JeroenAvatar size={32} className="shrink-0 mt-0.5" />
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
  return (
    <div className="flex items-start gap-3 pl-11">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            disabled={disabled}
            onClick={() => onSelect(s)}
            className="text-sm bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-400 active:scale-95 disabled:opacity-40 px-3 py-2 rounded-full transition-all font-medium shadow-sm min-h-[40px]"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Kenniskaart card ─────────────────────────────────────────────────────────

function KenniskaartCard({ kaart }: { kaart: Kenniskaart }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-blue-50 flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
            {kaart.categorie}
          </span>
          <h3 className="font-semibold text-slate-800 mt-0.5">{kaart.titel}</h3>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 text-blue-600 hover:text-blue-800 text-sm font-medium min-h-[40px] px-2"
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
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 min-h-[36px]">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        )}
        {kaart.bronUrl && (
          <a href={kaart.bronUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:underline flex items-center gap-1 min-h-[36px]">
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
        className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-semibold text-sm py-3 rounded-xl transition-all min-h-[48px]"
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
  userName,
  userSchool,
  onClose,
}: {
  expert: Expert;
  messages: Message[];
  kenniskaarten: Kenniskaart[];
  userName: string;
  userSchool: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactForm>({
    naam: userName,
    school: userSchool,
    email: "",
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
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden max-h-[95dvh] sm:max-h-[90vh] flex flex-col">

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
            <button onClick={onClose} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors min-h-[48px]">
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
                <button onClick={onClose} className="text-blue-200 hover:text-white p-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    School <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={form.school} onChange={(e) => update("school", e.target.value)}
                    placeholder="Naam van de school"
                    className="w-full border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                  placeholder="jouw@school.nl"
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Telefoonnummer <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <input type="tel" value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)}
                  placeholder="06 12345678"
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Aanvullende opmerkingen <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <textarea value={form.opmerkingen} onChange={(e) => update("opmerkingen", e.target.value)}
                  placeholder="Iets wat je wil meegeven…" rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  Er is iets misgegaan. Probeer opnieuw of neem direct contact op via {expert.email}.
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={status === "sending"}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm min-h-[48px]">
                  {status === "sending" ? "Versturen…" : "Verstuur aanvraag →"}
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-3.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[48px]">
                  Annuleren
                </button>
              </div>

              <p className="text-xs text-center text-slate-400 pb-safe">
                {expert.naam} ontvangt automatisch het gespreksverslag en de kenniskaarten.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [userName, setUserName] = useState("");
  const [userSchool, setUserSchool] = useState("");
  const [onboarded, setOnboarded] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [kenniskaarten, setKenniskaarten] = useState<Kenniskaart[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, suggestions]);

  useEffect(() => {
    if (onboarded && !started) {
      setStarted(true);
      startConversation(userName, userSchool);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboarded]);

  function handleOnboardComplete(name: string, school: string) {
    setUserName(name);
    setUserSchool(school);
    setOnboarded(true);
  }

  async function startConversation(name: string, school: string) {
    setLoading(true);
    const greeting = school
      ? `Hallo, ik ben ${name} en ik werk op ${school}. Ik wil graag hulp voor een leerling.`
      : `Hallo, ik ben ${name}. Ik wil graag hulp voor een leerling.`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: greeting }],
          userName: name,
          userSchool: school,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([
          { role: "user", content: greeting },
          { role: "assistant", content: data.message },
        ]);
        setSuggestions(data.suggestions || []);
      }
    } catch {
      setMessages([{ role: "assistant", content: "Sorry, er is iets misgegaan bij het starten. Probeer de pagina te vernieuwen." }]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text?: string) {
    const textToSend = (text ?? input).trim();
    if (!textToSend || loading) return;

    setSuggestions([]);
    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, userName, userSchool }),
      });
      const data = await res.json();

      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
      setSuggestions(data.suggestions || []);

      if (data.kenniskaarten?.length > 0) {
        setKenniskaarten(data.kenniskaarten);
        setDone(true);
      }
      if (data.experts?.length > 0) {
        setExperts(data.experts);
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
    setOnboarded(false);
  }

  // Show onboarding if not yet completed
  if (!onboarded) {
    return <OnboardingScreen onStart={handleOnboardComplete} />;
  }

  const displayExperts = experts.length > 0 ? experts : [];

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50">
      {/* Expert modal */}
      {selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          messages={messages}
          kenniskaarten={kenniskaarten}
          userName={userName}
          userSchool={userSchool}
          onClose={() => setSelectedExpert(null)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0 safe-top">
        <Link href="/" className="flex items-center gap-2.5">
          <JeroenAvatar size={32} />
          <div>
            <span className="text-slate-800 font-semibold text-sm">Jeroen</span>
            <span className="text-slate-400 text-xs block leading-tight">LesCoach specialist</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {done && displayExperts.length > 0 && (
            <button
              onClick={() => setSelectedExpert(displayExperts[0])}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors min-h-[40px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Expert inschakelen
            </button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2 py-1.5 rounded-lg">
            <div className="w-5 h-5 bg-slate-300 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
              {userName[0]?.toUpperCase()}
            </div>
            <span className="hidden sm:inline">{userName}</span>
          </div>
          <button
            onClick={resetChat}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors min-h-[40px]"
            title="Nieuw gesprek"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Nieuw gesprek</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Chat area */}
        <div className={`flex flex-col flex-1 overflow-hidden ${kenniskaarten.length > 0 ? "lg:max-w-[58%]" : ""}`}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => {
              const isLast = i === messages.length - 1;
              // hide the auto-generated greeting from the user (first message)
              if (i === 0 && msg.role === "user") return null;
              return (
                <div key={i} className="space-y-2">
                  <div className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" && (
                      <JeroenAvatar size={32} className="shrink-0 mt-0.5" />
                    )}
                    {msg.role === "user" && (
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-slate-600 font-bold text-sm">
                        {userName[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === "assistant"
                        ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                        : "bg-blue-600 text-white rounded-tr-sm"
                    }`}>
                      {msg.content.split("\n").map((line, j) => (
                        <span key={j}>
                          {line}
                          {j < msg.content.split("\n").length - 1 && <br />}
                        </span>
                      ))}
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

          {/* Mobile: done banner */}
          {done && displayExperts.length > 0 && (
            <div className="lg:hidden shrink-0 mx-4 mb-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-green-800">Analyse klaar</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedExpert(displayExperts[0])}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 rounded-lg transition-colors min-h-[48px]">
                    Expert inschakelen
                  </button>
                  <button onClick={resetChat}
                    className="px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 min-h-[48px]">
                    Nieuw
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3 pb-safe">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={done ? "Stel een vervolgvraag…" : "Typ je bericht…"}
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-40 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 min-h-[44px] min-w-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-2 hidden sm:block">
              Enter om te versturen · Shift+Enter voor nieuwe regel
            </p>
          </div>
        </div>

        {/* Results panel (desktop) */}
        {kenniskaarten.length > 0 && (
          <div className="hidden lg:flex flex-col w-[42%] border-l border-slate-200 bg-slate-50 overflow-y-auto">

            <div className="px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-semibold text-slate-800 text-sm">Analyse klaar</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 ml-7">
                {kenniskaarten.length} kenniskaart{kenniskaarten.length !== 1 ? "en" : ""} gevonden
              </p>
            </div>

            <div className="p-5 space-y-4 flex-1">
              {kenniskaarten.map((k) => (
                <KenniskaartCard key={k.id} kaart={k} />
              ))}

              {/* Expert section */}
              {displayExperts.length > 0 && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      {displayExperts.length === 1 ? "Passende expert" : "Passende experts"}
                    </span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>

                  {displayExperts.map((expert) => (
                    <ExpertCard
                      key={expert.id}
                      expert={expert}
                      onContact={(e) => setSelectedExpert(e)}
                    />
                  ))}
                </>
              )}

              {/* Secondary CTAs */}
              <div className="grid grid-cols-2 gap-2">
                {kenniskaarten[0]?.pdfUrl && (
                  <a href={kenniskaarten[0].pdfUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                )}
                <button onClick={resetChat}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl transition-colors col-span-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Nieuw gesprek
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile kenniskaarten */}
      {kenniskaarten.length > 0 && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-72 overflow-y-auto">
          <div className="px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
            <h2 className="font-semibold text-slate-800 text-sm">
              Gevonden kenniskaarten ({kenniskaarten.length})
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {kenniskaarten.map((k) => (
              <KenniskaartCard key={k.id} kaart={k} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
