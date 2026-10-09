"use client";

import React, { useEffect } from "react";
import { X, Smartphone, Download, Headphones, Bell, Zap, CheckCircle2 } from "lucide-react";

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="TÃ©lÃ©charger l'application mobile Bamako Podcast"
    >
      <div
        className="relative w-full max-w-lg bg-[#141414] border border-[#262626] rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl text-white animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#1E1E1E] border border-[#333333] text-[#A0A0A0] hover:text-white hover:bg-[#282828] transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1C180E] border border-[#FFBF00]/40 text-[#FFBF00] flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FFBF00] bg-[#1C180E] px-2 py-0.5 rounded border border-[#FFBF00]/30">
              DISPONIBLE SUR MOBILE
            </span>
            <h2 className="text-xl font-headline font-extrabold text-white">
              Application Bamako Podcast
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              Emportez les voix du Mali et d'Afrique partout avec vous.
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <div className="bg-[#1A1A1A] border border-[#292929] rounded-xl p-3 flex items-start gap-3">
            <Download className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-white">Ã‰coute Hors-ligne</p>
              <p className="text-[11px] text-[#888888]">TÃ©lÃ©chargez vos Ã©pisodes sans connexion</p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#292929] rounded-xl p-3 flex items-start gap-3">
            <Headphones className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-white">Lecture ArriÃ¨re-plan</p>
              <p className="text-[11px] text-[#888888]">Ã‰coutez mÃªme Ã©cran verrouillÃ©</p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#292929] rounded-xl p-3 flex items-start gap-3">
            <Bell className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-white">Alertes NouveautÃ©s</p>
              <p className="text-[11px] text-[#888888]">Soyez prÃ©venu dÃ¨s la parution</p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#292929] rounded-xl p-3 flex items-start gap-3">
            <Zap className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-white">Ultra LÃ©ger & Fluide</p>
              <p className="text-[11px] text-[#888888]">OptimisÃ© pour tous les smartphones</p>
            </div>
          </div>
        </div>

        {/* Download Actions */}
        <div className="space-y-3 pt-1">
          <p className="text-xs font-bold text-white uppercase tracking-wider text-center">
            Choisissez votre mÃ©thode d'installation :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Play */}
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#FFBF00]/50 text-white transition-all text-xs font-bold group"
            >
              <svg className="w-4 h-4 text-[#FFBF00] shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.5 1.5 0 0 1-.61-.936V2.75c0-.363.13-.7.36-1.026l.249.09zm11.233 11.235l2.483 2.483-11.458 6.57 8.975-9.053zm2.483-2.483l-2.483 2.483L5.867 4.023l11.458 6.543zm1.05 1.05l2.766 1.583a1.5 1.5 0 0 1 0 2.602l-2.766 1.583-1.89-1.884 1.89-1.884z" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] text-[#A0A0A0] uppercase leading-none">Disponible sur</p>
                <p className="text-xs font-extrabold text-white group-hover:text-[#FFBF00]">Google Play</p>
              </div>
            </a>

            {/* Apple App Store */}
            <a
              href="https://apple.com/app-store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#333333] hover:border-[#FFBF00]/50 text-white transition-all text-xs font-bold group"
            >
              <svg className="w-4 h-4 text-white shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.62-.75 1.04-1.8 1.04-2.85 0-.15-.01-.29-.04-.44-.99.04-2.19.66-2.9 1.49-.56.65-.99 1.69-.99 2.76 0 .15.02.3.04.38 1.08.08 2.22-.56 2.85-1.34z" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] text-[#A0A0A0] uppercase leading-none">TÃ©lÃ©charger sur</p>
                <p className="text-xs font-extrabold text-white group-hover:text-[#FFBF00]">App Store</p>
              </div>
            </a>
          </div>

          {/* Direct APK Download Button (Very helpful in West Africa) */}
          <a
            href="/downloads/bamako-podcast.apk"
            download
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>TÃ©lÃ©charger l'APK Android Directement (.apk)</span>
          </a>
        </div>

        {/* Footer info note */}
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-[#777777]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#3FB950]" />
          <span>Application 100% gratuite â€¢ Sans publicitÃ© intrusive</span>
        </div>
      </div>
    </div>
  );
};

