"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Crown, Lock, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckoutModal } from "../modals/SubscriptionCheckoutModal";

interface EpisodePaywallCardProps {
  episode: {
    id: string;
    title: string;
    slug?: string;
    isPremium?: boolean;
    premiumPrice?: number | null;
    podcast?: {
      name: string;
      slug?: string;
    };
  };
  onAccessGranted?: () => void;
}

export const EpisodePaywallCard: React.FC<EpisodePaywallCardProps> = ({
  episode,
  onAccessGranted,
}) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);
  const [targetEpisodeForModal, setTargetEpisodeForModal] = useState<any | null>(null);

  const priceSingle = episode.premiumPrice || 500;

  const handleUnlockWithPass = () => {
    setSelectedPlanForModal({
      id: "pass-illimite-mensuel",
      name: "Pass Bamako Podcast Illimité",
      price: 2000,
      currency: "XOF",
      interval: "MONTHLY",
    });
    setTargetEpisodeForModal(null);
    setIsCheckoutOpen(true);
  };

  const handleBuySingleEpisode = () => {
    setSelectedPlanForModal(null);
    setTargetEpisodeForModal({
      id: episode.id,
      title: episode.title,
      podcastName: episode.podcast?.name,
      price: priceSingle,
    });
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div className="p-6 md:p-8 rounded-2xl bg-[#16140D] border-2 border-[#FFBF00]/80 text-white my-6 shadow-2xl relative overflow-hidden">
        {/* Badge supérieur */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFBF00] mb-3">
          <Lock className="w-4 h-4 text-[#FFBF00]" />
          <span>Contenu Exclusif Réservé aux Abonnés</span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 leading-tight">
          Débloquez cet épisode dès maintenant
        </h3>

        <p className="text-xs sm:text-sm text-gray-300 max-w-xl mb-6 leading-relaxed">
          Cet épisode de <span className="text-white font-semibold">{episode.podcast?.name || "l'émission"}</span> est réservé aux membres de la communauté Bamako Podcast. Choisissez votre mode d'accès préféré :
        </p>

        {/* 2 Options de Déblocage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mb-6">
          {/* Option 1 : Pass Illimité */}
          <div className="p-4 rounded-xl bg-[#221B07] border border-[#FFBF00]/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#FFBF00] uppercase">Pass Illimité</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FFBF00] text-black">
                  POPULAIRE
                </span>
              </div>
              <div className="text-lg font-black text-white mb-2">2 000 FCFA <span className="text-xs font-normal text-gray-400">/ mois</span></div>
              <p className="text-[11px] text-gray-300 leading-normal mb-4">
                Accès illimité à tous les épisodes payants, qualité HD studio et zéro publicité.
              </p>
            </div>
            <Button
              onClick={handleUnlockWithPass}
              className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-extrabold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5 shadow"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Prendre le Pass (2 000 F)</span>
            </Button>
          </div>

          {/* Option 2 : Achat à la pièce */}
          <div className="p-4 rounded-xl bg-[#141414] border border-[#2E2E2E] flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase mb-1">À l'Unité</div>
              <div className="text-lg font-black text-white mb-2">
                {priceSingle.toLocaleString("fr-FR")} FCFA <span className="text-xs font-normal text-gray-400">une seule fois</span>
              </div>
              <p className="text-[11px] text-[#888888] leading-normal mb-4">
                Débloque cet épisode uniquement, sans abonnement ni prélèvement mensuel.
              </p>
            </div>
            <Button
              onClick={handleBuySingleEpisode}
              className="w-full bg-[#202020] hover:bg-[#2C2C2C] text-white border border-[#383838] font-bold text-xs h-9 rounded-lg flex items-center justify-center gap-1.5"
            >
              <span>Acheter cet épisode</span>
            </Button>
          </div>
        </div>

        {/* Moyens de paiement */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#888888] pt-2 border-t border-[#292208]">
          <div className="flex items-center gap-1.5 text-gray-300">
            <ShieldCheck className="w-4 h-4 text-[#1DB954]" />
            <span>Paiement Mobile Money instantané :</span>
          </div>
          <span className="font-semibold text-orange-400">Orange Money</span>
          <span>•</span>
          <span className="font-semibold text-sky-400">Wave</span>
          <span>•</span>
          <span className="font-semibold text-blue-400">Moov Money</span>
          <span>•</span>
          <span className="font-semibold text-gray-300">Carte Visa</span>
        </div>
      </div>

      {/* Modale de Paiement */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={selectedPlanForModal}
        episode={targetEpisodeForModal}
        onSuccess={() => {
          if (onAccessGranted) onAccessGranted();
        }}
      />
    </>
  );
};
