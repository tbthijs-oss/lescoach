"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">L</span>
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
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Wat is het?
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.watIsHet}</p>
            </div>
          )}
          {kaart.gevolgen && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Gevolgen in de klas
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.gevolgen}</p>
            </div>
          )}
          {kaart.tips && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Tips voor de leerkracht
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{kaart.tips}</p>
            </div>
          )}
          {kaart.trefwoorden.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {kaart.trefwoorden.map((t) => (
                <span
                  key={t}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-2 border-t border-slate-100 flex gap-3">
        {kaart.pdfUrl && (
          <a
            href={kaart.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </a>
        )}
        {kaart.bronUrl && (
          <a
            href={kaart.bronUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:underline flex items-center gap-1"
          >
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

// ─── Expert contact modal ─────────────────────────────────────────────────────
function ExpertModal({
  messages,
  kenniskaarten,
  onClose,
}: {
  messages: Message[];
  kenniskaarten: Kenniskaart[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactForm>({
    naam: "",
    school: "",
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
        body: JSON.stringify({ messages, kenniskaarten, contact: form }),
      });
      if (!res.ok) throw new Error("Fout bij versturen");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Success state */}
        {status === "sent" ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Aanvraag verstuurd!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Jeroen Hendricks ontvangt jouw aanvraag samen met het volledige gespreksverslag en de gevonden kenniskaarten. Hij neemt zo snel mogelijk contact met je op.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Sluiten
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Vraag advies aan een expert</h2>
                  <p className="text-blue-200 text-sm mt-0.5">
                    Jeroen ontvangt jouw volledige rapport automatisch
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-blue-200 hover:text-white p-1 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Expert mini-profile */}
              <div className="mt-4 flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold">
                  JH
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Jeroen Hendricks</div>
                  <div className="text-xs text-blue-200">Specialist Speciaal Onderwijs</div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Naam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.naam}
                    onChange={(e) => update("naam", e.target.value)}
                    placeholder="Jouw naam"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    School <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.school}
                    onChange={(e) => update("school", e.target.value)}
                    placeholder="Naam van de school"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  E-mailadres <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="jouw@school.nl"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Telefoonnummer{" "}
                  <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <input
                  type="tel"
                  value={form.telefoon}
                  onChange={(e) => update("telefoon", e.target.value)}
                  placeholder="06 12345678"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Aanvullende opmerkingen{" "}
                  <span className="text-slate-400 font-normal">(optioneel)</span>
                </label>
                <textarea
                  value={form.opmerkingen}
                  onChange={(e) => update("opmerkingen", e.target.value)}
                  placeholder="Iets wat je wil meegeven aan Jeroen…"
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {status === "error" && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  Er is iets misgegaan. Probeer het opnieuw of neem direct contact op.
                </p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {status === "sending" ? "Versturen…" : "Verstuur aanvraag →"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Annuleren
                </button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Jeroen ontvangt jouw gespreksverslag en de gevonden kenniskaarten.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Expert CTA card (in results panel) ──────────────────────────────────────
function ExpertCard({ onContact }: { onContact: () => void }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-lg">
          JH
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base">Jeroen Hendricks</div>
          <div className="text-blue-200 text-xs mt-0.5">Specialist Speciaal Onderwijs</div>
          <p className="text-blue-100 text-xs mt-2 leading-relaxed">
            Meer dan 10 jaar ervaring in het begeleiden van leerlingen en leerkrachten in het speciaal onderwijs.
          </p>
        </div>
      </div>
      <button
        onClick={onContact}
        className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm py-2.5 rounded-xl transition-colors"
      >
        Vraag advies aan Jeroen →
      </button>
    </div>
  );
}

// ─── Results CTA banner (in chat area, mobile) ────────────────────────────────
function ResultsBanner({ onContact, onReset }: { onContact: () => void; onReset: () => void }) {
  return (
    <div className="mx-4 mb-4 bg-green-50 border border-green-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-green-800">Analyse klaar</span>
      </div>
      <p className="text-xs text-green-700 mb-3">
        Bekijk de kenniskaarten rechtsboven of neem contact op met een expert voor persoonlijk advies.
      </p>
      <div className="flex gap-2">
        <button
          onClick={onContact}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors"
        >
          Expert inschakelen
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          Nieuw gesprek
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [kenniskaarten, setKenniskaarten] = useState<Kenniskaart[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [showExpertModal, setShowExpertModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      startConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startConversation() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hallo, ik wil graag hulp voor een leerling." }],
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([
          { role: "user", content: "Hallo, ik wil graag hulp voor een leerling." },
          { role: "assistant", content: data.message },
        ]);
      }
    } catch {
      setMessages([
        {
          role: "assistant",
          content: "Sorry, er is iets misgegaan bij het starten. Probeer de pagina te vernieuwen.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.message) {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
      }
      if (data.kenniskaarten?.length > 0) {
        setKenniskaarten(data.kenniskaarten);
        setDone(true);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Sorry, er is iets misgegaan. Probeer het opnieuw." },
      ]);
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
    setInput("");
    setStarted(false);
    setDone(false);
    setShowExpertModal(false);
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Expert modal */}
      {showExpertModal && (
        <ExpertModal
          messages={messages}
          kenniskaarten={kenniskaarten}
          onClose={() => setShowExpertModal(false)}
        />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">L</span>
          </div>
          <span className="text-slate-800 font-semibold">LesCoach</span>
        </Link>
        <div className="flex items-center gap-2">
          {done && (
            <button
              onClick={() => setShowExpertModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Expert inschakelen
            </button>
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
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area */}
        <div
          className={`flex flex-col flex-1 overflow-hidden transition-all ${
            kenniskaarten.length > 0 ? "lg:max-w-[58%]" : ""
          }`}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">L</span>
                  </div>
                )}
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.role === "assistant"
                      ? "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                      : "bg-blue-600 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Results banner on mobile when done */}
          {done && (
            <div className="lg:hidden shrink-0">
              <ResultsBanner
                onContact={() => setShowExpertModal(true)}
                onReset={resetChat}
              />
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3">
            <div className="flex items-end gap-2 max-w-3xl mx-auto">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={done ? "Stel een vervolgvraag…" : "Typ je bericht…"}
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-40 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
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
        {kenniskaarten.length > 0 && (
          <div className="hidden lg:flex flex-col w-[42%] border-l border-slate-200 bg-slate-50 overflow-y-auto">

            {/* Panel header */}
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
              {/* Kenniskaarten */}
              {kenniskaarten.map((k) => (
                <KenniskaartCard key={k.id} kaart={k} />
              ))}

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Volgende stap</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Expert CTA */}
              <ExpertCard onContact={() => setShowExpertModal(true)} />

              {/* Additional CTAs */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={kenniskaarten[0]?.pdfUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl transition-colors ${!kenniskaarten[0]?.pdfUrl ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </a>
                <button
                  onClick={resetChat}
                  className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2.5 rounded-xl transition-colors"
                >
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

      {/* Mobile kenniskaarten (stacked below chat) */}
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
