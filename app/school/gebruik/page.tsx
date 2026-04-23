"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  periodeInDagen: number;
  totaalGesprekken: number;
  actieveLeraren: number;
  totaalLeraren: number;
  perWeek: { week: string; count: number }[];
  topCategorieen: { categorie: string; count: number }[];
}

export default function GebruikPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [dagen, setDagen] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/school/gebruik?dagen=${dagen}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 403) setErr("Alleen school-admins kunnen het gebruiksoverzicht bekijken.");
          else setErr("Kon gebruiksdata niet laden.");
          setStats(null);
          return;
        }
        setStats(await res.json());
        setErr(null);
      })
      .catch(() => setErr("Kon gebruiksdata niet laden."))
      .finally(() => setLoading(false));
  }, [dagen]);

  const maxWeek = stats ? Math.max(1, ...stats.perWeek.map((w) => w.count)) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/school" className="text-xs text-slate-500 hover:text-slate-900">← Terug naar schooldashboard</Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Gebruik &amp; inzicht</h1>
            <p className="text-sm text-slate-600">Hoe jouw team LesCoach gebruikt. Alleen geaggregeerde data — geen inhoud van gesprekken.</p>
          </div>
          <select
            value={dagen}
            onChange={(e) => setDagen(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value={7}>Laatste 7 dagen</option>
            <option value={30}>Laatste 30 dagen</option>
            <option value={90}>Laatste 90 dagen</option>
            <option value={365}>Laatste jaar</option>
          </select>
        </div>

        {err && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{err}</div>}

        {loading ? (
          <div className="text-sm text-slate-400">Laden…</div>
        ) : !stats ? null : stats.totaalGesprekken === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="text-sm text-slate-600">Nog geen gesprekken in deze periode.</div>
            <p className="text-xs text-slate-400 mt-2">Zodra je leraren LesCoach gebruiken, verschijnen hier trends en categorieën.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Kpi label="Gesprekken" value={stats.totaalGesprekken} hint={`in ${stats.periodeInDagen} dagen`} />
              <Kpi label="Actieve leraren" value={stats.actieveLeraren} hint={`van ${stats.totaalLeraren} totaal`} />
              <Kpi
                label="Gem. per actieve leraar"
                value={stats.actieveLeraren ? Math.round((stats.totaalGesprekken / stats.actieveLeraren) * 10) / 10 : 0}
              />
            </div>

            {/* Per-week bars */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Gesprekken per week</h2>
              <p className="text-xs text-slate-500 mb-4">Laatste 12 weken (tot 0 voor weken zonder data).</p>
              <div className="flex items-end gap-1.5 h-32">
                {stats.perWeek.length === 0 ? (
                  <div className="text-xs text-slate-400">Nog geen wekelijkse data.</div>
                ) : (
                  stats.perWeek.map((w) => (
                    <div key={w.week} className="flex-1 flex flex-col items-center gap-1" title={`${w.week}: ${w.count}`}>
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(w.count / maxWeek) * 100}%`, minHeight: w.count > 0 ? "4px" : "0" }}
                      />
                      <div className="text-[10px] text-slate-500">{w.week.slice(-3)}</div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Top categorieen */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Meest besproken categorieën</h2>
              <p className="text-xs text-slate-500 mb-4">Waar de vragen van je team over gaan.</p>
              <div className="space-y-2">
                {stats.topCategorieen.length === 0 ? (
                  <div className="text-xs text-slate-400">Nog geen categorie-data.</div>
                ) : (
                  stats.topCategorieen.map((c) => {
                    const pct = (c.count / stats.totaalGesprekken) * 100;
                    return (
                      <div key={c.categorie} className="flex items-center gap-3">
                        <div className="w-32 text-xs text-slate-700 truncate">{c.categorie}</div>
                        <div className="flex-1 bg-slate-100 rounded h-2 overflow-hidden">
                          <div className="bg-amber-500 h-full" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-10 text-xs text-slate-500 text-right tabular-nums">{c.count}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <p className="text-xs text-slate-400 text-center pt-2">
              Geen individuele gesprekken of berichten zichtbaar — alleen geaggregeerde trends. Geen vraag is terug te herleiden naar een leerling.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}
