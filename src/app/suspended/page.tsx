"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Mail, Home, AlertCircle, User, ShieldCheck } from "lucide-react";

interface SuspendedProfile {
  userId?: string | null;
  fullName?: string | null;
  email?: string | null;
  avatar?: string | null;
  reason?: string | null;
  suspendedAt?: string | null;
  supportToken?: string | null;
  isPermanent?: boolean;
}

export default function SuspendedPage() {
  const [profile, setProfile] = useState<SuspendedProfile | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedProfile =
          sessionStorage.getItem("bko_suspended_profile") ||
          localStorage.getItem("bko_suspended_profile");
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
          return;
        }

        const storedDetails =
          sessionStorage.getItem("bko_suspended_details") ||
          localStorage.getItem("bko_suspended_details");
        if (storedDetails) {
          setProfile(JSON.parse(storedDetails));
        }
      } catch (_) {}
    }
  }, []);

  const reason =
    profile?.reason?.trim() ||
    "Non-respect des conditions d'utilisation et des directives communautaires de la plateforme.";

  const formattedDate = profile?.suspendedAt
    ? new Date(profile.suspendedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const initials = profile?.fullName
    ? profile.fullName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : profile?.email
    ? profile.email[0].toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-6 text-center">
        {/* En-tête statut */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-red-900/40 text-red-400 border border-red-800/40">
            Compte suspendu
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Accès au compte restreint
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] leading-relaxed">
            L&apos;accès aux services connectés de Bamako Podcast a été suspendu par l&apos;équipe de modération.
          </p>
        </div>

        {/* Profil de la personne bloquée */}
        {(profile?.fullName || profile?.email) && (
          <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 text-left flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#262626] border border-[#333333] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar}
                  alt={profile.fullName || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">
                  {profile.fullName || "Utilisateur Bamako Podcast"}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-300 border border-red-500/20 shrink-0">
                  Bloqué
                </span>
              </div>

              {profile.email && (
                <div className="flex items-center gap-1.5 text-xs text-[#888888] mt-0.5 truncate">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-[#666666]" />
                  <span className="truncate">{profile.email}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Motif notifié */}
        <div className="bg-[#181818] border border-[#282828] rounded-xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#AAAAAA]">
            <AlertCircle className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Motif communiqué par la modération</span>
          </div>
          <p className="text-sm text-[#CCCCCC] leading-relaxed font-medium">
            {reason}
          </p>
          {formattedDate && (
            <p className="text-[11px] text-[#666666] pt-1 border-t border-[#242424]">
              Date de notification : {formattedDate}
            </p>
          )}
        </div>

        {/* Actions directes */}
        <div className="space-y-3 pt-1">
          <Link
            href="/support?context=suspension"
            className="w-full py-3 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#E5A800] text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            Demander un recours / Contacter l&apos;assistance
          </Link>

          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4 text-[#888888]" />
            Retour à l&apos;accueil public
          </Link>
        </div>

        <p className="text-[11px] text-[#555555] leading-relaxed">
          Votre demande de recours sera automatiquement associée à votre dossier. L&apos;équipe répond sous 24 à 48 heures ouvrées.
        </p>
      </div>
    </div>
  );
}

