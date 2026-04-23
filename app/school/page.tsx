"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Leraar {
  id: string;
  email: string;
  naam: string;
  rol: "admin" | "leraar";
  status: "uitgenodigd" | "actief" | "geblokkeerd";
  laatsteLogin?: string;
  uitgenodigdOp?: string;
}

interface Me {
  authenticated: boolean;
  leraar?: { id: string; naam: string; email: string; rol: "admin" | "leraar" };
  school?: { id: string; schoolnaam: string; status: string };
}

function StatusBadge({ status }: { status: Leraar["status"] }) {
  const map: Record<Leraar["status"], { label: string; cls: string }> = {
    uitgenodigd: { label: "Uitgenodigd", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    actief: { label: "Actief", cls: "bg-green-50 text-green-700 border-green-200" },
    geblokkeerd: { label: "Geblokkeerd", cls: "bg-red-50 text-red-700 border-red-200" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

function InviteForm({ onInvited }: { onInvited: () => void }) {
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<"admin" | "leraar">("leraar");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMsg(null);
    try {
      const res = await fetch("/api/beheer/leraren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naam, email, rol }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Uitnodigen mislukt");
      } else {
        setMsg(`${naam} is uitgenodigd. Er is een loginlink verstuurd naar ${email}.`);
        setNaam(""); setEmail(""); setRol("leraar");
        onInvited();
      }
    } catch {
      setErr("Kon geen verbinding maken.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        <h3 className="text-sm font-semibold text-slate-900">Leraar uitnodigen</h3>
      </div>
      {err ? <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{err}</div> : null}
      {msg ? <div className="bg-green-50 border border-green-200 text-green-800 text-xs px-3 py-2 rounded-lg">{msg}</div> : null}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
        <input
          required
          placeholder="Volledige naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          required
          type="email"
          placeholder="naam@school.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value as "admin" | "leraar")}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="leraar">Leraar</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
        >
          {busy ? "Bezig…" : "Uitnodigen"}
        </button>
      </div>
      <p className="text-xs text-slate-500">
        De leraar ontvangt direct een e-mail met een eenmalige loginlink. Admins kunnen zelf andere
        leraren uitnodigen; leraren kunnen alleen met Noor chatten.
      </p>
    </form>
  );
}


function OnboardingChecklist({
  lerarenCount,
  invitedCount,
  gesprekkenCount,
}: {
  lerarenCount: number;
  invitedCount: number;
  gesprekkenCount: number;
}) {
  const items = [
    {
      done: lerarenCount > 0,
      label: "Eerste leraar toegevoegd",
      hint: "Nodig hieronder je eerste leraar uit.",
    },
    {
      done: invitedCount > 0,
      label: "Eerste uitnodiging verstuurd",
      hint: "De leraar ontvangt een eenmalige loginlink per e-mail.",
    },
    {
      done: gesprekkenCount > 0,
      label: "Eerste gesprek met Noor gevoerd",
      hint: "Zodra een leraar een gesprek start, zie je gebruik op /school/gebruik.",
    },
  ];

  const allDone = items.every((i) => i.done);
  if (allDone) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-amber-50 border border-blue-100 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">Aan de slag met LesCoach</div>
          <div className="text-xs text-slate-600 mt-0.5">
            {doneCount} van {items.length} stappen klaar — deze checklist verdwijnt als alles is afgerond.
          </div>
        </div>
        <div className="text-2xl" aria-hidden>🌱</div>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 rounded-xl px-3 py-2 ${
              item.done ? "bg-white/60" : "bg-white"
            } border border-white`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                item.done
                  ? "bg-green-500 text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}
              aria-hidden
            >
              {item.done ? (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-xs">{i + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <div
                className={`text-sm ${
                  item.done ? "text-slate-500 line-through" : "text-slate-900 font-medium"
                }`}
              >
                {item.label}
              </div>
              {!item.done ? (
                <div className="text-xs text-slate-500 mt-0.5">{item.hint}</div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SchoolDashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [leraren, setLeraren] = useState<Leraar[]>([]);
  const [gesprekkenCount, setGesprekkenCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const meData: Me = await meRes.json();
      setMe(meData);

      if (meData.leraar?.rol !== "admin") {
        // Niet-admin: terug naar chat
        router.push("/chat");
        return;
      }

      const lerarenRes = await fetch("/api/beheer/leraren");
      if (!lerarenRes.ok) throw new Error("Kon leraren niet laden");
      const data = await lerarenRes.json();
      setLeraren(data.leraren || []);

      // Haal aantal gesprekken op (lichtgewicht — alleen totaal)
      try {
        const gebruikRes = await fetch("/api/school/gebruik?dagen=365");
        if (gebruikRes.ok) {
          const gebruikData = await gebruikRes.json();
          setGesprekkenCount(gebruikData.totaalGesprekken || 0);
        }
      } catch {
        // stille fallback — checklist kan nog steeds functioneren
      }

      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function resendInvite(l: Leraar) {
    const res = await fetch(`/api/beheer/leraren/${l.id}`, { method: "POST" });
    if (res.ok) alert(`Nieuwe loginlink verstuurd naar ${l.email}.`);
    else alert("Versturen mislukt.");
  }

  async function toggleStatus(l: Leraar) {
    const next = l.status === "geblokkeerd" ? "actief" : "geblokkeerd";
    const res = await fetch(`/api/beheer/leraren/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) loadAll();
  }

  async function removeLeraar(l: Leraar) {
    if (!confirm(`Weet je zeker dat je ${l.naam} wilt verwijderen?`)) return;
    const res = await fetch(`/api/beheer/leraren/${l.id}`, { method: "DELETE" });
    if (res.ok) loadAll();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) return <div className="p-10 text-sm text-slate-500">Laden…</div>;
  if (!me?.school) return <div className="p-10 text-sm text-slate-500">Geen school gekoppeld.</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm0 0v-7.5" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-sm">{me.school.schoolnaam}</div>
            <div className="text-xs text-slate-500">Schoolbeheer — {me.leraar?.naam}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/school/gebruik" className="text-xs text-slate-600 hover:text-blue-600 hover:underline">Gebruik</Link>
          <Link href="/chat" className="text-xs text-blue-600 hover:underline">Naar Noor →</Link>
          <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">
            Uitloggen
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leraren</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nodig leraren uit op hun schoolmailadres. Ze ontvangen een eenmalige loginlink.
          </p>
        </div>

        <OnboardingChecklist
          lerarenCount={leraren.length}
          invitedCount={leraren.filter((l) => l.status === "uitgenodigd" || l.status === "actief").length}
          gesprekkenCount={gesprekkenCount}
        />

        <InviteForm onInvited={loadAll} />

        {err ? (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{err}</div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {leraren.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Nog geen leraren uitgenodigd.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Naam</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Laatste login</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leraren.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{l.naam}</div>
                      <div className="text-xs text-slate-500">{l.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${l.rol === "admin" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                        {l.rol === "admin" ? "Admin" : "Leraar"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {l.laatsteLogin ? new Date(l.laatsteLogin).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => resendInvite(l)} className="text-xs text-blue-600 hover:underline mr-3">Link opnieuw</button>
                      <button onClick={() => toggleStatus(l)} className="text-xs text-amber-700 hover:underline mr-3">
                        {l.status === "geblokkeerd" ? "Heractiveren" : "Blokkeren"}
                      </button>
                      {l.id !== me.leraar?.id ? (
                        <button onClick={() => removeLeraar(l)} className="text-xs text-red-600 hover:underline">Verwijderen</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
