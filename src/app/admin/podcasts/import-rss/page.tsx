"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Rss,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RssImportPage() {
  const router = require("next/navigation").useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  
  const [importStatus, setImportStatus] = useState<any>(null);
  const [operationId, setOperationId] = useState<string | null>(null);

  // Form states for Step 2
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover: "",
    languageCode: "",
    categoryIds: [] as string[],
    countryId: "",
    city: "",
    creatorName: "",
    syncEnabled: true
  });

  const { data: catData } = useSWR("/admin/categories", (url) => adminApi(url).then(res => res.data));
  const categories = (catData || []).filter((c: any) => c.isActive);

  // Poll for status if we are in step 3
  useEffect(() => {
    if (currentStep === 3 && operationId && (!importStatus || importStatus.status !== "SUCCESS")) {
      const interval = setInterval(async () => {
        try {
          const res = await adminApi(`/admin/rss/imports/${operationId}`);
          if (res.success && res.data) {
            setImportStatus(res.data);
            if (res.data.status === "SUCCESS" || res.data.status === "ERROR") {
              clearInterval(interval);
            }
          }
        } catch (e) {
          // ignore polling errors
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentStep, operationId, importStatus]);

  const handleAnalyze = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setError(null);
    setPreviewData(null);
    try {
      const res = await adminApi("/admin/rss/preview", {
        method: "POST",
        body: JSON.stringify({ url })
      });
      if (!res.success) throw new Error(res.message || "Erreur d'analyse");

      setPreviewData(res.data);
      
      if (!res.data.existingPodcast) {
        setFormData({
          ...formData,
          name: res.data.preview.title,
          description: res.data.preview.description,
          cover: res.data.preview.image,
          languageCode: res.data.preview.language,
          creatorName: res.data.preview.author || "Propriétaire non revendiqué"
        });
      }
      setCurrentStep(2);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartImport = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await adminApi("/admin/rss/imports", {
        method: "POST",
        body: JSON.stringify({ ...formData, url })
      });
      if (!res.success) throw new Error(res.message || "Erreur de création");

      setOperationId(res.data.operationId);
      setImportStatus({ status: "PENDING" });
      setCurrentStep(3);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCategoryToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id]
    }));
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col pb-32 text-white">
      
      {/* Header */}
      <div className="space-y-6 mb-8">
        <Link href="/admin/podcasts" className="inline-flex items-center text-sm font-semibold text-[#757575] hover:text-[#FFBF00] transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux podcasts
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Rss className="w-6 h-6 text-[#FFBF00]" /> Importer un RSS
          </h1>
          <p className="text-[#888888] mt-1">Récupérez les informations d'une émission et de ses épisodes depuis son flux.</p>
        </div>
      </div>

      <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6 md:p-8">
        
        {/* Progress Bar */}
        <div className="flex items-center mb-8">
          <div className={`flex-1 text-center pb-3 border-b-2 ${currentStep >= 1 ? "border-[#FFBF00] text-white" : "border-[#2A2A2A] text-[#757575]"}`}>
            <span className="text-xs font-bold uppercase">1. Saisir le flux</span>
          </div>
          <div className={`flex-1 text-center pb-3 border-b-2 ${currentStep >= 2 ? "border-[#FFBF00] text-white" : "border-[#2A2A2A] text-[#757575]"}`}>
            <span className="text-xs font-bold uppercase">2. Vérifier</span>
          </div>
          <div className={`flex-1 text-center pb-3 border-b-2 ${currentStep >= 3 ? "border-[#FFBF00] text-white" : "border-[#2A2A2A] text-[#757575]"}`}>
            <span className="text-xs font-bold uppercase">3. Confirmer</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="animate-in fade-in space-y-6">
            <div>
              <label className="block text-sm font-bold text-white mb-2">Adresse du flux RSS</label>
              <input 
                type="url" 
                value={url} 
                onChange={(e) => setUrl(e.target.value)} 
                placeholder="https://anchor.fm/s/123456/podcast/rss"
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
              />
              <p className="text-xs text-[#757575] mt-2">
                Vous devez fournir l'adresse brute du flux RSS, et non l'adresse d'une page Spotify ou Apple Podcasts.
              </p>
            </div>
            
            <div className="pt-4 border-t border-[#2A2A2A]">
              <Button 
                onClick={handleAnalyze} 
                disabled={!url || isAnalyzing}
                className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold w-full md:w-auto"
              >
                {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</> : "Analyser le flux"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && previewData && (
          <div className="animate-in fade-in space-y-8">
            
            {previewData.existingPodcast ? (
              <div className="bg-[#262626] border border-[#2A2A2A] rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-[#FFBF00] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Ce flux est déjà associé à un podcast</h3>
                <p className="text-[#B8B8B8] text-sm mb-6">Le podcast « {previewData.existingPodcast.name} » utilise déjà cette adresse.</p>
                <Link href={`/admin/podcasts/${previewData.existingPodcast.id}`}>
                  <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">Ouvrir ce podcast</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Preview Block */}
                <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-5 flex flex-col md:flex-row gap-5">
                  <div className="w-24 h-24 shrink-0 bg-[#171717] rounded-lg overflow-hidden flex items-center justify-center">
                    {previewData.preview.image ? (
                      <img src={previewData.preview.image} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#2A2A2A]" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">{previewData.preview.title}</h3>
                    <p className="text-xs text-[#B8B8B8] mb-3 flex gap-2 flex-wrap">
                      <span className="font-medium text-white">{previewData.preview.author || "Inconnu"}</span>
                      <span>·</span>
                      <span className="uppercase">{previewData.preview.language}</span>
                      <span>·</span>
                      <span>{previewData.preview.episodesCount} épisodes détectés</span>
                    </p>
                    <p className="text-sm text-[#757575] line-clamp-2">{previewData.preview.description}</p>
                  </div>
                </div>

                {/* Form to confirm/edit */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vérifier les informations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Langue détectée</label>
                      <input 
                        value={formData.languageCode} 
                        onChange={(e) => setFormData({...formData, languageCode: e.target.value})} 
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white uppercase" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Propriétaire</label>
                      <input 
                        value={formData.creatorName} 
                        onChange={(e) => setFormData({...formData, creatorName: e.target.value})} 
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-3">Catégories manuelles (Bamako Podcast)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categories.map((c: any) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleCategoryToggle(c.id)}
                          className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                            formData.categoryIds.includes(c.id)
                              ? "bg-[#FFBF00]/10 border-[#FFBF00] text-[#FFBF00]"
                              : "bg-[#0B0B0B] border-[#2A2A2A] text-white hover:border-[#757575]"
                          }`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#757575] mt-2">Les catégories du flux ne sont pas importées automatiquement. Rapprochez-les de votre classement.</p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-white">Synchronisation automatique</p>
                      <p className="text-xs text-[#757575]">Récupérer les nouveaux épisodes périodiquement</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.syncEnabled} onChange={(e) => setFormData({...formData, syncEnabled: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FFBF00]"></div>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)} className="text-[#B8B8B8] hover:text-white">Annuler</Button>
                  <Button onClick={handleStartImport} disabled={isAnalyzing} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                    Créer le brouillon et importer
                  </Button>
                </div>
              </  >
            )}
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="animate-in fade-in py-8 space-y-8 text-center">
            <h2 className="text-xl font-bold text-white">Import en cours</h2>
            <p className="text-[#B8B8B8] text-sm">L'import s'exécute en arrière-plan. Vous pouvez quitter cette page.</p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[#FFBF00] text-black flex items-center justify-center mb-2"><CheckCircle className="w-4 h-4" /></div>
                <span className="text-xs font-bold text-white">Création</span>
              </div>
              <div className="w-px h-8 md:w-16 md:h-px bg-[#2A2A2A]"></div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  importStatus?.status === "PENDING" ? "bg-[#FFBF00]/20 text-[#FFBF00] animate-pulse" : "bg-[#FFBF00] text-black"
                }`}>
                  {importStatus?.status === "PENDING" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-bold ${importStatus?.status === "PENDING" ? "text-[#FFBF00]" : "text-white"}`}>Analyse</span>
              </div>
              <div className="w-px h-8 md:w-16 md:h-px bg-[#2A2A2A]"></div>
              
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  !importStatus || importStatus?.status === "PENDING" ? "bg-[#2A2A2A] text-[#757575]" :
                  importStatus?.status === "SYNCING" ? "bg-[#FFBF00]/20 text-[#FFBF00] animate-pulse" :
                  importStatus?.status === "SUCCESS" ? "bg-[#FFBF00] text-black" : "bg-red-500/20 text-red-500"
                }`}>
                  {importStatus?.status === "SYNCING" ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   importStatus?.status === "SUCCESS" ? <CheckCircle className="w-4 h-4" /> : 
                   importStatus?.status === "ERROR" ? <AlertCircle className="w-4 h-4" /> : "3"}
                </div>
                <span className={`text-xs font-bold ${importStatus?.status === "SYNCING" ? "text-[#FFBF00]" : importStatus?.status === "ERROR" ? "text-red-500" : "text-[#757575]"}`}>
                  Import des épisodes
                </span>
              </div>
            </div>

            {importStatus?.status === "ERROR" && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg mt-6 max-w-md mx-auto text-sm">
                <p className="font-bold mb-1">Erreur d'importation</p>
                <p>{importStatus.errorMessage || "Le flux n'a pas pu être traité complètement."}</p>
                <Button variant="outline" className="mt-3 border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white">Réessayer</Button>
              </div>
            )}

            {importStatus?.status === "SUCCESS" && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-lg mt-6 max-w-md mx-auto text-sm">
                <p className="font-bold">Terminé avec succès !</p>
              </div>
            )}

            <div className="pt-8">
              <Link href="/admin/podcasts">
                <Button variant="outline" className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#262626]">
                  Retour à la liste des podcasts
                </Button>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
