"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NoorAvatar } from "@/components/JeroenAvatar";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Minimale logging — geen PII
    console.error("[LesCoach] onverwachte fout:", error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6">
          <NoorAvatar size={120} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Er ging iets mis
        </h1>
        <p className="text-slate-600 mb-6 leading-relaxed">
          Noor kon even niet verder. Probeer opnieuw, of ga terug naar de
          homepage. Als het blijft gebeuren — laat het ons weten.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Opnieuw proberen
          </button>
          <Link
            href="/"
            className="bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Naar home
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-slate-400">
            Referentie: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
