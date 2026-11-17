"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[bko_web error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-white">
      <div className="max-w-md w-full bg-[#141414] border border-[#262626] rounded-3xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/50 flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-red-400">Incident technique</p>
          <h1 className="text-2xl font-black tracking-tight">Une erreur est survenue</h1>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">
            Impossible d&apos;afficher cette section pour le moment. Vous pouvez réessayer ou revenir à l&apos;accueil.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#2F2F2F] font-semibold text-xs transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Accueil</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
