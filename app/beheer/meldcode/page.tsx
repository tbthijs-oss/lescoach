"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "Nieuw" | "Beoordeeld" | "Doorverwezen" | "Geen actie";

interface Signaal {
  id: string;
  datum: string;
  signaalTekst: string;
  samenvatting: string;
  status: Status;
  beoordeeldDoor: string;
  beoordelingsNotitie: string;
  leraarId: string | null;
  schoolId: string | null;
  gesprekId: string | null;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<Status, { cls: string; label: string }> = {
  Nieuw: { cls: "bg-red-100 text-red-700 border-red-200", label: "Nieuw" },
  Beoordeeld: { cls: "bg-blue-100 text-blue-700 border-blue-200", label: "Beoordeeld" },
  Doorverwezen: { cls: "bg-violet-100 text-violet-700 border-violet-200", label: "Doorverwezen" },
  "Geen actie": { cls: "bg-slate-100 text-slate-600 border-slate-200", label: "Geen actie" },
};

export default function MeldcodePage() {
  const [signalen, setSignalen] = useState<Signaal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<Signaal | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beheer/meldcode");
      if (!res.ok) throw new Error("Kon signalen niet laden");
      const data = await res.json();
      setSignalen(data.signalen || []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      Nieuw: 0,
      Beoordeeld: 0,
      Doorverwezen: 0,
      "Geen actie": 0,
    };
    for (const s of signalen) c[s.status]++;
    return c;
  }, [signalen]);

  const filtered = useMemo(() => {
    if (!statusFilter) return signalen;
    return signalen.filter((s) => s.status === statusFilter);
  }, [signalen, statusFilter]);

  async function updateStatus(signaal: Signaal, newStatus: Status, notitie?: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/beheer/meldcode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: signaal.id,
          status: newStatus,
          beoordelingsNotitie: notitie ?? signaal.beoordelingsNotitie,
          beoordeeldDoor: "LesCoach-beheer",
        }),
      });
      if (!res.ok) throw new Error("Kon niet bijwerken");
      await load();
      setOpen((o) => (o && o.id === signaal.id ? { ...o, status: newStatus, beoordelingsNotitie: notitie ?? o.beoordelingsNotitie } : o));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-semibold text-slate-900">Meldcode-signalen</h1>
          {counts.Nieuw > 0 ? (
            <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">
              {counts.Nieuw} nieuw
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">
          Signalen die Noor heeft gedetecteerd tijdens gesprekken — bijv. mogelijke kindermishandeling
          of acute onveiligheid. Beoordeel elk signaal en markeer het met de juiste vervolgactie.
        </p>
      </div>

      {/* Status tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 inline-flex gap-1 flex-wrap">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === "" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Alles ({signalen.length})
        </button>
        {(["Nieuw", "Beoordeeld", "Doorverwezen", "Geen actie"] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
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
          <p className="text-sm text-slate-500">
            {statusFilter
              ? `Geen signalen met status "${statusFilter}".`
              : "Geen meldcode-signalen."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const style = STATUS_STYLES[s.status];
            return (
              <button
                key={s.id}
                onClick={() => setOpen(s)}
                className={`w-full text-left bg-white border rounded-2xl p-5 hover:shadow-sm transition-all ${
                  s.status === "Nieuw" ? "border-red-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      s.status === "Nieuw" ? "bg-red-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${style.cls}`}
                      >
                        {style.label}
                      </span>
                      <span className="text-xs text-slate-400">{fmtDate(s.datum)}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-2">
                      {s.samenvatting || s.signaalTekst || "—"}
                    </p>
                    {s.beoordelingsNotitie ? (
                      <p className="text-xs text-slate-500 mt-1.5 italic line-clamp-1">
                        Notitie: {s.beoordelingsNotitie}
                      </p>
                    ) : null}
                  </div>
                  <svg className="w-4 h-4 text-slate-300 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
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
              <div>
                <span
                  className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border mb-2 ${STATUS_STYLES[open.status].cls}`}
                >
                  {STATUS_STYLES[open.status].label}
                </span>
                <h2 className="text-lg font-semibold text-slate-900">Meldcode-signaal</h2>
                <p className="text-xs text-slate-500 mt-0.5">{fmtDate(open.datum)}</p>
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
            <div className="px-6 py-5 space-y-4 text-sm">
              {open.samenvatting ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Samenvatting
                  </div>
                  <p className="text-slate-700 leading-relaxed">{open.samenvatting}</p>
                </div>
              ) : null}
              {open.signaalTekst ? (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Signaaltekst (uit gesprek)
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                    {open.signaalTekst}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                  Beoordelingsnotitie
                </label>
                <textarea
                  defaultValue={open.beoordelingsNotitie}
                  onBlur={(e) => {
                    if (e.target.value !== open.beoordelingsNotitie) {
                      updateStatus(open, open.status, e.target.value);
                    }
                  }}
                  rows={3}
                  placeholder="Wat is er met dit signaal gedaan? (opgeslagen bij blur)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Markeer als
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["Beoordeeld", "Doorverwezen", "Geen actie", "Nieuw"] as Status[]).map((s) => (
                    <button
                      key={s}
                      disabled={saving || open.status === s}
                      onClick={() => updateStatus(open, s)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        open.status === s
                          ? `${STATUS_STYLES[s].cls} ring-2 ring-offset-1 ring-slate-300 cursor-default`
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {STATUS_STYLES[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 leading-relaxed">
                <strong>Veilig Thuis:</strong> 0800-2000 (24/7, gratis). Bij acute onveiligheid
                altijd direct doorverwijzen naar de IB-er of vertrouwenspersoon op school.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
