"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface School {
  id: string;
  schoolnaam: string;
  contactpersoon: string;
  contactEmail: string;
  status: "proef" | "actief" | "inactief";
  abonnementStart?: string;
  abonnementEind?: string;
  notities?: string;
  aangemaaktOp?: string;
  lerarenAantal?: number;
}

const EMPTY: Omit<School, "id"> = {
  schoolnaam: "",
  contactpersoon: "",
  contactEmail: "",
  status: "proef",
  notities: "",
};

function StatusBadge({ status }: { status: School["status"] }) {
  const map: Record<School["status"], { label: string; cls: string }> = {
    proef: { label: "Proef", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    actief: { label: "Actief", cls: "bg-green-50 text-green-700 border-green-200" },
    inactief: { label: "Inactief", cls: "bg-slate-100 text-slate-500 border-slate-200" },
  };
  const { label, cls } = map[status];
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{label}</span>;
}

function SchoolFormModal({
  school,
  onClose,
  onSaved,
}: {
  school: School | "new" | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<Omit<School, "id">>(EMPTY);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminNaam, setAdminNaam] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (school && school !== "new") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData({
        schoolnaam: school.schoolnaam,
        contactpersoon: school.contactpersoon,
        contactEmail: school.contactEmail,
        status: school.status,
        abonnementStart: school.abonnementStart,
        abonnementEind: school.abonnementEind,
        notities: school.notities,
      });
    } else {
      setData(EMPTY);
      setAdminEmail("");
      setAdminNaam("");
    }
    setErr(null);
  }, [school]);

  if (school === null) return null;
  const isNew = school === "new";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const url = isNew ? "/api/beheer/scholen" : `/api/beheer/scholen/${(school as School).id}`;
      const method = isNew ? "POST" : "PATCH";
      const body = isNew
        ? { ...data, adminEmail: adminEmail || undefined, adminNaam: adminNaam || undefined }
        : data;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Fout bij opslaan");
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Onbekende fout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isNew ? "Nieuwe school toevoegen" : "School bewerken"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {err ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{err}</div>
          ) : null}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Schoolnaam *</label>
            <input
              required
              value={data.schoolnaam}
              onChange={(e) => setData({ ...data, schoolnaam: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contactpersoon</label>
              <input
                value={data.contactpersoon}
                onChange={(e) => setData({ ...data, contactpersoon: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Contact email *</label>
              <input
                type="email"
                required
                value={data.contactEmail}
                onChange={(e) => setData({ ...data, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
              <select
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value as School["status"] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="proef">Proef</option>
                <option value="actief">Actief</option>
                <option value="inactief">Inactief</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Abonnement start</label>
              <input
                type="date"
                value={data.abonnementStart || ""}
                onChange={(e) => setData({ ...data, abonnementStart: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Abonnement eind</label>
              <input
                type="date"
                value={data.abonnementEind || ""}
                onChange={(e) => setData({ ...data, abonnementEind: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Notities</label>
            <textarea
              value={data.notities || ""}
              onChange={(e) => setData({ ...data, notities: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isNew ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-slate-700 font-medium">Eerste school-admin (optioneel)</p>
              <p className="text-xs text-slate-600">
                Vul in om direct een admin aan te maken én een magic-link te versturen. Deze persoon kan
                vervolgens zelf leraren uitnodigen.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Naam admin"
                  value={adminNaam}
                  onChange={(e) => setAdminNaam(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="admin@school.nl"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Annuleren
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
            >
              {saving ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ScholenPage() {
  const [scholen, setScholen] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<School | "new" | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | School["status"]>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beheer/scholen");
      if (!res.ok) throw new Error("Kon scholen niet laden");
      const data = await res.json();
      setScholen(data.scholen || []);
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
    const c = { actief: 0, proef: 0, inactief: 0, leraren: 0 };
    for (const s of scholen) {
      c[s.status]++;
      c.leraren += s.lerarenAantal ?? 0;
    }
    return c;
  }, [scholen]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scholen.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!needle) return true;
      const hay = [s.schoolnaam, s.contactpersoon, s.contactEmail, s.notities || ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [scholen, q, statusFilter]);

  async function handleDelete(s: School) {
    if (!confirm(`Weet je zeker dat je ${s.schoolnaam} wilt verwijderen? Leraren blijven behouden maar verliezen hun koppeling.`)) return;
    const res = await fetch(`/api/beheer/scholen/${s.id}`, { method: "DELETE" });
    if (res.ok) load();
    else alert("Verwijderen mislukt");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scholen</h1>
          <p className="text-sm text-slate-500 mt-1">
            Beheer schoolaccounts. Voor elke school kun je een admin aanmaken die zelf leraren uitnodigt.
          </p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nieuwe school
        </button>
      </div>

      {/* Stats */}
      {!loading && scholen.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-xs text-slate-500">Totaal</div>
            <div className="text-xl font-semibold text-slate-900 tabular-nums">{scholen.length}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-xs text-green-700">Actief</div>
            <div className="text-xl font-semibold text-green-700 tabular-nums">{counts.actief}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-xs text-amber-700">In proef</div>
            <div className="text-xl font-semibold text-amber-700 tabular-nums">{counts.proef}</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-xs text-slate-500">Leraren totaal</div>
            <div className="text-xl font-semibold text-slate-900 tabular-nums">{counts.leraren}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {scholen.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-5 flex flex-wrap gap-3 items-center">
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
              placeholder="Zoek school, contact, email…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle status</option>
            <option value="actief">Actief</option>
            <option value="proef">Proef</option>
            <option value="inactief">Inactief</option>
          </select>
          {(q || statusFilter !== "all") && (
            <button
              onClick={() => {
                setQ("");
                setStatusFilter("all");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {err ? (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{err}</div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-500">Laden…</div>
      ) : scholen.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-600 mb-3">Nog geen scholen aangemaakt.</p>
          <button
            onClick={() => setModal("new")}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Voeg de eerste school toe
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <p className="text-sm text-slate-500">Geen scholen gevonden met deze filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Leraren</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center shrink-0 font-semibold text-sm">
                        {(s.schoolnaam[0] || "?").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{s.schoolnaam}</div>
                        {s.notities ? (
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{s.notities}</div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{s.contactpersoon || "—"}</div>
                    <a
                      href={`mailto:${s.contactEmail}`}
                      className="text-xs text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {s.contactEmail}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-700 tabular-nums">{s.lerarenAantal ?? 0}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal(s)}
                      className="text-xs text-blue-600 hover:underline mr-3"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Verwijderen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-slate-100">
            {filtered.length} van {scholen.length} school{scholen.length !== 1 ? "en" : ""}
          </div>
        </div>
      )}

      <SchoolFormModal
        school={modal}
        onClose={() => setModal(null)}
        onSaved={load}
      />
    </div>
  );
}
