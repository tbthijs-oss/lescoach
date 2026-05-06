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

// Starter-voorbeelden voor nieuwe gebruikers — verschijnen onder Noor's
// openingsbericht zodat een leerkracht in één klik een gesprek kan starten.
const STARTER_EXAMPLES = [
  "Een kleuter van 5 die niet meedoet aan de kring",
  "Een leerling die plotseling agressief wordt",
  "Een 8-jarige die niet vooruitkomt met lezen",
];

// Vervolgvraag-voorstellen ná het rapport — context blijft behouden.
const FOLLOWUP_SUGGESTIONS = [
  "Wat kan ik vandaag al proberen?",
  "Hoe leg ik dit uit aan ouders?",
  "En als dit niet werkt?",
];

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

function SearchingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <NoorAvatar size={32} className="shrink-0 mt-0.5" alt="" />
      <div className="bg-blue-50 border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <svg className="w-4 h-4 shrink-0 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
            <path d="M22 12a10 10 0 01-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span>Zoeken in kennisbank…</span>
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
  const [expanded, setExpanded] = useState(false);
  if (!suggestions.length) return null;
  const unique = Array.from(
    new Set(suggestions.map((s) => s.trim()).filter(Boolean))
  );
  if (!unique.length) return null;
  const MAX_VISIBLE = 3;
  const visible = expanded ? unique : unique.slice(0, MAX_VISIBLE);
  const hiddenCount = unique.length - MAX_VISIBLE;
  return (
    <div className="flex items-start gap-3 pl-11 mt-1">
      <div className="flex flex-wrap gap-x-2 gap-y-2 max-w-full">
        {visible.map((s) => (
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
  const [autoTts, setAutoTts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const confirmResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPlayAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevLoadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Laad auto-TTS voorkeur + onboarding-status uit localStorage
  useEffect(() => {
    try {
      if (localStorage.getItem("noor:autoTts") === "1") setAutoTts(true);
      if (!localStorage.getItem("noor:onboarding:v1")) setShowOnboarding(true);
    } catch {}
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try { localStorage.setItem("noor:onboarding:v1", "1"); } catch {}
  }

  // Auto-play wanneer Noor klaar is met typen en autoTts aan staat
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;
    if (!wasLoading || loading) return;
    if (!autoTts) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content.trim()) return;
    autoPlayAudioRef.current?.pause();
    autoPlayAudioRef.current = null;
    (async () => {
      try {
        const res = await fetch(`/api/speak?text=${encodeURIComponent(lastMsg.content.slice(0, 600))}`);
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        autoPlayAudioRef.current = audio;
        audio.onended = () => { autoPlayAudioRef.current = null; };
        await audio.play();
      } catch {}
    })();
  }, [loading, autoTts, messages]);

  function toggleAutoTts() {
    setAutoTts(v => {
      const next = !v;
      try { localStorage.setItem("noor:autoTts", next ? "1" : "0"); } catch {}
      return next;
    });
  }

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

    // Stop any auto-playing audio when the user sends a new message
    autoPlayAudioRef.current?.pause();
    autoPlayAudioRef.current = null;

    setSuggestions([]);
    setPiiWarning(false);
    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    // Add a placeholder assistant message that will be filled while streaming
    const streamingPlaceholder: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, streamingPlaceholder]);
    setInput("");
    setLoading(true);

    const apiMessages: Message[] =
      newMessages[0]?.role === "assistant"
        ? [
            { role: "user", content: "Hallo, ik wil graag hulp voor een leerling." },
            { role: "assistant", content: newMessages[0].content },
            ...newMessages.slice(1),
          ]
        : newMessages;

    try {
      // AbortController zodat de leerkracht 'Stop genereren' kan klikken
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("stream-start-failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "chunk") {
              streamedText += event.text;
              // Strip a (possibly incomplete) [Suggesties: ...] tail-line tijdens
              // het streamen, zodat de leerkracht hem niet eerst ziet verschijnen
              // en bij intake_done weer ziet verdwijnen (visuele flicker).
              const display = streamedText
                .replace(/\[(?:suggesties|suggestions)\s*:[^\]]*\]?\s*$/i, "")
                .trimEnd();
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: display };
                return updated;
              });
            } else if (event.type === "searching") {
              setIsSearching(true);
              // Verwijder de streaming placeholder — SearchingIndicator neemt het over
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: "" };
                return updated;
              });
              streamedText = "";
            } else if (event.type === "pii") {
              setPiiWarning(true);
            } else if (event.type === "suggestions") {
              setSuggestions(event.data || []);
            } else if (event.type === "intake_done") {
              // Final clean message for intake turn
              const finalMsg: string = event.data?.message || streamedText;
              setMessages([...newMessages, { role: "assistant", content: finalMsg }]);
              setSuggestions(event.data?.suggestions || []);
              streamedText = "";
            } else if (event.type === "result") {
              setIsSearching(false);
              const data = event.data;
              const incomingExperts: Expert[] = data.experts?.length > 0 ? data.experts : [];
              const incomingAnalysis: NoorAnalysis | null = data.analysis ?? null;
              const incomingPrimaryKaartId: string | null = data.primaryKaartId ?? null;
              const incomingAlternativeKaartIds: string[] = Array.isArray(data.alternativeKaartIds) ? data.alternativeKaartIds : [];

              const finalMessages: Message[] = [
                ...newMessages,
                { role: "assistant", content: data.message ?? "" },
              ];
              setMessages(finalMessages);
              setSuggestions([]);
              if (incomingExperts.length > 0) setExperts(incomingExperts);
              if (incomingAnalysis) setAnalysis(incomingAnalysis);
              if (incomingPrimaryKaartId) setPrimaryKaartId(incomingPrimaryKaartId);
              setAlternativeKaartIds(incomingAlternativeKaartIds);

              if (data.kenniskaarten?.length > 0) {
                setKenniskaarten(data.kenniskaarten);
                setDone(true);
                try {
                  sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify({
                    analysis: incomingAnalysis, kenniskaarten: data.kenniskaarten,
                    experts: incomingExperts, primaryKaartId: incomingPrimaryKaartId,
                    alternativeKaartIds: incomingAlternativeKaartIds,
                    messages: finalMessages, savedAt: Date.now(),
                  }));
                } catch { /* ignore */ }
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  router.push("/resultaten");
                }
              }
            } else if (event.type === "error") {
              setMessages([...newMessages, { role: "assistant", content: event.message || "Sorry, er is iets misgegaan. Probeer het opnieuw." }]);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      const aborted =
        err instanceof DOMException && err.name === "AbortError";
      if (!aborted) {
        setMessages([...newMessages, { role: "assistant", content: "Sorry, er is iets misgegaan. Probeer het opnieuw." }]);
      }
      // Bij abort: laat het deels-getypte bericht staan zoals het nu is.
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      setIsSearching(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetChat() {
    if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
    setConfirmReset(false);
    setMessages([]);
    setKenniskaarten([]);
    setExperts([]);
    setSuggestions([]);
    setInput("");
    setStarted(false);
    setDone(false);
    setIsSearching(false);
    setSelectedExpert(null);
    setAnalysis(null);
    setPrimaryKaartId(null);
    setAlternativeKaartIds([]);
    setPiiWarning(false);
    try { sessionStorage.removeItem(RESULTS_STORAGE_KEY); } catch {}
    setTimeout(() => {
      setStarted(true);
      setMessages([{ role: "assistant", content: OPENING_MESSAGE }]);
      setSuggestions([]);
    }, 50);
  }

  function handleResetClick() {
    const hasConversation = messages.filter((m) => m.role === "user").length > 0;
    if (!hasConversation) { resetChat(); return; }
    if (confirmReset) { resetChat(); return; }
    setConfirmReset(true);
    if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current);
    confirmResetTimerRef.current = setTimeout(() => setConfirmReset(false), 4000);
  }

  const displayExperts = experts.length > 0 ? experts : [];

  return (
    <div className="flex flex-col h-dvh bg-[#fefcf7] print:bg-white print:h-auto">
      {/* Onboarding overlay — eerste keer */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
            {onboardingStep === 0 ? (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <NoorAvatar size={30} alt="" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Welkom bij Noor</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Noor stelt je max. 4 gerichte vragen om te snappen wat er speelt bij jouw leerling. Tik op een suggestie of typ zelf — gebruik initialen in plaats van namen.
                </p>
                <div className="mt-5">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                  >
                    Volgende →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Je rapport verschijnt rechts</h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Na het gesprek zoekt Noor de beste kenniskaarten op én koppelt een passende expert. Op je telefoon tik je op &ldquo;Bekijk resultaten&rdquo; om ze te zien.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => setOnboardingStep(0)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 text-sm font-medium transition-colors"
                  >
                    ← Terug
                  </button>
                  <button
                    onClick={dismissOnboarding}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
                  >
                    Aan de slag!
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
          <div className="flex flex-col leading-none">
            <span className="text-slate-800 font-semibold text-sm">LesCoach</span>
            {authedUser?.schoolnaam && (
              <span className="text-[11px] text-slate-400 leading-tight">{authedUser.schoolnaam}</span>
            )}
          </div>
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
                            <div className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                              {h.samenvatting || h.primaryKaart || h.categorie || h.zoekterm || "Gesprek"}
                            </div>
                            {h.primaryKaart && h.samenvatting && (
                              <div className="text-[11px] text-blue-600 mt-0.5 line-clamp-1">{h.primaryKaart}</div>
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
          {/* Auto-TTS global toggle */}
          <button
            type="button"
            onClick={toggleAutoTts}
            title={autoTts ? "Automatisch voorlezen staat aan" : "Automatisch voorlezen staat uit"}
            aria-label={autoTts ? "Stop automatisch voorlezen" : "Zet automatisch voorlezen aan"}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
              autoTts ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M9 9H5a1 1 0 00-1 1v4a1 1 0 001 1h4l5 4V5L9 9z" />
              {!autoTts && <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth={2} />}
            </svg>
          </button>
          {/* Nieuw gesprek — met inline confirm na eerste vraag */}
          {confirmReset ? (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 hidden sm:inline">Reset?</span>
              <button
                onClick={resetChat}
                className="text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition-colors"
              >Ja</button>
              <button
                onClick={() => { setConfirmReset(false); if (confirmResetTimerRef.current) clearTimeout(confirmResetTimerRef.current); }}
                className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
              >Nee</button>
            </div>
          ) : (
            <button
              onClick={handleResetClick}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              title="Nieuw gesprek"
              aria-label="Nieuw gesprek"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Nieuw gesprek</span>
            </button>
          )}
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
              // Skip de lege streaming-placeholder — de TypingIndicator hieronder
              // toont "Noor denkt na" totdat het eerste fragment binnenkomt.
              if (msg.role === "assistant" && msg.content.length === 0) return null;
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
                        {/* Typing-cursor: alleen op het laatste bericht van Noor terwijl ze streamt */}
                        {msg.role === "assistant" &&
                          isLast &&
                          loading &&
                          !isSearching &&
                          msg.content.length > 0 && (
                            <span className="noor-cursor text-blue-500" aria-hidden="true" />
                          )}
                      </div>
                      {msg.role === "assistant" && isLast ? (
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

                  {/* Starter-voorbeelden — alleen bij de allereerste turn, vóór de
                      leerkracht iets heeft getypt. Helpt mensen die niet weten waar
                      ze moeten beginnen. */}
                  {msg.role === "assistant" &&
                    isLast &&
                    !loading &&
                    !done &&
                    messages.length === 1 &&
                    suggestions.length === 0 && (
                      <div className="flex items-start gap-3 pl-11 mt-2">
                        <div className="flex flex-col gap-2 max-w-full w-full">
                          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                            Of begin met een voorbeeld
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {STARTER_EXAMPLES.map((ex) => (
                              <button
                                key={ex}
                                type="button"
                                disabled={loading}
                                onClick={() => sendMessage(ex)}
                                className="text-left text-sm leading-snug bg-amber-50 border border-amber-200 text-slate-700 hover:bg-amber-100 hover:border-amber-300 active:bg-amber-200 disabled:opacity-40 px-3.5 py-2 rounded-2xl transition-colors shadow-sm max-w-full"
                              >
                                {ex}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              );
            })}

            {isSearching && <SearchingIndicator />}
            {loading && !isSearching && (() => {
              const last = messages[messages.length - 1];
              const lastIsEmpty = !!last && last.role === "assistant" && last.content.length === 0;
              return lastIsEmpty ? <TypingIndicator /> : null;
            })()}
            <div ref={bottomRef} />
          </div>

          {/* Intake progress pill */}
          {(() => {
            const userTurns = messages.filter((m) => m.role === "user").length;
            if (done || userTurns < 1 || userTurns >= 9) return null;
            const vraagNr = Math.min(userTurns + 1, 4);
            return (
              <div className="shrink-0 text-center px-4 pb-1 pt-0.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-100 rounded-full px-3 py-1">
                  Vraag {vraagNr} van max. 4
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

          {/* Vervolgvraag-voorstellen na rapport — houdt context vast */}
          {done && !loading && suggestions.length === 0 && (
            <div className="shrink-0 px-4 pt-2 pb-1">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Stel een vervolgvraag
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOLLOWUP_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="text-sm leading-tight bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-500 active:bg-blue-100 px-3.5 py-2 rounded-full transition-colors font-medium shadow-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 bg-white border-t border-amber-100 px-4 py-3 pb-[env(safe-area-inset-bottom,0.75rem)]">
            {piiWarning && (
              <div className="max-w-3xl mx-auto mb-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-xs text-green-700">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Naam en persoonsgegevens automatisch verwijderd.
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
                placeholder={
                  loading
                    ? "Noor is aan het schrijven…"
                    : done
                    ? "Stel een vervolgvraag…"
                    : "Typ of dicteer je bericht…"
                }
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 max-h-40 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
              />
              {loading ? (
                <button
                  onClick={stopGeneration}
                  type="button"
                  title="Stop met genereren"
                  aria-label="Stop met genereren"
                  className="w-11 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex items-center justify-center transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1.5" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="w-11 h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl flex items-center justify-center transition-colors shrink-0"
                  aria-label="Verstuur bericht"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              )}
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
