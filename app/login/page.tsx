"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Deze loginlink is niet geldig. Vraag een nieuwe aan.",
  expired: "Deze loginlink is verlopen. Vraag een nieuwe aan — links zijn 15 minuten geldig.",
  used: "Deze loginlink is al eens gebruikt. Vraag een nieuwe aan.",
  blocked: "Je account is geblokkeerd. Neem contact op met je school-admin.",
};

function LoginForm() {
  const params = useSearchParams();
  const errorCode = params.get("error");
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : null;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data.error || "Er ging iets mis. Probeer het nog eens.");
      } else {
        setSent(true);
      }
    } catch {
      setErr("Kon geen verbinding maken. Probeer het nog eens.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur rounded-3xl border border-amber-100 p-8 shadow-lg shadow-amber-100/40">
        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Check je mail</h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Als <span className="font-medium text-slate-800">{email}</span> bij een school hoort, vind je een loginlink in je inbox.
          De link is 15 minuten geldig en kan één keer gebruikt worden.
        </p>
        <p className="text-xs text-slate-500">
          Geen mail ontvangen? Check je spam-map of{" "}
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="text-blue-600 hover:underline"
          >
            probeer een ander adres
          </button>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur rounded-3xl border border-amber-100 p-8 shadow-lg shadow-amber-100/40">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-5 shadow-md shadow-blue-600/20">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Inloggen bij Noor</h1>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        Vul je schoolmailadres in. We sturen je een eenmalige loginlink.
      </p>

      {errorMessage ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2.5 rounded-lg mb-4">
          {errorMessage}
        </div>
      ) : null}

      {err ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg mb-4">
          {err}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-slate-700 mb-1.5">E-mailadres</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jij@jouwschool.nl"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !email}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-[15px] hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Bezig…" : "Stuur loginlink"}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-6 leading-relaxed">
        Alleen leraren die door hun school-admin zijn uitgenodigd kunnen inloggen.
        Nog geen toegang?{" "}
        <Link href="/" className="text-blue-600 hover:underline">Lees meer op lescoach.nl</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fefcf7] via-[#fef3e8] to-[#fefcf7] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-sm text-slate-500">Laden…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
