"use client";

import { useState, useEffect } from "react";

export default function ToegangsPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/beheer/toegang")
      .then((r) => r.json())
      .then((d) => setPassword(d.adminPassword));
  }, []);

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Toegang & wachtwoord</h1>
      <p className="text-sm text-slate-500 mb-8">
        Inloggegevens voor de LesCoach beheeromgeving. Deel deze alleen met vertrouwde personen.
      </p>

      {/* Login URL */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Beheer-URL
        </h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 font-mono">
            lescoach.nl/beheer
          </code>
          <button
            onClick={() => copyToClipboard("https://lescoach.nl/beheer")}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg transition-colors font-medium"
          >
            {copied ? "✓ Gekopieerd" : "Kopieer"}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Wachtwoord
        </h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 font-mono tracking-widest">
            {password === null
              ? "laden…"
              : revealed
              ? password
              : "•".repeat(Math.min(password.length, 16))}
          </code>
          <button
            onClick={() => setRevealed(!revealed)}
            className="shrink-0 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg transition-colors font-medium"
          >
            {revealed ? "Verberg" : "Toon"}
          </button>
          {revealed && password && (
            <button
              onClick={() => copyToClipboard(password)}
              className="shrink-0 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2.5 rounded-lg transition-colors font-medium"
            >
              {copied ? "✓ Gekopieerd" : "Kopieer"}
            </button>
          )}
        </div>
      </div>

      {/* How to change */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-4">
        <h2 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Wachtwoord wijzigen
        </h2>
        <p className="text-sm text-amber-700 leading-relaxed mb-3">
          Het wachtwoord staat opgeslagen als omgevingsvariabele in Vercel. Om het te wijzigen:
        </p>
        <ol className="text-sm text-amber-700 space-y-1.5">
          <li className="flex gap-2">
            <span className="font-bold shrink-0">1.</span>
            Ga naar <a href="https://vercel.com/my-true-doshas-projects/lescoach/settings/environment-variables" target="_blank" rel="noopener noreferrer" className="underline font-medium">Vercel → lescoach → Settings → Environment Variables</a>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">2.</span>
            Zoek de variabele <code className="bg-amber-100 px-1 rounded font-mono text-xs">ADMIN_PASSWORD</code>
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">3.</span>
            Klik op bewerken en sla het nieuwe wachtwoord op
          </li>
          <li className="flex gap-2">
            <span className="font-bold shrink-0">4.</span>
            Herstart de deployment via Vercel (of push een nieuwe commit)
          </li>
        </ol>
      </div>

      {/* Who has access */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Wie heeft toegang?</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-3">
          Iedereen met dit wachtwoord kan de beheeromgeving inloggen. Er is momenteel één gedeeld wachtwoord voor de hele beheeromgeving. Rol-gebaseerde toegang (RBAC) per gebruiker is gepland voor de volgende fase.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">Experts beheren</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">Juridische regels inzien</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">Wachtwoord inzien</span>
        </div>
      </div>
    </div>
  );
}
