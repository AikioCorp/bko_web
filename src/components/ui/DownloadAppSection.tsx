"use client";

import React, { useState } from "react";
import { Smartphone, Download, Headphones, Bell, CheckCircle2, ArrowRight } from "lucide-react";
import { AppDownloadModal } from "../modals/AppDownloadModal";

export const DownloadAppSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section
        id="telecharger-app"
        className="rounded-2xl bg-[#141414] border border-[#242424] p-6 md:p-10 text-white space-y-6 select-none"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left Text & Features */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C180E] border border-[#FFBF00]/40 text-[#FFBF00] text-xs font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>APPLICATION MOBILE OFFICIELLE</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-headline font-extrabold text-white leading-tight">
              Emportez tous les récits du Mali et d'Afrique dans votre poche
            </h2>

            <p className="text-xs md:text-sm text-[#B8B8B8] leading-relaxed">
              Téléchargez l'application mobile Bamako Podcast pour profiter d'une écoute 100% hors-ligne dans vos déplacements, de la lecture écran éteint et de notifications instantanées à chaque nouvel épisode.
            </p>

            {/* Micro Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5]">
                <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
                <span>Mode 100% Hors-ligne</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5]">
                <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
                <span>Lecture en arrière-plan</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#E5E5E5]">
                <CheckCircle2 className="w-4 h-4 text-[#FFBF00] shrink-0" />
                <span>Sans consommation data</span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-72">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-md group"
            >
              <Smartphone className="w-4 h-4" />
              <span>Installer l'application</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>

            <a
              href="/downloads/bamako-podcast.apk"
              download
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] hover:border-[#FFBF00]/40 text-white text-xs font-bold transition-all text-center"
            >
              <Download className="w-4 h-4 text-[#FFBF00]" />
              <span>Télécharger l'APK (.apk)</span>
            </a>
          </div>
        </div>
      </section>

      <AppDownloadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
