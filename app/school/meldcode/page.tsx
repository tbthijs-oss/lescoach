"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MeldcodeSignaal {
  id: string;
  datum: string;
  signaalTekst: string;
  samenvatting: string;
  status: "Nieuw" | "Beoordeeld" | "Doorverwezen" | "Geen actie";
  beoordeeldDoor: string;
  beoordelingsNotitie: string;
  leraarId: string | null;
  schoolId: string | null;
  gesprekId: string | null;
}

export default function MeldcodePage() {
  const [signalen, setSignalen] = useState<MeldcodeSignaal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch("/api/school/meldcode")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 403) setErr("Alleen school-admins / aandachtsfunctionarissen kunnen meldcode-signalen zien.");
          else setErr("Kon signalen niet laden.");
          return;
        }
        const data = await r.json();
        setSignalen(data.signalen || []);
      })
      .catch(() => setErr("Kon signalen niet laden."))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, patch: { status?: string; beoordeeldDoor?: string; beoordelingsNotitie?: string }) {
    await fetch(`/api/school/meldcode/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSignalen((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...(patch as Partial<MeldcodeSignaal>) } : s
      )
    );
  }

  const nieuwCount = signalen.filter((s) => s.status === "Nieuw").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/school" className="text-xs text-slate-500 hover:text-slate-900">← Terug naar schooldashboard</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Meldcode-signalen</h1>
          <p className="text-sm text-slate-600">
            Gesprekken waarin Noor mogelijke meldcode-signalen heeft gedetecteerd. Altijd zelf beoordelen volgens het protocol van de school en de officiële stappen (1 t/m 5) van de Meldcode Kindermishandeling en Huiselijk Geweld.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Voor acute crisis: <strong>Veilig Thuis 0800-2000</strong>.
          </p>
        </div>

        {err && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{err}</div>
        )}

        {loading ? (
          <div className="text-sm text-slate-400">Laden…</div>
        ) : signalen.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="text-2xl mb-2">🌱</div>
            <div className="text-sm text-slate-700 font-medium">Nog geen meldcode-signalen.</div>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
              Elk gesprek waarin Noor iets opvalt (verwaarlozing, mishandeling, onveilige thuissituatie) verschijnt hier automatisch. Er zijn er nu geen — wat goed nieuws is.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 mb-1">{nieuwCount} nieuw, {signalen.length - nieuwCount} beoordeeld.</div>
            {signalen.map((s) => {
              const open = openId === s.id;
              const kleur = s.status === "Nieuw" ? "border-red-300 bg-red-50" : "border-slate-200 bg-white";
              const badgeKleur =
                s.status === "Nieuw" ? "bg-red-100 text-red-700" :
                s.status === "Doorverwezen" ? "bg-orange-100 text-orange-700" :
                s.status === "Beoordeeld" ? "bg-green-100 text-green-700" :
                "bg-slate-100 text-slate-600";
              return (
                <div key={s.id} className={`border rounded-xl ${kleur}`}>
                  <button
                    onClick={() => setOpenId(open ? null : s.id)}
                    className="w-full text-left px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-900 font-medium line-clamp-2">{s.signaalTekst}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {s.samenvatting || "(geen samenvatting)"} · {s.datum ? new Date(s.datum).toLocaleString("nl-NL") : ""}
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeKleur}`}>
                        {s.status}
                      </span>
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                      <div>
                        <label className="text-xs text-slate-500">Status wijzigen</label>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {(["Nieuw", "Beoordeeld", "Doorverwezen", "Geen actie"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => updateStatus(s.id, { status: st })}
                              className={`text-xs px-3 py-1 rounded-full border transition-colors ${s.status === st ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Beoordeeld door</label>
                        <input
                          type="text"
                          defaultValue={s.beoordeeldDoor}
                          onBlur={(e) => e.target.value !== s.beoordeeldDoor && updateStatus(s.id, { beoordeeldDoor: e.target.value })}
                          className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                          placeholder="Naam aandachtsfunctionaris"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Notitie</label>
                        <textarea
                          defaultValue={s.beoordelingsNotitie}
                          onBlur={(e) => e.target.value !== s.beoordelingsNotitie && updateStatus(s.id, { beoordelingsNotitie: e.target.value })}
                          className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                          placeholder="Wat is de vervolgstap? Naar wie doorverwezen?"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
