"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export default function StudioAnalyticsPage() {
  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222] pb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#FFBF00]" />
            Statistiques
          </h1>
          <p className="text-[#888888]">
            Analysez les performances de vos podcasts et comprenez votre audience.
          </p>
        </div>
      </div>
      
      <div className="border border-[#222] rounded-xl p-12 text-center flex flex-col items-center bg-[#111]">
        <div className="w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-[#888]" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Statistiques en construction</h3>
        <p className="text-[#888] max-w-md">
          Cette page vous permettra bientÃ´t de visualiser vos courbes d'Ã©coute, la provenance de vos auditeurs et les performances dÃ©taillÃ©es de vos Ã©pisodes.
        </p>
      </div>
    </div>
  );
}

