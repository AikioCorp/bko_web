"use client";

import React from "react";
import useSWR from "swr";
import { 
  Settings, 
  Shield, 
  Sliders, 
  HardDrive, 
  Mic2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Loader2, 
  Radio, 
  UploadCloud, 
  Rss, 
  Sparkles,
  Lock,
  Layers
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface SettingsData {
  featureFlags: {
    uploads: boolean;
    rss: boolean;
    transcription: boolean;
    requireVerifiedLogin: boolean;
    requireContentReview: boolean;
  };
  storage: {
    provider: string;
    configured: boolean;
  };
  transcription: {
    provider: string;
    configured: boolean;
  };
  environment: string;
}

export default function AdminSettingsPage() {
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data, mutate, isLoading, isValidating } = useSWR<SettingsData>(
    "/admin/settings",
    fetcher
  );

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888888] mb-1.5 uppercase tracking-wider font-semibold">
            <span>Super Admin</span>
            <span>/</span>
            <span className="text-[#FFBF00]">Configuration</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Paramètres & Interrupteurs
            {isValidating && <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin inline-block" />}
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl">
            Vue d&apos;ensemble des fonctionnalités activées, des fournisseurs de stockage et des règles de publication sur la plateforme.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#CCCCCC] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <span className="text-sm text-[#888888]">Chargement de la configuration système...</span>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Feature Flags Section */}
          <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-4">
            <div className="border-b border-[#222222] pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFBF00] flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Interrupteurs de Fonctionnalités (Feature Flags)
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Ces règles gouvernent l&apos;accès public et créateur aux services sensibles.
              </p>
            </div>

            <div className="divide-y divide-[#1F1F1F]">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-[#38BDF8]" />
                    Téléversement natif de fichiers médias
                  </div>
                  <p className="text-xs text-[#777777]">Autorise les créateurs à uploader des fichiers audio/vidéo directs.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${data.featureFlags.uploads ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300" : "bg-[#222] text-[#888]"}`}>
                  {data.featureFlags.uploads ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Rss className="w-4 h-4 text-[#FFBF00]" />
                    Importation et synchronisation des flux RSS
                  </div>
                  <p className="text-xs text-[#777777]">Permet le moissonnage automatique des podcasts distants.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${data.featureFlags.rss ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300" : "bg-[#222] text-[#888]"}`}>
                  {data.featureFlags.rss ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A855F7]" />
                    Génération de transcriptions automatiques IA
                  </div>
                  <p className="text-xs text-[#777777]">Active le pipeline de sous-titrage et chapitrage par IA.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${data.featureFlags.transcription ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300" : "bg-[#222] text-[#888]"}`}>
                  {data.featureFlags.transcription ? "ACTIVÉ" : "DÉSACTIVÉ"}
                </span>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#2DD4BF]" />
                    Modération & validation requise avant publication
                  </div>
                  <p className="text-xs text-[#777777]">Exige la relecture éditoriale avant mise en ligne publique d&apos;un contenu.</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${data.featureFlags.requireContentReview ? "bg-emerald-950/60 border border-emerald-800 text-emerald-300" : "bg-[#222] text-[#888]"}`}>
                  {data.featureFlags.requireContentReview ? "REQUIS" : "PUBLICATION DIRECTE"}
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure Provider Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#FFBF00]">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Stockage Médias Objets</h4>
                  <div className="text-xs text-[#888888] font-mono">Fournisseur : {data.storage.provider}</div>
                </div>
              </div>

              <div className="p-3 bg-[#0E0E0E] rounded-xl border border-[#222] flex items-center justify-between text-xs">
                <span className="text-[#888888]">Statut configuration S3 / R2 :</span>
                <span className={`font-bold ${data.storage.configured ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.storage.configured ? "Bucket Connecté" : "Stockage Local Actif"}
                </span>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#222] border border-[#333] flex items-center justify-center text-[#A855F7]">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Moteur de Transcription</h4>
                  <div className="text-xs text-[#888888] font-mono">Modèle : {data.transcription.provider}</div>
                </div>
              </div>

              <div className="p-3 bg-[#0E0E0E] rounded-xl border border-[#222] flex items-center justify-between text-xs">
                <span className="text-[#888888]">Statut clé API OpenAI :</span>
                <span className={`font-bold ${data.transcription.configured ? "text-emerald-400" : "text-amber-400"}`}>
                  {data.transcription.configured ? "Clé API Détectée" : "En attente de clé"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
