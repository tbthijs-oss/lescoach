"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NoorAvatar } from "@/components/JeroenAvatar";
import {
  ReportView,
  ExpertModal,
  type Kenniskaart,
  type Expert,
  type Message,
  type NoorAnalysis,
} from "@/components/ReportView";

// sessionStorage key voor de /resultaten pagina — moet matchen met
// app/resultaten/page.tsx.
const RESULTS_STORAGE_KEY = "lescoach:last-results:v1";

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <NoorAvatar size={32} className="shrink-0 mt-0.5" alt="" />
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
  /** Called repeatedly tijdens dicteren met de volledige getranscribeerde tekst zoals die in het invoerveld moet staan (existing text + dictation). */
  onTranscript: (text: string) => void;
  /** Snapshot van de huidige textarea-inhoud op het moment dat de gebruiker op de microfoon-knop drukt. Wordt vóór de gedicteerde tekst geplaatst zodat eerder getypte tekst niet wordt overschreven. */
  getCurrentInput?: () => string;
  disabled?: boolean;
}

function MicButton({ onTranscript, getCurrentInput, disabled }: MicButtonProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null); // null until we have probed
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  function start() {
    if (disabled) return;
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setErrorMsg("Dicteren werkt nog niet in deze browser. Probeer Chrome, Edge of Safari.");
      return;
    }
    setErrorMsg(null);
    const rec = new SR();
    rec.lang = "nl-NL";
    rec.interimResults = true;
    // Continuous: gebruiker kan rustig nadenken zonder dat de opname stopt.
    // Stoppen gaat via de stop-knop of door nogmaals op de mic te tikken.
    rec.continuous = true;

    // Snapshot van de bestaande tekst — zodat we die niet overschrijven.
    const baseText = (getCurrentInput?.() ?? "").trim();

    let finalTranscript = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interim += r[0].transcript;
      }
      const dictated = (finalTranscript + interim).trim();
      const combined = baseText
        ? `${baseText} ${dictated}`.trim()
        : dictated;
      onTranscript(combined);
    };

    rec.onerror = (e: any) => {
      setListening(false);
      // Friendly error labels per officiële SpeechRecognitionErrorEvent.error waarden.
      const code = e?.error || "unknown";
      switch (code) {
        case "not-allowed":
        case "service-not-allowed":
          setErrorMsg("Microfoon-toegang is geweigerd. Sta hem toe in je browser-instellingen en probeer opnieuw.");
          break;
        case "no-speech":
          setErrorMsg("Niets gehoord — spreek wat luider of dichter bij de microfoon.");
          break;
        case "audio-capture":
          setErrorMsg("Geen microfoon gevonden. Controleer of je apparaat een werkende microfoon heeft.");
          break;
        case "network":
          setErrorMsg("Verbindingsprobleem met de spraakherkenning. Probeer het zo nog eens.");
          break;
        case "aborted":
          // door de gebruiker gestopt — geen foutmelding nodig.
          break;
        default:
          setErrorMsg(`Dicteren werkte even niet (${code}). Probeer het opnieuw.`);
      }
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch (err: any) {
      setListening(false);
      // InvalidStateError: bv. al actief — een second click stopt 'm dan ook.
      setErrorMsg("Kon niet starten met dicteren — probeer het opnieuw.");
    }
  }

  function stop() {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }

  // Tijdens probing nog niets renderen.
  if (supported === null) return null;

  // Niet-ondersteunde browser: toon een uitgeschakelde knop met uitleg
  // — beter dan onzichtbaar zijn want anders denkt de leerkracht 'er is geen
  // dicteer-feature' terwijl het in een andere browser wel zou werken.
  if (!supported) {
    return (
      <button
        type="button"
        disabled
        aria-label="Dicteren niet ondersteund in deze browser"
        title="Dicteren werkt nog niet in deze browser. Probeer Chrome, Edge of Safari."
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-300 cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth={2} />
        </svg>
      </button>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={listening ? stop : start}
        disabled={disabled}
        aria-label={listening ? "Stop dicteren" : "Dicteer je bericht"}
        title={listening ? "Stop dicteren" : "Spreek je bericht in"}
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          listening
            ? "bg-rose-100 text-rose-600 ring-2 ring-rose-300 animate-pulse"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        } disabled:opacity-50`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z" />
        </svg>
      </button>
      {/* Inline error toast — verdwijnt automatisch na 6 sec. */}
      {errorMsg && (
        <div
          role="alert"
          className="absolute bottom-full left-0 mb-2 w-64 sm:w-72 bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2 rounded-lg shadow-lg z-10"
          onAnimationEnd={() => setTimeout(() => setErrorMsg(null), 6000)}
        >
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16a2 2 0 001.73 3z" />
            </svg>
            <span className="flex-1 leading-snug">{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              aria-label="Sluiten"
              className="text-amber-600 hover:text-amber-800 -mr-1 -my-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
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
  const [authedUser, setAuthedUser] = useState<{ naam: string; email: string; rol: "admin" | "leraar"; schoolnaam?: string } | null>(null);
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
          email: data.leraar?.email || "",
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

      const incomingExperts: Expert[] = data.experts?.length > 0 ? data.experts : [];
      const incomingAnalysis: NoorAnalysis | null = data.analysis ?? null;
      const incomingPrimaryKaartId: string | null = data.primaryKaartId ?? null;
      const incomingAlternativeKaartIds: string[] = Array.isArray(data.alternativeKaartIds)
        ? data.alternativeKaartIds
        : [];

      if (incomingExperts.length > 0) setExperts(incomingExperts);
      if (incomingAnalysis) setAnalysis(incomingAnalysis);
      if (incomingPrimaryKaartId) setPrimaryKaartId(incomingPrimaryKaartId);
      if (Array.isArray(data.alternativeKaartIds)) setAlternativeKaartIds(incomingAlternativeKaartIds);

      if (data.kenniskaarten?.length > 0) {
        setKenniskaarten(data.kenniskaarten);
        setDone(true);

        // Persist to sessionStorage zodat /resultaten de uitkomst kan lezen,
        // ook na een browser-refresh of vanuit een nieuw tabblad.
        try {
          const finalMessages: Message[] = [
            ...newMessages,
            { role: "assistant", content: data.message ?? "" },
          ];
          const payload = {
            analysis: incomingAnalysis,
            kenniskaarten: data.kenniskaarten,
            experts: incomingExperts,
            primaryKaartId: incomingPrimaryKaartId,
            alternativeKaartIds: incomingAlternativeKaartIds,
            messages: finalMessages,
            savedAt: Date.now(),
          };
          sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // sessionStorage kan vol of geblokkeerd zijn — degradatie naar in-memory only.
        }

        // Mobiel: navigeer naar de eigen /resultaten pagina (los leesbaar op telefoon).
        // Desktop houdt de side-panel layout die hieronder al gerenderd wordt.
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          router.push("/resultaten");
        }
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
    setAlternativeKaartIds([]);
    setPiiWarning(false);
    try { sessionStorage.removeItem(RESULTS_STORAGE_KEY); } catch {}
    // trigger fresh start — show hardcoded opener instantly
    setTimeout(() => {
      setStarted(true);
      setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
      setSuggestions([]);
    }, 50);
  }

  const displayExperts = experts.length > 0 ? experts : [];

  return (
    <div className="flex flex-col h-dvh bg-[#fefcf7] print:bg-white print:h-auto">
      {/* Expert modal */}
      {selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          messages={messages}
          kenniskaarten={kenniskaarten}
          onClose={() => setSelectedExpert(null)}
          defaultValues={{
            naam: authedUser?.naam,
            school: authedUser?.schoolnaam,
            email: authedUser?.email,
          }}
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
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                title="Eerdere gesprekken"
                aria-label="Eerdere gesprekken"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Eerdere gesprekken</span>
              </button>
              {historyOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-[70dvh] overflow-y-auto">
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
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Nieuw gesprek"
            aria-label="Nieuw gesprek"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Nieuw gesprek</span>
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
                      <NoorAvatar size={36} className="shrink-0 mt-0.5 shadow-sm" alt="" />
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
          {(() => {
            const userTurns = messages.filter((m) => m.role === "user").length;
            if (done || userTurns < 1 || userTurns >= 9) return null;
            // Show 5 dots — landing-zone for an ideal intake (4-7 vragen).
            // Dots fill 1:1 with the user-turn count, clamped at 5.
            const filled = Math.min(userTurns, 5);
            return (
              <div className="shrink-0 text-center px-4 pb-1 pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="flex gap-0.5">
                    {[0,1,2,3,4].map((i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < filled ? "bg-blue-500" : "bg-slate-300"}`}
                      />
                    ))}
                  </span>
                  <span>Intake bezig</span>
                </span>
              </div>
            );
          })()}

          {/* Mobile: done banner — opent de eigen /resultaten pagina */}
          {done && kenniskaarten.length > 0 && (
            <div className="lg:hidden shrink-0 mx-4 mb-3">
              <button
                onClick={() => router.push("/resultaten")}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Bekijk resultaten</div>
                    <div className="text-xs text-blue-100">{kenniskaarten.length} kenniskaart{kenniskaarten.length === 1 ? "" : "en"} &middot; {displayExperts.length} expert{displayExperts.length === 1 ? "" : "s"}</div>
                  </div>
                </div>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
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
                getCurrentInput={() => input}
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

        {/* Results panel (desktop) — op mobiel navigeren we naar /resultaten i.p.v. dit te tonen */}
        {done && kenniskaarten.length > 0 && (
          <div className="hidden lg:flex flex-col w-[55%] border-l border-slate-200 bg-gradient-to-b from-slate-50 to-white overflow-y-auto print:w-full print:border-0 print:block">
            <ReportView
              analysis={analysis}
              kenniskaarten={kenniskaarten}
              primaryKaartId={primaryKaartId}
              alternativeKaartIds={alternativeKaartIds}
              experts={displayExperts}
              onContactExpert={(e) => setSelectedExpert(e)}
              onNewConversation={resetChat}
              variant="panel"
            />
          </div>
        )}
      </div>
    </div>
  );
}
