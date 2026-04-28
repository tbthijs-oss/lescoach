"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ReportView,
  ExpertModal,
  StickyExpertCTA,
  type Kenniskaart,
  type Expert,
  type Message,
  type NoorAnalysis,
} from "@/components/ReportView";

const STORAGE_KEY = "lescoach:last-results:v1";

interface StoredResults {
  analysis: NoorAnalysis | null;
  kenniskaarten: Kenniskaart[];
  experts: Expert[];
  primaryKaartId: string | null;
  alternativeKaartIds: string[];
  messages: Message[];
  savedAt: number;
}

/**
 * /resultaten — eigen pagina voor de uitkomst van een gesprek met Noor.
 *
 * Is ontworpen om los te kunnen op een telefoon: sticky header, eigen URL
 * (deelbaar als bookmark of via "Open in browser" vanuit een Home-screen-app),
 * sticky CTA onderaan voor de expert. State komt uit sessionStorage — de
 * chat-pagina schrijft hem daarheen op het moment dat de kenniskaarten
 * binnenkomen.
 */
export default function ResultatenPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredResults | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw) as StoredResults;
      setData(parsed);
    } catch {
      // Geen bruikbare data — toon leeg-state.
    } finally {
      setLoaded(true);
    }
  }, []);

  function newConversation() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    router.push("/chat");
  }

  // ── Empty state — gebruiker landde direct op /resultaten zonder gesprek
  if (loaded && (!data || !data.kenniskaarten?.length)) {
    return (
      <div className="min-h-dvh bg-[#fefcf7] flex flex-col">
        <header className="bg-white/90 backdrop-blur border-b border-amber-100 px-4 py-3 sticky top-0 z-20">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="text-slate-800 font-semibold">LesCoach</span>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="text-center max-w-sm">
            <div className="inline-flex w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Nog geen rapport</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Start eerst een gesprek met Noor — zodra zij de kenniskaarten heeft opgehaald
              verschijnt het rapport hier.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-3 rounded-xl text-sm transition-colors"
            >
              Start een gesprek
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state — sessie nog niet gelezen
  if (!loaded || !data) {
    return (
      <div className="min-h-dvh bg-[#fefcf7] flex items-center justify-center">
        <div className="text-sm text-slate-500">Rapport laden…</div>
      </div>
    );
  }

  const primaryExpert = data.experts[0];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50/40 to-white print:bg-white">
      {/* Expert modal */}
      {selectedExpert && (
        <ExpertModal
          expert={selectedExpert}
          messages={data.messages}
          kenniskaarten={data.kenniskaarten}
          onClose={() => setSelectedExpert(null)}
          defaultValues={{}}
        />
      )}

      {/* Sticky page header — back to chat + brand + secondary actions */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-amber-100 print:hidden">
        <div className="max-w-2xl mx-auto px-3 py-2.5 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/chat")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-blue-700 px-2.5 py-2 -ml-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Terug naar het gesprek"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Gesprek</span>
          </button>
          <Link href="/" className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="hidden sm:inline">LesCoach</span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.print()}
              aria-label="Print of PDF"
              title="Print of PDF"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
            <button
              onClick={newConversation}
              aria-label="Nieuw gesprek"
              title="Nieuw gesprek"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <ReportView
        analysis={data.analysis}
        kenniskaarten={data.kenniskaarten}
        primaryKaartId={data.primaryKaartId}
        alternativeKaartIds={data.alternativeKaartIds}
        experts={data.experts}
        onContactExpert={(e) => setSelectedExpert(e)}
        onNewConversation={newConversation}
        variant="page"
      />

      {/* Sticky bottom CTA — mobiel only, only when an expert is available */}
      {primaryExpert && (
        <StickyExpertCTA
          expert={primaryExpert}
          onContact={(e) => setSelectedExpert(e)}
        />
      )}
    </div>
  );
}
