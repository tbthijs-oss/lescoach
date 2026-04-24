"use client";

import { useEffect, useMemo, useState } from "react";

interface Kenniskaart {
  id: string;
  titel: string;
  categorie: string;
  samenvatting: string;
  watIsHet: string;
  gevolgen: string;
  tips: string;
  trefwoorden: string[];
  pdfUrl: string;
  bronUrl: string;
}

export default function KenniskaartenPage() {
  const [kaarten, setKaarten] = useState<Kenniskaart[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("");
  const [open, setOpen] = useState<Kenniskaart | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/beheer/kenniskaarten");
        if (!res.ok) throw new Error("Kon niet laden");
        const data = await res.json();
        setKaarten(data.kenniskaarten || []);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Onbekende fout");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categorien = useMemo(() => {
    const map = new Map<string, number>();
    for (const k of kaarten) {
      const c = k.categorie || "Onbekend";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kaarten]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return kaarten.filter((k) => {
      if (cat && (k.categorie || "Onbekend") !== cat) return false;
      if (!needle) return true;
      const hay = [
        k.titel,
        k.categorie,
        k.samenvatting,
        k.watIsHet,
        k.gevolgen,
        k.tips,
        ...(k.trefwoorden || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [kaarten, q, cat]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kenniskaarten</h1>
          <p className="text-sm text-slate-500 mt-1">
            Alle kenniskaarten uit Airtable — read-only overzicht.{" "}
            <a
              href="https://airtable.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-700"
            >
              Bewerk in Airtable
            </a>
            .
          </p>
        </div>
        <div className="text-xs text-slate-400 shrink-0">
          {loading ? "" : `${filtered.length} van ${kaarten.length}`}
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
            placeholder="Zoek op titel, samenvatting, trefwoord…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle categorieën ({kaarten.length})</option>
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
        <div className="text-sm text-slate-400 py-12 text-center">Kenniskaarten laden…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-500">Geen kenniskaarten gevonden met deze filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((k) => (
            <button
              key={k.id}
              onClick={() => setOpen(k)}
              className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                {k.categorie ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {k.categorie}
                  </span>
                ) : (
                  <span />
                )}
                {k.pdfUrl ? (
                  <span className="text-[10px] text-slate-400">PDF</span>
                ) : null}
              </div>
              <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                {k.titel || "Naamloos"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                {k.samenvatting || k.watIsHet || "—"}
              </p>
              {k.trefwoorden && k.trefwoorden.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-3">
                  {k.trefwoorden.slice(0, 4).map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                  {k.trefwoorden.length > 4 ? (
                    <span className="text-[10px] text-slate-400">
                      +{k.trefwoorden.length - 4}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {open ? (
        <div
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white">
              <div className="min-w-0">
                {open.categorie ? (
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 inline-block px-2 py-0.5 rounded-full mb-1.5">
                    {open.categorie}
                  </div>
                ) : null}
                <h2 className="text-lg font-semibold text-slate-900 leading-tight">
                  {open.titel}
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
            <div className="px-6 py-5 space-y-5 text-sm text-slate-700 leading-relaxed">
              {open.samenvatting ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Samenvatting
                  </div>
                  <p>{open.samenvatting}</p>
                </div>
              ) : null}
              {open.watIsHet ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Wat is het?
                  </div>
                  <p className="whitespace-pre-wrap">{open.watIsHet}</p>
                </div>
              ) : null}
              {open.gevolgen ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Gevolgen voor schoolvaardigheden
                  </div>
                  <p className="whitespace-pre-wrap">{open.gevolgen}</p>
                </div>
              ) : null}
              {open.tips ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Tips voor begeleiding
                  </div>
                  <p className="whitespace-pre-wrap">{open.tips}</p>
                </div>
              ) : null}
              {open.trefwoorden && open.trefwoorden.length > 0 ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Trefwoorden
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {open.trefwoorden.map((t, i) => (
                      <span
                        key={i}
                        className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {(open.pdfUrl || open.bronUrl) && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs">
                  {open.pdfUrl ? (
                    <a
                      href={open.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      PDF openen →
                    </a>
                  ) : null}
                  {open.bronUrl ? (
                    <a
                      href={open.bronUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Bronpagina →
                    </a>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
