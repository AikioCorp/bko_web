"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Mail, Home, ArrowLeft, AlertCircle } from "lucide-react";

interface SuspensionDetails {
  reason?: string;
  isPermanent?: boolean;
  suspendedAt?: string;
  suspendedUntil?: string;
}

export default function SuspendedPage() {
  const [details, setDetails] = useState<SuspensionDetails | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("bko_suspended_details");
        if (stored) {
          setDetails(JSON.parse(stored));
        }
      } catch (_) {}
    }
  }, []);

  const reason = details?.reason || "Non-respect des conditions d'utilisation de la plateforme.";
  const isPermanent = details?.isPermanent ?? true;
  const formattedDate = details?.suspendedAt
    ? new Date(details.suspendedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        {/* Icône d'alerte */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Titre & Explication */}
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Votre compte a été suspendu
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
            L&apos;accès à votre compte Bamako Podcast a été temporairement ou définitivement restreint par l&apos;administration en raison du motif ci-dessous.
          </p>
        </div>

        {/* Bloc Motif public */}
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#AAAAAA]">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Motif de la suspension</span>
          </div>
          <p className="text-sm font-medium text-white">{reason}</p>
          {formattedDate && (
            <p className="text-[11px] text-[#666666]">
              Date d&apos;application : {formattedDate}
            </p>
          )}
        </div>

        {/* Actions directes */}
        <div className="space-y-3 pt-2">
          <a
            href="mailto:support@bamakopodcast.com?subject=Demande%20de%20révision%20de%20suspension%20de%20compte"
            className="w-full py-3 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#E5A800] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contacter l&apos;assistance
          </a>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#888888]" />
            Retour à l&apos;accueil public
          </Link>
        </div>

        <p className="text-[11px] text-[#555555]">
          Si vous estimez qu&apos;il s&apos;agit d&apos;une erreur, notre équipe support répond dans un délai moyen de 24 à 48 heures.
        </p>
      </div>
    </div>
  );
}
