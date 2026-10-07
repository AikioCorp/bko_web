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
  Headphones,
  Video,
  Info,
  Calendar,
  Building2,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RssImportPage() {
  const router = useRouter();
  
  // 4 Steps strictly following specifications:
  // 1: Adresse du flux
  // 2: Prévisualisation
  // 3: Vérification et réglages
  // 4: Import et confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: URL & Analysis
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Step 3: Settings & Mapping
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cover: "",
    languageCode: "fr",
    categoryIds: [] as string[],
    countryId: "ML",
    organizationId: "",
    ownershipStatus: "UNCLAIMED",
    // Import scope
    importScope: "ALL" as "ALL" | "LAST_10" | "SELECT",
    syncEnabled: true,
    newEpisodesTreatment: "DRAFT" as "DRAFT" | "REVIEW" | "PUBLISHED",
    keepManualEdits: true,
    flagRemovedEpisodes: true,
  });

  // Step 4: Import Progress & Status
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState<string>("Prêt pour le démarrage");
  const [importResult, setImportResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: string[];
    createdPodcastId?: string;
  } | null>(null);

  const { data: catData } = useSWR("/admin/categories", (u) => adminApi(u).then(res => res.data));
  const { data: langData } = useSWR("/admin/languages", (u) => adminApi(u).then(res => res.data));
  const { data: orgsData } = useSWR("/admin/organizations", (u) => adminApi(u).then(res => res.data));

  const categories = (catData || []).filter((c: any) => c.isActive);
  const languages = (langData || []).filter((l: any) => l.isActive);
  const organizations = Array.isArray(orgsData) ? orgsData : (orgsData?.items || []);

  // Étape 1 : Analyser le flux RSS
  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Veuillez saisir l'adresse URL du flux RSS.");
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await adminApi("/admin/rss/preview", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() })
      });
      if (!res.success) throw new Error(res.message || "Impossible d'analyser ce flux RSS.");

      setPreviewData(res.data);
      
      // Préremplissage des réglages pour l'étape 3
      if (!res.data.existingPodcast) {
        setFormData(prev => ({
          ...prev,
          name: res.data.preview?.title || "",
          description: res.data.preview?.description || "",
          cover: res.data.preview?.image || "",
          languageCode: res.data.preview?.language || "fr",
        }));
      }

      setCurrentStep(2);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'analyse du flux RSS.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Étape 4 : Lancer l'import réel
  const [operationId, setOperationId] = useState<string | null>(null);
  const [createdPodcastId, setCreatedPodcastId] = useState<string | null>(null);

  const handleStartImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportProgress(10);
    setImportStage("1/4 — Initialisation de l'import dans la file d'attente...");

    try {
      // 1. Appel API backend
      const res = await adminApi("/admin/rss/imports", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          url: url.trim(),
          importSettings: {
            importScope: formData.importScope,
            newEpisodesTreatment: formData.newEpisodesTreatment,
            keepManualEdits: formData.keepManualEdits,
          }
        })
      });

      if (!res.success) throw new Error(res.error || res.message || "Échec de l'initialisation de l'import.");

      const createdId = res.data?.podcastId;
      setCreatedPodcastId(createdId);
      setOperationId(res.data?.operationId);
      setImportStage("2/4 — En attente du traitement en arrière-plan...");

    } catch (err: any) {
      setIsImporting(false);
      setImportResult({
        successCount: 0,
        errorCount: 1,
        errors: [err.message || "Erreur réseau pendant l'import."],
      });
    }
  };

  // Polling du statut réel de l'import
  useEffect(() => {
    let interval: any;
    if (isImporting && operationId && !importResult) {
      interval = setInterval(async () => {
        try {
          const res = await adminApi(`/admin/rss/imports/${operationId}/status`);
          if (res.success && res.data) {
            const { status, errorMessage, metrics } = res.data;
            if (status === "SYNCING") {
               setImportStage(`3/4 — Importation en cours... (Découverts : ${metrics?.episodesDiscovered || 0}, Importés : ${metrics?.episodesImported || 0})`);
               setImportProgress(50);
            } else if (status === "SUCCESS" || status === "IDLE") {
               setImportStage(metrics?.episodesFailed > 0 ? "4/4 — Import terminé avec des erreurs" : "4/4 — Import terminé avec succès !");
               setImportProgress(100);
               setIsImporting(false);
               setImportResult({
                 successCount: metrics?.episodesImported || 0,
                 errorCount: metrics?.episodesFailed || 0,
                 errors: errorMessage ? [errorMessage] : [],
                 createdPodcastId: createdPodcastId || "imported"
               });
               clearInterval(interval);
            } else if (status === "ERROR") {
               setIsImporting(false);
               setImportResult({
                 successCount: metrics?.episodesImported || 0,
                 errorCount: (metrics?.episodesFailed || 0) + 1,
                 errors: [errorMessage || "Erreur lors de l'import."],
                 createdPodcastId: createdPodcastId || "imported"
               });
               clearInterval(interval);
            }
          }
        } catch (e) {
          console.error("Erreur polling", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isImporting, operationId, importResult, createdPodcastId]);

  const handleCategoryToggle = (id: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter(c => c !== id)
        : [...prev.categoryIds, id]
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4 pb-32 text-white space-y-8 animate-in fade-in">
      
      {/* En-tête & Fil d'Ariane */}
      <div className="space-y-3">
        <Link 
          href="/admin/podcasts" 
          className="inline-flex items-center text-xs font-semibold text-[#888888] hover:text-[#FFBF00] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux émissions
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-[#FFBF00] uppercase tracking-wider">
          <span>Assistant d'importation RSS</span>
          <span>•</span>
          <span>Étape {currentStep} sur 4</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
          <Rss className="w-7 h-7 text-[#FFBF00]" /> Importer une émission via RSS
        </h1>
        <p className="text-sm text-[#888888]">
          Connectez un flux RSS externe pour créer l'émission et importer ses épisodes en continu.
        </p>
      </div>

      {/* Barre de progression des 4 étapes */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 1, title: "1. Adresse", desc: "URL du flux" },
            { id: 2, title: "2. Prévisualisation", desc: "Inspection des métadonnées" },
            { id: 3, title: "3. Réglages", desc: "Classification & droits" },
            { id: 4, title: "4. Import", desc: "Traitement des épisodes" },
          ].map(s => {
            const isActive = currentStep === s.id;
            const isDone = currentStep > s.id;
            return (
              <div
                key={s.id}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isActive 
                    ? "bg-[#222222] border-[#FFBF00] text-white" 
                    : isDone
                    ? "bg-[#141414] border-[#2A2A2A] text-[#B8B8B8]"
                    : "bg-[#0E0E0E] border-[#222222] text-[#555555] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-xs font-bold ${isActive ? "text-[#FFBF00]" : isDone ? "text-white" : ""}`}>
                    {s.title}
                  </span>
                  {isDone && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                </div>
                <p className="text-[11px] text-[#757575] truncate">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 8 — ÉTAPE 1 : ADRESSE DU FLUX                        */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in">
          <div>
            <h2 className="text-base font-bold text-white mb-1">Indiquez l'adresse URL du flux RSS</h2>
            <p className="text-xs text-[#888888]">
              Le lien doit être une adresse de flux XML/RSS valide fournie par votre hébergeur (Acast, Anchor, Libsyn, Buzzsprout, etc.).
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#888888] uppercase">
              URL du flux RSS <span className="text-[#FFBF00]">*</span>
            </label>
            <input 
              type="url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://anchor.fm/s/123456/podcast/rss"
              className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#555555]" 
            />
          </div>

          <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-start gap-3 text-xs text-[#888888]">
            <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Format d'adresse attendu :</p>
              <p>Vous devez fournir l'adresse brute du flux RSS (ex: https://feed.podbean.com/mon-podcast/feed.xml), et non l'adresse d'une page publique Spotify ou Apple Podcasts.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2A2A2A] flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={!url.trim() || isAnalyzing}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6 disabled:opacity-40"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse du flux en cours...</>
              ) : (
                <>Analyser le flux <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 9 — ÉTAPE 2 : PRÉVISUALISATION                       */}
      {/* ========================================================= */}
      {currentStep === 2 && previewData && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Cas particulier : Flux déjà connecté en base */}
          {previewData.existingPodcast ? (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ce flux RSS est déjà connecté</h3>
                <p className="text-xs text-[#888888] mt-1 max-w-md mx-auto">
                  L'émission « <strong>{previewData.existingPodcast.name}</strong> » utilise déjà cette adresse RSS. Vous pouvez ouvrir sa fiche pour gérer sa synchronisation.
                </p>
              </div>
              <div className="pt-2">
                <Link href={`/admin/podcasts/${previewData.existingPodcast.id}`}>
                  <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-10 px-6">
                    Ouvrir l'émission existante
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Carte des métadonnées détectées */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-28 h-28 rounded-xl bg-[#0B0B0B] border border-[#2A2A2A] overflow-hidden shrink-0">
                    {previewData.preview?.image ? (
                      <img src={previewData.preview.image} alt="Pochette détectée" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#222222]">
                        <ImageIcon className="w-8 h-8 text-[#555555]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider bg-[#FFBF00]/10 px-2 py-0.5 rounded">
                      Flux RSS Valide
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">
                      {previewData.preview?.title || "Émission sans titre"}
                    </h3>
                    <p className="text-xs text-[#888888] line-clamp-2">
                      {previewData.preview?.description || "Aucune description fournie dans le flux."}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#757575] pt-1">
                      <span>Auteur : <strong className="text-white">{previewData.preview?.author || "Non spécifié"}</strong></span>
                      <span>•</span>
                      <span>Langue : <strong className="text-white uppercase">{previewData.preview?.language || "FR"}</strong></span>
                      <span>•</span>
                      <span>Épisodes : <strong className="text-[#FFBF00]">{previewData.preview?.episodesCount || 0}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Liste d'exemples d'épisodes détectés */}
                <div className="space-y-3 pt-4 border-t border-[#2A2A2A]">
                  <h4 className="text-xs font-bold text-[#888888] uppercase tracking-wider flex items-center justify-between">
                    <span>Exemples d'épisodes détectés ({previewData.preview?.episodes?.length || 0})</span>
                    <span className="text-[11px] text-[#757575] font-normal">Aperçu sans création</span>
                  </h4>

                  <div className="border border-[#2A2A2A] rounded-xl overflow-hidden divide-y divide-[#2A2A2A] bg-[#0B0B0B]">
                    {(previewData.preview?.episodes || []).slice(0, 5).map((ep: any, idx: number) => {
                      const hasMedia = ep.audioUrl || ep.videoUrl || ep.enclosureUrl;
                      return (
                        <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-[#171717] text-[#757575] flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate">{ep.title}</p>
                              <p className="text-[11px] text-[#757575]">{ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString('fr-FR') : "Date inconnue"}</p>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {hasMedia ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7DD3FC] bg-[#15232D] px-2 py-0.5 rounded border border-[#1E3A4C]">
                                <Headphones className="w-3 h-3" /> Média prêt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <AlertCircle className="w-3 h-3" /> Sans média direct
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[#757575] italic">
                    Note : L'analyse seule ne crée ni ne publie aucun contenu sur Bamako Podcast.
                  </p>
                </div>
              </div>

              {/* Navigation étape 2 ➔ 3 */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Modifier l'URL
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6"
                >
                  Vérifier et régler l'import <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 10 — ÉTAPE 3 : VÉRIFICATION ET RÉGLAGES              */}
      {/* ========================================================= */}
      {currentStep === 3 && (
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in">
          <div className="border-b border-[#2A2A2A] pb-4">
            <h2 className="text-base font-bold text-white">Vérification des informations et réglages de synchronisation</h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Ajustez les métadonnées et configurez le comportement lors des prochaines synchronisations.
            </p>
          </div>

          <div className="space-y-6">
            {/* Nom et Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">
                  Nom de l'émission dans Bamako Podcast <span className="text-[#FFBF00]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white focus:border-[#FFBF00] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">
                  Description modifiée
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white focus:border-[#FFBF00] outline-none resize-none"
                />
              </div>
            </div>

            {/* Classification & Responsable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#2A2A2A]">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">
                  Langue principale
                </label>
                <select
                  value={formData.languageCode}
                  onChange={(e) => setFormData({...formData, languageCode: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white outline-none"
                >
                  {languages.map((l: any) => (
                    <option key={l.code} value={l.code}>{l.name} ({l.nativeName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase mb-1.5">
                  Organisation ou Créateur responsable
                </label>
                <select
                  value={formData.organizationId}
                  onChange={(e) => setFormData({...formData, organizationId: e.target.value})}
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-sm text-white outline-none"
                >
                  <option value="">Aucune (Propriétaire non revendiqué)</option>
                  {organizations.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Périmètre d'import */}
            <div className="space-y-3 pt-4 border-t border-[#2A2A2A]">
              <label className="block text-xs font-bold text-[#888888] uppercase">
                Périmètre des épisodes à importer
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: "ALL", label: "Tous les épisodes", desc: "Importe l'intégralité du catalogue" },
                  { id: "LAST_10", label: "Les 10 derniers", desc: "Pour les émissions très volumineuses" },
                  
                ].map(opt => (
                  <label 
                    key={opt.id} 
                    className={`p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      formData.importScope === opt.id 
                        ? "bg-[#222222] border-[#FFBF00]" 
                        : "bg-[#0B0B0B] border-[#2A2A2A] hover:border-[#444444]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="importScope"
                      checked={formData.importScope === opt.id}
                      onChange={() => setFormData({...formData, importScope: opt.id as any})}
                      className="hidden"
                    />
                    <p className="text-xs font-bold text-white">{opt.label}</p>
                    <p className="text-[11px] text-[#757575] mt-0.5">{opt.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Règles de synchronisation future */}
            <div className="space-y-3 pt-4 border-t border-[#2A2A2A]">
              <label className="block text-xs font-bold text-[#888888] uppercase mb-1">
                Comportement lors des prochaines synchronisations
              </label>

              <div className="space-y-2.5">
                <label className="flex items-center gap-3 p-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.syncEnabled}
                    onChange={(e) => setFormData({...formData, syncEnabled: e.target.checked})}
                    className="w-4 h-4 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Activer la scrutation automatique du flux RSS</p>
                    <p className="text-[11px] text-[#757575]">Récupère automatiquement les nouveaux épisodes publiés.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.keepManualEdits}
                    onChange={(e) => setFormData({...formData, keepManualEdits: e.target.checked})}
                    className="w-4 h-4 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Conserver les modifications manuelles sur Bamako Podcast</p>
                    <p className="text-[11px] text-[#757575]">Les titres, résumés ou pochettes retouchés ne seront pas écrasés.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.flagRemovedEpisodes}
                    onChange={(e) => setFormData({...formData, flagRemovedEpisodes: e.target.checked})}
                    className="w-4 h-4 rounded accent-[#FFBF00]"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Signaler un épisode retiré du flux d'origine sans le supprimer</p>
                    <p className="text-[11px] text-[#757575]">Évite les pertes accidentelles d'historique et de commentaires.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Retour à la prévisualisation
            </Button>
            <Button
              onClick={() => setCurrentStep(4)}
              className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6"
            >
              Confirmer et passer à l'import <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÉCRAN 11 — ÉTAPE 4 : IMPORT & PROGRESSION                  */}
      {/* ========================================================= */}
      {currentStep === 4 && (
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in">
          
          {!importResult && !isImporting && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-white">Récapitulatif avant import</h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  Vérifiez les paramètres d'importation. Les épisodes seront créés en mode <strong>brouillon</strong> par sécurité.
                </p>
              </div>

              <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Émission</span>
                  <span className="font-bold text-white">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Flux RSS</span>
                  <span className="font-mono text-white truncate max-w-xs">{url}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Nombre d'épisodes détectés</span>
                  <span className="font-bold text-[#FFBF00]">{previewData?.preview?.episodesCount || 0} épisodes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Statut initial</span>
                  <span className="font-bold text-white">Brouillon (DRAFT)</span>
                </div>
              </div>

              <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#888888] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Streaming direct :</strong> Les épisodes importés utilisent initialement les adresses distantes fournies par le flux RSS. Les fichiers ne sont pas copiés sur le serveur de stockage Cloudflare R2 de Bamako Podcast à ce stade.
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                  className="bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#222222] text-xs h-11 px-5"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Modifier les réglages
                </Button>
                <Button
                  onClick={handleStartImport}
                  className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-8"
                >
                  Importer en brouillon
                </Button>
              </div>
            </div>
          )}

          {/* En cours d'import avec progression réelle */}
          {isImporting && (
            <div className="py-12 flex flex-col items-center justify-center space-y-5 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#FFBF00]" />
              <div>
                <h3 className="text-base font-bold text-white">Importation en cours...</h3>
                <p className="text-xs text-[#888888] mt-1">{importStage}</p>
              </div>

              <div className="w-full max-w-md bg-[#0B0B0B] border border-[#2A2A2A] rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-[#FFBF00] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${importProgress}%` }}
                />
              </div>

              <span className="text-xs font-mono text-[#757575]">{importProgress}% complété</span>
            </div>
          )}

          {/* Résultat d'importation terminé */}
          {importResult && (
            <div className="space-y-6">
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-400 shrink-0 mt-1" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">{importResult.errorCount > 0 ? "Importation terminée avec des erreurs" : "Importation terminée avec succès !"}</h3>
                  <p className="text-xs text-[#CCCCCC]">
                    {importResult.successCount} épisode(s) ont été importés et rattachés à votre nouvelle émission.
                  </p>
                </div>
              </div>

              {importResult.errorCount > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-red-400">Erreurs rencontrées :</p>
                  <ul className="text-xs text-red-300 list-disc pl-4 space-y-1">
                    {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleStartImport}
                    className="text-xs bg-[#171717] border-red-500/30 text-white mt-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Réessayer les éléments en erreur
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A2A2A]">
                <Link href="/admin/podcasts">
                  <Button variant="ghost" className="text-xs text-[#888888] hover:text-white">
                    Retour à la liste des émissions
                  </Button>
                </Link>
                <Button
                  onClick={() => router.push(`/admin/podcasts/${importResult.createdPodcastId || "imported"}`)}
                  className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-11 px-6"
                >
                  Ouvrir l'émission <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
