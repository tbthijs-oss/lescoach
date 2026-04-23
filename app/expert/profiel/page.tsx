"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  taal: string;
}

export default function ExpertProfielPage() {
  const router = useRouter();
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/expert/profiel")
      .then(async (res) => {
        if (res.status === 401) { router.replace("/expert/login"); return; }
        const data = await res.json();
        if (data.expert) setExpert(data.expert);
        setLoading(false);
      })
      .catch(() => { setErr("Kon profiel niet laden."); setLoading(false); });
  }, [router]);

  async function save(patch: Partial<Expert>) {
    if (!expert) return;
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/expert/profiel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Opslaan mislukt");
      } else {
        setExpert(data.expert);
        setSavedAt(Date.now());
      }
    } catch {
      setErr("Kon geen verbinding maken.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/expert/auth/logout", { method: "POST" });
    router.replace("/expert/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Laden…</div>
    );
  }
  if (!expert) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Geen profiel gevonden.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-900">← LesCoach</Link>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Mijn expert-profiel</h1>
            <p className="text-sm text-slate-600">Zo zien leerkrachten jou terug in de chat.</p>
          </div>
          <button
            onClick={logout}
            className="text-xs text-slate-500 hover:text-slate-900 border border-slate-200 px-3 py-1.5 rounded-lg"
          >
            Uitloggen
          </button>
        </div>

        {err && <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{err}</div>}

        {/* Beschikbaarheid */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">Beschikbaarheid</h2>
          <p className="text-xs text-slate-500 mb-3">
            Zet uit als je even geen aanvragen wilt ontvangen (vakantie, druk). Leerkrachten zien je dan niet in de chat.
          </p>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button
              onClick={() => save({ beschikbaar: !expert.beschikbaar })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${expert.beschikbaar ? "bg-green-500" : "bg-slate-300"}`}
              disabled={saving}
              aria-pressed={expert.beschikbaar}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${expert.beschikbaar ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-sm text-slate-700">
              {expert.beschikbaar ? "Beschikbaar — ik sta zichtbaar" : "Niet beschikbaar — ik sta verborgen"}
            </span>
          </label>
        </section>

        {/* Basis */}
        <Section title="Over jou" description="Deze info ziet de leerkracht in de chat.">
          <Field label="Naam" value={expert.naam} onSave={(v) => save({ naam: v })} saving={saving} />
          <Field label="Titel / functie" value={expert.titel} onSave={(v) => save({ titel: v })} saving={saving} placeholder="Bv. Orthopedagoog SBO" />
          <Field
            label="Bio"
            value={expert.bio}
            onSave={(v) => save({ bio: v })}
            saving={saving}
            multiline
            placeholder="Korte intro: achtergrond, aanpak, waar je blij van wordt."
          />
        </Section>

        <Section title="Expertise" description="Gebruik komma-gescheiden trefwoorden — Noor matcht hierop.">
          <Field
            label="Specialisaties"
            value={expert.specialisaties}
            onSave={(v) => save({ specialisaties: v })}
            saving={saving}
            multiline
            placeholder="autisme, prikkelverwerking, gedragsproblemen, trauma"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ervaringsjaren" value={String(expert.ervaringsjaren || 0)} onSave={(v) => save({ ervaringsjaren: Number(v) || 0 })} saving={saving} />
            <Field label="Regio" value={expert.regio} onSave={(v) => save({ regio: v })} saving={saving} placeholder="Utrecht / landelijk" />
          </div>
          <Field label="Taal" value={expert.taal} onSave={(v) => save({ taal: v })} saving={saving} placeholder="Nederlands, Engels" />
        </Section>

        <Section title="Contact" description="Alleen zichtbaar nadat de leerkracht contact met je zoekt.">
          <div className="text-xs text-slate-500 mb-1">E-mail (niet te wijzigen — hiermee log je in)</div>
          <div className="text-sm text-slate-700 mb-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            {expert.email}
          </div>
          <Field label="Telefoon" value={expert.telefoon} onSave={(v) => save({ telefoon: v })} saving={saving} />
          <Field label="LinkedIn" value={expert.linkedin} onSave={(v) => save({ linkedin: v })} saving={saving} placeholder="https://linkedin.com/in/..." />
          <Field label="Foto URL" value={expert.fotoUrl} onSave={(v) => save({ fotoUrl: v })} saving={saving} placeholder="https://..." />
        </Section>

        {savedAt && Date.now() - savedAt < 3000 && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            Opgeslagen
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label, value, onSave, saving, multiline, placeholder,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
  saving: boolean;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(value);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setLocal(value); setDirty(false); }, [value]);
  const Input = multiline ? "textarea" : "input";
  return (
    <div>
      <label className="text-xs font-medium text-slate-700 block mb-1">{label}</label>
      <Input
        value={local}
        placeholder={placeholder}
        onChange={(e) => { setLocal(e.target.value); setDirty(e.target.value !== value); }}
        onBlur={() => { if (dirty) { onSave(local); } }}
        rows={multiline ? 4 : undefined}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={saving}
      />
      {dirty && <div className="text-[11px] text-slate-400 mt-0.5">Opslaan bij verlaten van het veld…</div>}
    </div>
  );
}
