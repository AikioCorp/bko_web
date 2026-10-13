"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, ChevronRight } from "lucide-react";

export interface DiscoveryPromoConfig {
  campaignId: string;
  version?: number;
  title: string;
  description: string;
  coverUrl?: string;
  buttonLabel?: string;
  targetUrl: string;
  startDate?: string;
  endDate?: string;
  maxFrequencyHours?: number; // Défaut : 24 heures
}

interface DiscoveryPromotionModalProps {
  config: DiscoveryPromoConfig;
  isOpenOverride?: boolean;
  onClose?: () => void;
}

export function DiscoveryPromotionModal({
  config,
  isOpenOverride,
  onClose,
}: DiscoveryPromotionModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpenOverride !== undefined) {
      setIsOpen(isOpenOverride);
      return;
    }

    if (!config || !config.campaignId || !config.targetUrl) return;

    // 1. Vérifier dates de début et fin de campagne
    const now = Date.now();
    if (config.startDate && new Date(config.startDate).getTime() > now) return;
    if (config.endDate && new Date(config.endDate).getTime() < now) return;

    // 2. Vérifier si un modal ou input est déjà actif
    if (typeof document !== "undefined") {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;
    }

    // 3. Frequency capping via localStorage
    try {
      const storageKey = `bko_promo_last_shown_${config.campaignId}`;
      const lastShown = localStorage.getItem(storageKey);
      const freqHours = config.maxFrequencyHours ?? 24;
      const cooldownMs = freqHours * 60 * 60 * 1000;

      if (lastShown) {
        const lastShownTs = parseInt(lastShown, 10);
        if (now - lastShownTs < cooldownMs) {
          return;
        }
      }

      // Temporiser l'apparition après le premier rendu pour ne pas agresser l'utilisateur
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem(storageKey, String(Date.now()));
      }, 2500);

      return () => clearTimeout(timer);
    } catch (_) {}
  }, [config, isOpenOverride]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleAction = () => {
    setIsOpen(false);
    onClose?.();
    router.push(config.targetUrl);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl overflow-hidden shadow-2xl text-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de fermeture discret */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] flex items-center justify-center text-[#888888] hover:text-white transition-colors cursor-pointer"
          aria-label="Fermer la mise en avant"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Visuel d'illustration */}
        {config.coverUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0B0B0B] border-b border-[#242424]">
            <img
              src={config.coverUrl}
              alt={config.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0B0B0B]/80 backdrop-blur-md border border-[#242424] text-[10px] font-black uppercase tracking-wider text-[#FFBF00] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FFBF00]" />
              À découvrir
            </div>
          </div>
        ) : (
          <div className="pt-6 px-6 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#1E1E1E] border border-[#2E2E2E] text-[10px] font-black uppercase tracking-wider text-[#FFBF00] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#FFBF00]" />
              Sélection spéciale
            </span>
          </div>
        )}

        {/* Contenu textuel */}
        <div className="p-6">
          <h3 className="text-xl font-black text-white tracking-tight mb-2">
            {config.title}
          </h3>
          <p className="text-sm text-[#A8A8A8] leading-relaxed mb-6">
            {config.description}
          </p>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 px-4 rounded-full bg-[#1A1A1A] hover:bg-[#242424] text-xs font-bold text-[#888888] hover:text-white transition-colors cursor-pointer text-center"
            >
              Plus tard
            </button>
            <button
              onClick={handleAction}
              className="flex-1 py-3 px-4 rounded-full bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{config.buttonLabel || "Explorer la sélection"}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
