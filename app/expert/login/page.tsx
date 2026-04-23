"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorBanner() {
  const params = useSearchParams();
  const err = params.get("error");
  if (!err) return null;
  const map: Record<string, string> = {
    invalid: "Deze link is niet geldig.",
    used: "Deze link is al eerder gebruikt. Vraag hieronder een nieuwe aan.",
    expired: "Deze link is verlopen. Vraag hieronder een nieuwe aan.",
  };
  const msg = map[err] || "Er ging iets mis.";
  return (
    <div className="mb-3 text-sm bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg">
      {msg}
    </div>
  );
}

function LoginInner() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/expert/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Aanvraag mislukt");
      } else {
        setSent(true);
      }
    } catch {
      setErr("Kon geen verbinding maken.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">← LesCoach</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Expert-profiel</h1>
          <p className="text-sm text-slate-600 mt-1">Beheer je beschikbaarheid en specialisaties</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <ErrorBanner />
          {sent ? (
            <div className="text-sm text-slate-700 space-y-3">
              <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg">
                Als dit e-mailadres bij ons bekend is, staat er binnen een minuut een inloglink in je inbox. De link is 15 minuten geldig.
              </div>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                Ander e-mailadres proberen
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">E-mailadres</label>
              <input
                required
                type="email"
                placeholder="jij@voorbeeld.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {err && <div className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{err}</div>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {busy ? "Versturen…" : "Stuur inloglink"}
              </button>
            </form>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-500 text-center">
          Nog geen expert-account? Neem contact op via <a href="mailto:hallo@lescoach.nl" className="text-blue-600 hover:underline">hallo@lescoach.nl</a>.
        </p>
      </div>
    </div>
  );
}

export default function ExpertLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Laden…</div>}>
      <LoginInner />
    </Suspense>
  );
}
