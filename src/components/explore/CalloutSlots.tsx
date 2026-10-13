"use client";

import React from "react";
import Link from "next/link";
import { Mic, Sparkles, Building2, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function CreatorCalloutSlot() {
  const { user, isAuthenticated } = useAuthStore();
  const isCreator =
    isAuthenticated &&
    (user?.roles?.includes("CREATOR") ||
      user?.roles?.includes("ADMIN") ||
      user?.roles?.includes("SUPER_ADMIN"));

  const targetHref = isCreator ? "/studio" : "/become-creator";

  return (
    <div className="w-full my-6 p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#222222] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#FFBF00]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Espace Créateurs</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Vous avez des histoires et des idées à partager ?
          </h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Rejoignez Bamako Podcast et faites résonner votre voix auprès d'une communauté engagée au Mali et à travers le monde.
          </p>
        </div>

        <Link
          href={targetHref}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs hover:bg-[#e6ac00] transition-colors shadow-sm"
        >
          <Mic className="w-4 h-4" />
          <span>Publier mon émission</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function PromoteCalloutSlot({ onOpenInquiry }: { onOpenInquiry: () => void }) {
  return (
    <div className="w-full my-6 p-5 sm:p-6 rounded-2xl bg-[#141414] border border-[#222222] shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#FFBF00]">
            <Building2 className="w-3.5 h-3.5" />
            <span>Partenariats & Régie</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Faites découvrir votre émission ou marque sur Bamako Podcast
          </h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Bénéficiez d'emplacements privilégiés au cœur de notre catalogue et touchez des auditeurs attentifs et fidèles.
          </p>
        </div>

        <button
          onClick={onOpenInquiry}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#222222] text-[#FFBF00] border border-[#333333] hover:border-[#FFBF00] font-bold text-xs transition-colors"
        >
          <span>Promouvoir une émission</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
