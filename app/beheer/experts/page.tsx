"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

interface Expert {
  id: string;
  naam: string;
  titel: string;
  bio: string;
  specialisaties: string;
  email: string;
  telefoon: string;
  linkedin: string;
  fotoUrl: string;
  beschikbaar: boolean;
  ervaringsjaren: number;
  regio: string;
}

const EMPTY_EXPERT: Omit<Expert, "id"> = {
  naam: "",
  titel: "",
  bio: "",
  specialisaties: "",
  email: "",
  telefoon: "",
  linkedin: "",
  fotoUrl: "",
  beschikbaar: true,
  ervaringsjaren: 0,
  regio: "",
};

function parseRecord(record: AirtableRecord): Expert {
  const f = record.fields;
  return {
    id: record.id,
    naam: (f["fldlIpS7xTWze43gJ"] as string) || "",
    titel: (f["fldY7YAV7ZIsHpIu5"] as string) || "",
    bio: (f["fldBMGbBncFIp5tPn"] as string) || "",
    specialisaties: (f["fld0q7vkM7K0YfnBw"] as string) || "",
    email: (f["fld1PlJECsJv70w8G"] as string) || "",
    telefoon: (f["fldgCrSlOac82CwTB"] as string) || "",
    linkedin: (f["fldx30ctWow9T40IN"] as string) || "",
    fotoUrl: (f["fldsdq91TXomWNpWZ"] as string) || "",
    beschikbaar: (f["flduj5f58FtEHZP6k"] as boolean) === true,
    ervaringsjaren: (f["fldAX1Acb9wJu2p6F"] as number) || 0,
    regio: (f["fldaePVPISVXp943r"] as string) || "",
  };
}

// ─── Expert form modal ────────────────────────────────────────────────────────

function ExpertFormModal({
  expert,
  onSave,
  onClose,
}: {
  expert: Expert | null; // null = new
  onSave: (data: Omit<Expert, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<Expert, "id">>(expert ? { ...expert } : { ...EMPTY_EXPERT });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isNew = !expert;

  function update<K extends keyof Omit<Expert, "id">>(key: K, value: Omit<Expert, "id">[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.naam.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch {
      setError("Opslaan mislukt. Controleer de gegevens en probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold">{isNew ? "Nieuwe expert toevoegen" : `${expert.naam} bewerken`}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Naam <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={form.naam} onChange={(e) => update("naam", e.target.value)}
                placeholder="Voor- en achternaam" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Titel / Functie</label>
              <input type="text" value={form.titel} onChange={(e) => update("titel", e.target.value)}
                placeholder="bijv. Orthopedagoog GZ" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bio</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)}
              placeholder="Korte beschrijving van achtergrond en expertise…" rows={3}
              className={`${inputClass} resize-none`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Specialisaties <span className="text-slate-400 font-normal">(komma-gescheiden)</span>
            </label>
            <input type="text" value={form.specialisaties} onChange={(e) => update("specialisaties", e.target.value)}
              placeholder="bijv. ADHD, autisme, dyslexie, gedragsproblemen" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-mailadres</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="expert@email.nl" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefoonnummer</label>
              <input type="tel" value={form.telefoon} onChange={(e) => update("telefoon", e.target.value)}
                placeholder="06 12345678" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">LinkedIn URL</label>
              <input type="url" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/..." className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Foto URL</label>
              <input type="url" value={form.fotoUrl} onChange={(e) => update("fotoUrl", e.target.value)}
                placeholder="https://..." className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Regio</label>
              <input type="text" value={form.regio} onChange={(e) => update("regio", e.target.value)}
                placeholder="bijv. Utrecht" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ervaringsjaren</label>
              <input type="number" min={0} max={50} value={form.ervaringsjaren}
                onChange={(e) => update("ervaringsjaren", parseInt(e.target.value) || 0)}
                className={inputClass} />
            </div>
            <div className="flex flex-col justify-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <div
                  onClick={() => update("beschikbaar", !form.beschikbaar)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.beschikbaar ? "bg-blue-600" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.beschikbaar ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-xs font-semibold text-slate-600">Beschikbaar</span>
              </label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <button type="submit" disabled={saving || !form.naam.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-200 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
              {saving ? "Opslaan…" : isNew ? "Expert toevoegen" : "Wijzigingen opslaan"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  expert,
  onConfirm,
  onClose,
}: {
  expert: Expert;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Expert verwijderen?</h2>
        <p className="text-slate-500 text-sm mb-6">
          Weet je zeker dat je <strong>{expert.naam}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete} disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
            {deleting ? "Verwijderen…" : "Ja, verwijder"}
          </button>
          <button onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors text-sm">
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ExpertsPage() {
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpert, setEditingExpert] = useState<Expert | null | "new">(null);
  const [deletingExpert, setDeletingExpert] = useState<Expert | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const loadExperts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/beheer/experts");
      if (res.status === 401 || res.status === 302) {
        router.push("/beheer/login");
        return;
      }
      const records: AirtableRecord[] = await res.json();
      setExperts(records.map(parseRecord));
    } catch {
      showToast("Fout bij laden van experts", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadExperts();
  }, [loadExperts]);

  async function handleSave(data: Omit<Expert, "id">) {
    if (editingExpert === "new") {
      await fetch("/api/beheer/experts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      showToast("Expert toegevoegd");
    } else if (editingExpert) {
      await fetch(`/api/beheer/experts/${editingExpert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      showToast("Wijzigingen opgeslagen");
    }
    await loadExperts();
  }

  async function handleDelete() {
    if (!deletingExpert) return;
    await fetch(`/api/beheer/experts/${deletingExpert.id}`, { method: "DELETE" });
    showToast(`${deletingExpert.naam} verwijderd`);
    await loadExperts();
  }

  async function handleLogout() {
    await fetch("/api/beheer/auth", { method: "DELETE" });
    router.push("/beheer/login");
  }

  async function toggleBeschikbaar(expert: Expert) {
    await fetch(`/api/beheer/experts/${expert.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beschikbaar: !expert.beschikbaar }),
    });
    showToast(expert.beschikbaar ? `${expert.naam} op niet-beschikbaar gezet` : `${expert.naam} is nu beschikbaar`);
    await loadExperts();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modals */}
      {editingExpert !== null && (
        <ExpertFormModal
          expert={editingExpert === "new" ? null : editingExpert}
          onSave={handleSave}
          onClose={() => setEditingExpert(null)}
        />
      )}
      {deletingExpert && (
        <DeleteConfirmModal
          expert={deletingExpert}
          onConfirm={handleDelete}
          onClose={() => setDeletingExpert(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success" ? "bg-slate-800 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Expertenbeheer</h1>
          <p className="text-xs text-slate-500 mt-0.5">LesCoach — beheeromgeving</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingExpert("new")}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nieuwe expert
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Uitloggen
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : experts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-600 mb-2">Geen experts gevonden</h2>
            <p className="text-slate-400 text-sm mb-6">Voeg de eerste expert toe om te beginnen.</p>
            <button onClick={() => setEditingExpert("new")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Eerste expert toevoegen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 mb-4">{experts.length} expert{experts.length !== 1 ? "s" : ""}</p>
            {experts.map((expert) => (
              <div key={expert.id} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm hover:border-slate-300 transition-colors">
                {/* Avatar */}
                {expert.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={expert.fotoUrl} alt={expert.naam}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-700 font-bold text-lg">
                    {expert.naam[0]?.toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{expert.naam}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${expert.beschikbaar ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {expert.beschikbaar ? "Beschikbaar" : "Niet beschikbaar"}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">{expert.titel}</div>
                  {expert.specialisaties && (
                    <div className="text-xs text-slate-400 mt-1 truncate">{expert.specialisaties}</div>
                  )}
                </div>

                {/* Regio */}
                {expert.regio && (
                  <div className="hidden md:block text-xs text-slate-400 shrink-0">📍 {expert.regio}</div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleBeschikbaar(expert)}
                    title={expert.beschikbaar ? "Zet op niet-beschikbaar" : "Zet op beschikbaar"}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {expert.beschikbaar ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingExpert(expert)}
                    title="Bewerken"
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingExpert(expert)}
                    title="Verwijderen"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
