import Link from "next/link";
import { NoorAvatar } from "@/components/JeroenAvatar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expertpool — LesCoach",
  description:
    "Noor koppelt je aan de juiste specialist. Onze experts zijn ervaringsdeskundigen in het speciaal onderwijs — beschikbaar voor persoonlijk advies op maat.",
};

interface Expert {
  id: string;
  naam: string;
  titel: string;
  bio: string;
  specialisaties: string[];
  linkedin: string;
  fotoUrl: string;
  regio: string;
  ervaringsjaren: number;
}

// Seed-data — zichtbaar zolang Airtable nog leeg is.
// Vervangen door Airtable-data zodra profielen zijn ingevuld via /beheer/experts.
const SEED_EXPERTS: Expert[] = [
  {
    id: "seed-thomas",
    naam: "Thomas Thijs",
    titel: "Oprichter LesCoach",
    bio: "",
    specialisaties: ["Speciaal onderwijs", "Begeleiding leerkrachten"],
    linkedin: "https://www.linkedin.com/in/thomas-thijs/",
    fotoUrl: "",
    regio: "Nederland",
    ervaringsjaren: 0,
  },
  {
    id: "seed-joost",
    naam: "Joost Stam",
    titel: "Specialist speciaal onderwijs",
    bio: "",
    specialisaties: ["Speciaal onderwijs"],
    linkedin: "https://www.linkedin.com/in/joost-stam-b36a9013b/",
    fotoUrl: "",
    regio: "Nederland",
    ervaringsjaren: 0,
  },
  {
    id: "seed-mick",
    naam: "Mick Kitzen",
    titel: "Specialist speciaal onderwijs",
    bio: "",
    specialisaties: ["Speciaal onderwijs"],
    linkedin: "https://www.linkedin.com/in/mickkitzen/",
    fotoUrl: "",
    regio: "Nederland",
    ervaringsjaren: 0,
  },
];

async function getExperts(): Promise<Expert[]> {
  const BASE = process.env.AIRTABLE_BASE_ID;
  const TOKEN = process.env.AIRTABLE_API_TOKEN;
  if (!BASE || !TOKEN) return SEED_EXPERTS;
  try {
    const url =
      `https://api.airtable.com/v0/${BASE}/Experts` +
      `?sort[0][field]=Naam&sort[0][direction]=asc`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 300 },
    });
    if (!res.ok) return SEED_EXPERTS;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { records: any[] } = await res.json();
    if (!data.records || data.records.length === 0) return SEED_EXPERTS;
    return data.records.map((r) => {
      const f = r.fields;
      const raw = f["Specialisaties"] ?? "";
      const specialisaties: string[] = Array.isArray(raw)
        ? raw
        : typeof raw === "string" && raw.length > 0
        ? raw.split(",").map((s: string) => s.trim())
        : [];
      return {
        id: r.id,
        naam: f["Naam"] ?? "",
        titel: f["Titel"] ?? "",
        bio: f["Bio"] ?? "",
        specialisaties,
        linkedin: f["LinkedIn"] ?? "",
        fotoUrl: f["Foto URL"] ?? "",
        regio: f["Regio"] ?? "",
        ervaringsjaren: Number(f["Ervaringsjaren"] ?? 0),
      };
    });
  } catch {
    return SEED_EXPERTS;
  }
}

export default async function ExpertsPage() {
  const experts = await getExperts();

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <NoorAvatar size={32} alt="" />
            <span className="text-slate-800 font-semibold text-sm">LesCoach</span>
          </Link>
          <Link
            href="/chat"
            className="text-sm font-semibold text-white bg-[#8B1A4A] hover:bg-[#7a1740] px-4 py-2 rounded-lg transition-colors"
          >
            Gesprek starten →
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white text-[#8B1A4A] text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-[#d4a0b5]">
            <span className="w-2 h-2 bg-[#8B1A4A] rounded-full" />
            Persoonlijk advies
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Onze expertpool
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
            Noor geeft je direct een kenniskaart. Wil je daarna persoonlijk advies?
            Onze experts denken met je mee — concreet, zonder wachtrij.
          </p>
        </div>
      </section>

      {/* ── Experts grid ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-12 bg-white border-t border-slate-100 text-center">
        <p className="text-slate-500 mb-4 text-sm">
          Ben je zelf specialist in het speciaal onderwijs?
        </p>
        <Link
          href="/expert/login"
          className="inline-flex items-center gap-2 bg-[#8B1A4A] hover:bg-[#7a1740] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Meld je aan als expert
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white">
        LesCoach ·{" "}
        <Link href="/privacy" className="hover:text-slate-600">
          Privacy
        </Link>
        {" "}·{" "}
        <a href="mailto:thomas@lescoach.nl" className="hover:text-slate-600">
          Contact
        </a>
      </footer>
    </main>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  const initials = expert.naam
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
      {/* Avatar + naam */}
      <div className="flex items-center gap-3">
        {expert.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.fotoUrl}
            alt={expert.naam}
            className="w-14 h-14 rounded-full object-cover bg-[#F5F0E8]"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#F5F0E8] flex items-center justify-center text-[#8B1A4A] font-bold text-xl shrink-0">
            {initials}
          </div>
        )}
        <div>
          <div className="font-bold text-slate-800 leading-tight">{expert.naam}</div>
          {expert.titel && (
            <div className="text-sm text-[#8B1A4A] leading-tight mt-0.5">{expert.titel}</div>
          )}
        </div>
      </div>

      {/* Bio */}
      {expert.bio && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">{expert.bio}</p>
      )}

      {/* Specialisaties */}
      {expert.specialisaties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {expert.specialisaties.slice(0, 5).map((s) => (
            <span
              key={s}
              className="text-xs bg-[#F5F0E8] text-[#8B1A4A] px-2.5 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      {(expert.regio || expert.ervaringsjaren > 0) && (
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {expert.regio && <span>📍 {expert.regio}</span>}
          {expert.ervaringsjaren > 0 && (
            <span>{expert.ervaringsjaren} jaar ervaring</span>
          )}
        </div>
      )}

      {/* LinkedIn */}
      {expert.linkedin && (
        <a
          href={expert.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1.5 text-sm text-[#0A66C2] hover:underline font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </a>
      )}
    </div>
  );
}
