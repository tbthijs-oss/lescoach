"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
  scholen: { total: number; actief: number; proef: number; inactief: number };
  leraren: { total: number };
  experts: { total: number; beschikbaar: number };
  kenniskaarten: { total: number; byCategorie: Record<string, number> };
  gesprekken: {
    total: number;
    last24h: number;
    last7d: number;
    byCategorie: Record<string, number>;
  };
  meldcode: { total: number; nieuw: number; recent: number };
}

interface RecentGesprek {
  id: string;
  datum: string;
  zoekterm: string;
  categorie: string;
  primaryKaart: string;
}

function KpiCard({
  label,
  value,
  sub,
  href,
  accent = "blue",
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  href: string;
  accent?: "blue" | "emerald" | "amber" | "violet" | "red" | "slate";
  icon: React.ReactNode;
}) {
  const accentMap: Record<string, { icon: string; bg: string }> = {
    blue: { icon: "text-blue-600", bg: "bg-blue-50" },
    emerald: { icon: "text-emerald-600", bg: "bg-emerald-50" },
    amber: { icon: "text-amber-600", bg: "bg-amber-50" },
    violet: { icon: "text-violet-600", bg: "bg-violet-50" },
    red: { icon: "text-red-600", bg: "bg-red-50" },
    slate: { icon: "text-slate-600", bg: "bg-slate-100" },
  };
  const a = accentMap[accent];
  return (
    <Link
      href={href}
      className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {label}
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
            {value}
          </div>
          {sub ? (
            <div className="mt-0.5 text-xs text-slate-500 truncate">{sub}</div>
          ) : null}
        </div>
        <div
          className={`w-9 h-9 rounded-xl ${a.bg} ${a.icon} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>
    </Link>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function relDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} u geleden`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd} d geleden`;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentGesprek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, g] = await Promise.all([
          fetch("/api/beheer/stats").then((r) => (r.ok ? r.json() : null)),
          fetch("/api/beheer/gesprekken?limit=6").then((r) => (r.ok ? r.json() : null)),
        ]);
        if (s) setStats(s);
        if (g?.gesprekken) setRecent(g.gesprekken);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const topCategorien = stats
    ? Object.entries(stats.gesprekken.byCategorie)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const topKaartCategorien = stats
    ? Object.entries(stats.kenniskaarten.byCategorie)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overzicht van LesCoach — scholen, content en activiteit.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label="Scholen"
          value={loading ? "—" : stats?.scholen.total ?? 0}
          sub={
            stats
              ? `${stats.scholen.actief} actief · ${stats.scholen.proef} proef`
              : ""
          }
          href="/beheer/scholen"
          accent="blue"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          }
        />
        <KpiCard
          label="Leraren"
          value={loading ? "—" : stats?.leraren.total ?? 0}
          sub="Totaal gekoppeld"
          href="/beheer/scholen"
          accent="slate"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Experts"
          value={loading ? "—" : stats?.experts.total ?? 0}
          sub={
            stats ? `${stats.experts.beschikbaar} beschikbaar` : ""
          }
          href="/beheer/experts"
          accent="violet"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <KpiCard
          label="Kenniskaarten"
          value={loading ? "—" : stats?.kenniskaarten.total ?? 0}
          sub={
            stats
              ? `${Object.keys(stats.kenniskaarten.byCategorie).length} categorieën`
              : ""
          }
          href="/beheer/kenniskaarten"
          accent="emerald"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <KpiCard
          label="Gesprekken (7d)"
          value={loading ? "—" : stats?.gesprekken.last7d ?? 0}
          sub={
            stats
              ? `${stats.gesprekken.last24h} laatste 24u · ${stats.gesprekken.total} totaal`
              : ""
          }
          href="/beheer/gesprekken"
          accent="amber"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <KpiCard
          label="Meldcode nieuw"
          value={loading ? "—" : stats?.meldcode.nieuw ?? 0}
          sub={
            stats
              ? `${stats.meldcode.recent} afgelopen 7d · ${stats.meldcode.total} totaal`
              : ""
          }
          href="/beheer/meldcode"
          accent="red"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          }
        />
      </div>

      {/* Alert row: meldcode nieuw */}
      {stats && stats.meldcode.nieuw > 0 ? (
        <Link
          href="/beheer/meldcode"
          className="block bg-red-50 border border-red-200 rounded-2xl px-5 py-4 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-red-900">
                {stats.meldcode.nieuw} nieuw meldcode-signaal
                {stats.meldcode.nieuw > 1 ? "en vragen" : " vraagt"} om beoordeling
              </div>
              <div className="text-sm text-red-700 mt-0.5">
                Bekijk en markeer als beoordeeld, doorverwezen of geen actie.
              </div>
            </div>
            <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      ) : null}

      {/* Two-column: recent gesprekken + top categorieën */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section
            title="Recente gesprekken"
            action={
              <Link
                href="/beheer/gesprekken"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Alles bekijken →
              </Link>
            }
          >
            {loading ? (
              <div className="p-8 text-sm text-slate-400 text-center">Laden…</div>
            ) : recent.length === 0 ? (
              <div className="p-8 text-sm text-slate-500 text-center">
                Nog geen gesprekken gelogd.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((g) => (
                  <li key={g.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">
                        {g.zoekterm || g.primaryKaart || "Gesprek"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {g.categorie ? `${g.categorie} · ` : ""}
                        {g.primaryKaart || "—"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      {relDate(g.datum)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Populaire categorieën (gesprekken)">
            {loading || topCategorien.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">—</div>
            ) : (
              <ul className="p-2">
                {topCategorien.map(([cat, n]) => {
                  const max = topCategorien[0][1] || 1;
                  const pct = Math.max(4, Math.round((n / max) * 100));
                  return (
                    <li key={cat} className="px-3 py-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate text-slate-700">{cat}</span>
                        <span className="text-xs font-medium text-slate-500 tabular-nums">
                          {n}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title="Kenniskaarten per categorie">
            {loading || topKaartCategorien.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">—</div>
            ) : (
              <ul className="p-2">
                {topKaartCategorien.map(([cat, n]) => {
                  const max = topKaartCategorien[0][1] || 1;
                  const pct = Math.max(4, Math.round((n / max) * 100));
                  return (
                    <li key={cat} className="px-3 py-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate text-slate-700">{cat}</span>
                        <span className="text-xs font-medium text-slate-500 tabular-nums">
                          {n}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* Quick actions */}
      <Section title="Snelle acties">
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/beheer/scholen"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-sm font-medium text-slate-700">School toevoegen</div>
          </Link>
          <Link
            href="/beheer/experts"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
          >
            <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-sm font-medium text-slate-700">Expert toevoegen</div>
          </Link>
          <a
            href="/api/beheer/als-founder"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="text-sm font-medium text-slate-700">Chat openen als founder</div>
          </a>
          <Link
            href="/beheer/juridisch"
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
          >
            <div className="w-8 h-8 bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <div className="text-sm font-medium text-slate-700">Juridische regels</div>
          </Link>
        </div>
      </Section>
    </div>
  );
}
