"use client";

import { useEffect, useMemo, useState } from "react";

interface Gesprek {
  id: string;
  datum: string;
  zoekterm: string;
  categorie: string;
  kenniskaartTitels: string;
  primaryKaart: string;
  samenvatting: string;
  tokensIn: number;
  tokensOut: number;
  schoolIds: string[];
  leraarIds: string[];
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GesprekkenPage() {
  const [gesprekken, setGesprekken] = useState<Gesprek[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<Gesprek | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/beheer/gesprekken?limit=200");
        if (!res.ok) throw new Error("Kon gesprekken niet laden");
        const data = await res.json();
        setGesprekken(data.gesprekken || []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Onbekende fout");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorien = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of gesprekken) {
      if (!g.categorie) continue;
      map.set(g.categorie, (map.get(g.categorie) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [gesprekken]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return gesprekken.filter((g) => {
      if (cat && g.categorie !== cat) return false;
      if (!needle) return true;
      const hay = [g.zoekterm, g.categorie, g.primaryKaart, g.kenniskaartTitels, g.samenvatting]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [gesprekken, q, cat]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Gesprekken</h1>
          <p className="text-sm text-slate-500 mt-1">
            Log van afgeronde Noor-gesprekken. Geen persoonsgegevens van leerlingen — alleen
            zoekterm, categorie en gebruikte kenniskaarten.
          </p>
        </div>
        <div className="text-xs text-slate-400 shrink-0">
          {loading ? "" : `${filtered.length} van ${gesprekken.length}`}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zoek op zoekterm, kaart…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle categorieën</option>
          {categorien.map(([c, n]) => (
            <option key={c} value={c}>
              {c} ({n})
            </option>
          ))}
        </select>
        {(q || cat) && (
          <button
            onClick={() => {
              setQ("");
              setCat("");
            }}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
          >
            Reset
          </button>
        )}
      </div>

      {err ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-400 py-12 text-center">Laden…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-500">Geen gesprekken gevonden.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">Datum</th>
                <th className="px-4 py-3 font-medium">Zoekterm</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Categorie</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Primary kaart</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell text-right">Tokens</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => setOpen(g)}
                >
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {fmtDate(g.datum)}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium max-w-xs truncate">
                    {g.zoekterm || "—"}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {g.categorie ? (
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                        {g.categorie}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden lg:table-cell max-w-[240px] truncate">
                    {g.primaryKaart || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell text-right tabular-nums">
                    {(g.tokensIn + g.tokensOut).toLocaleString("nl-NL")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-blue-600 hover:underline">Details →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
              <div className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                  {fmtDate(open.datum)}
                </div>
                <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                  {open.zoekterm || "Gesprek"}
                </h2>
              </div>
              <button
                onClick={() => setOpen(null)}
                className="text-slate-400 hover:text-slate-700 shrink-0"
                aria-label="Sluiten"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-slate-700">
              {open.categorie ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Categorie
                  </div>
                  <span className="inline-block text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                    {open.categorie}
                  </span>
                </div>
              ) : null}
              {open.primaryKaart ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Primaire kaart
                  </div>
                  <p>{open.primaryKaart}</p>
                </div>
              ) : null}
              {open.kenniskaartTitels ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Alle kaarten
                  </div>
                  <p className="text-slate-600">{open.kenniskaartTitels}</p>
                </div>
              ) : null}
              {open.samenvatting ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Samenvatting
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{open.samenvatting}</p>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div>
                  <div className="uppercase tracking-wider font-semibold mb-0.5">Tokens in</div>
                  <div className="tabular-nums text-slate-700">
                    {open.tokensIn.toLocaleString("nl-NL")}
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wider font-semibold mb-0.5">Tokens uit</div>
                  <div className="tabular-nums text-slate-700">
                    {open.tokensOut.toLocaleString("nl-NL")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
