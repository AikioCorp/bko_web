"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { formatBytes } from "@/lib/utils";
import {
  HardDrive,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  File,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  ExternalLink,
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  Clock,
  Rss,
  Loader2,
  Copy,
  Check,
  X,
  Layers,
  Cpu,
  ArrowRight,
  Database,
  Cloud,
  FileUp,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminMediaPage() {
  const [activeTab, setActiveTab] = useState<"assets" | "jobs" | "rss">("assets");

  // Filtres Médias
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "audio" | "video" | "image">("all");
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // SWR queries
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const {
    data: mediaData,
    mutate: mutateMedia,
    isLoading: isMediaLoading,
  } = useSWR(
    `/admin/media?page=${page}&limit=${limit}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`,
    fetcher
  );

  const {
    data: storageData,
    mutate: mutateStorage,
    isLoading: isStorageLoading,
  } = useSWR("/admin/storage", fetcher);

  // Média sélectionné pour prévisualisation
  const [previewAsset, setPreviewAsset] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Média à supprimer
  const [assetToDelete, setAssetToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Relance de job
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // Import RSS
  const [rssUrl, setRssUrl] = useState("");
  const [rssPreview, setRssPreview] = useState<any>(null);
  const [isCheckingRss, setIsCheckingRss] = useState(false);
  const [rssError, setRssError] = useState<string | null>(null);

  // Toast temporaire
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Suppression d'un fichier média
  const handleDeleteAsset = async () => {
    if (!assetToDelete) return;
    try {
      setIsDeleting(true);
      await adminApi(`/admin/media/${assetToDelete.id}`, { method: "DELETE" });
      await Promise.all([mutateMedia(), mutateStorage()]);
      showToast("Fichier supprimé du stockage avec succès.");
      setAssetToDelete(null);
      if (previewAsset?.id === assetToDelete.id) {
        setPreviewAsset(null);
      }
    } catch (e: any) {
      alert("Erreur lors de la suppression : " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Relance d'un job asynchrone échoué
  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingJobId(jobId);
      await adminApi(`/admin/jobs/${jobId}/retry`, { method: "POST" });
      await mutateStorage();
      showToast("Tâche relancée dans la file d'attente du worker.");
    } catch (e: any) {
      alert("Erreur lors de la relance : " + e.message);
    } finally {
      setRetryingJobId(null);
    }
  };

  // Tester un flux RSS
  const handlePreviewRss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssUrl.trim()) return;
    try {
      setIsCheckingRss(true);
      setRssError(null);
      setRssPreview(null);
      const res = await adminApi("/admin/rss/preview", {
        method: "POST",
        body: JSON.stringify({ url: rssUrl.trim() }),
      });
      setRssPreview(res.data?.preview || res.data);
    } catch (e: any) {
      setRssError(e.message || "Impossible d'analyser le flux RSS.");
    } finally {
      setIsCheckingRss(false);
    }
  };

  // Filtrage local par type de média (Audio / Vidéo / Image)
  const rawAssets = mediaData || [];
  const filteredAssets = useMemo(() => {
    if (!Array.isArray(rawAssets)) return [];
    return rawAssets.filter((item: any) => {
      const mime = (item.mimeType || "").toLowerCase();
      if (typeFilter === "audio") return mime.startsWith("audio/");
      if (typeFilter === "video") return mime.startsWith("video/");
      if (typeFilter === "image") return mime.startsWith("image/");
      return true;
    });
  }, [rawAssets, typeFilter]);

  // Helpers pour déterminer l'icône de média
  const getMediaMeta = (mimeType?: string) => {
    const mime = (mimeType || "").toLowerCase();
    if (mime.startsWith("audio/")) {
      return {
        label: "Audio",
        icon: FileAudio,
        badgeBg: "bg-[#102A1A] border-emerald-900/40",
        badgeText: "text-[#1DB954]",
      };
    }
    if (mime.startsWith("video/")) {
      return {
        label: "Vidéo",
        icon: FileVideo,
        badgeBg: "bg-[#251538] border-purple-900/40",
        badgeText: "text-purple-400",
      };
    }
    if (mime.startsWith("image/")) {
      return {
        label: "Image",
        icon: ImageIcon,
        badgeBg: "bg-[#0E2038] border-blue-900/40",
        badgeText: "text-blue-400",
      };
    }
    return {
      label: "Fichier",
      icon: File,
      badgeBg: "bg-[#1E1E1E] border-[#333333]",
      badgeText: "text-gray-400",
    };
  };

  return (
    <div className="w-full pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#2E2E2E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <HardDrive className="w-6 h-6 text-[#FFBF00]" />
              Imports & Médias
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1C1C1C] text-[#AAAAAA] border border-[#282828] flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              Cloudflare R2 / S3
            </span>
          </div>
          <p className="text-[#888888] text-xs md:text-sm mt-1">
            Supervision du stockage objet, historique des imports RSS et gestion des fichiers audio et vidéo.
          </p>
        </div>

        {/* Bouton Rafraîchir */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              mutateMedia();
              mutateStorage();
              showToast("Données de stockage actualisées.");
            }}
            className="bg-[#141414] hover:bg-[#202020] text-gray-300 hover:text-white border border-[#262626] text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Cartes KPI Stockage & Workers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Espace Total Consommé</span>
            <Database className="w-4 h-4 text-[#FFBF00]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {storageData?.totalBytes ? formatBytes(storageData.totalBytes) : "0 Mo"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Fichiers Objets Actifs</span>
            <File className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {storageData?.totalAssets ?? (Array.isArray(mediaData) ? mediaData.length : 0)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Tâches Worker en File</span>
            <Cpu className="w-4 h-4 text-[#1DB954]" />
          </div>
          <div className="text-2xl font-bold text-white">
            {storageData?.jobsByStatus?.reduce((acc: number, curr: any) => acc + curr.count, 0) ?? 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
          <div className="flex items-center justify-between text-[#888888] text-xs font-medium mb-1">
            <span>Tâches en Échec</span>
            <AlertCircle className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="text-2xl font-bold text-[#EF4444]">
            {storageData?.failedJobs?.length ?? 0}
          </div>
        </div>
      </div>

      {/* Navigation Onglets */}
      <div className="flex items-center gap-1.5 border-b border-[#222222] pb-3 mb-6">
        <button
          onClick={() => setActiveTab("assets")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
            activeTab === "assets"
              ? "bg-white text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Layers className="w-4 h-4" />
          Fichiers & Médias
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
            activeTab === "jobs"
              ? "bg-white text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Cpu className="w-4 h-4" />
          Tâches Worker ({storageData?.failedJobs?.length ? `${storageData.failedJobs.length} en échec` : "Actives"})
        </button>

        <button
          onClick={() => setActiveTab("rss")}
          className={classNames(
            "px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2",
            activeTab === "rss"
              ? "bg-white text-black"
              : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
          )}
        >
          <Rss className="w-4 h-4" />
          Importateur RSS
        </button>
      </div>

      {/* ONGLET 1 : FICHIERS & MÉDIAS */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par clé de stockage, format..."
                className="w-full bg-[#111111] border border-[#242424] rounded-xl pl-9 pr-9 py-2 text-xs md:text-sm text-white outline-none focus:border-[#444444] transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setTypeFilter("all")}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
                  typeFilter === "all"
                    ? "bg-[#2A2A2A] text-white"
                    : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
                )}
              >
                Tous les formats
              </button>
              <button
                onClick={() => setTypeFilter("audio")}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
                  typeFilter === "audio"
                    ? "bg-[#102A1A] text-[#1DB954] border border-emerald-900/50"
                    : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
                )}
              >
                <FileAudio className="w-3.5 h-3.5" />
                Audio (MP3 / WAV)
              </button>
              <button
                onClick={() => setTypeFilter("video")}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
                  typeFilter === "video"
                    ? "bg-[#251538] text-purple-400 border border-purple-900/50"
                    : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
                )}
              >
                <FileVideo className="w-3.5 h-3.5" />
                Vidéo (MP4)
              </button>
              <button
                onClick={() => setTypeFilter("image")}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5",
                  typeFilter === "image"
                    ? "bg-[#0E2038] text-blue-400 border border-blue-900/50"
                    : "bg-[#141414] text-[#888888] hover:text-white border border-[#242424]"
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Images (Pochettes)
              </button>
            </div>
          </div>

          {/* Tableau des Fichiers */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#222222] bg-[#0A0A0A]">
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Fichier & Clé S3</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Format</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Taille</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Propriétaire</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C1C1C]">
                  {isMediaLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-[#888888]">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#FFBF00]" />
                        Chargement de l'inventaire des médias...
                      </td>
                    </tr>
                  ) : filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-[#888888]">
                        Aucun fichier média correspondant trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset: any) => {
                      const meta = getMediaMeta(asset.mimeType);
                      const Icon = meta.icon;
                      const sizeFormatted = asset.sizeBytes ? formatBytes(Number(asset.sizeBytes)) : "0 B";

                      return (
                        <tr
                          key={asset.id}
                          className="hover:bg-[#161616] transition-colors group cursor-pointer"
                          onClick={() => setPreviewAsset(asset)}
                        >
                          {/* Clé S3 */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={classNames("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", meta.badgeBg)}>
                                <Icon className={classNames("w-5 h-5", meta.badgeText)} />
                              </div>
                              <div className="min-w-0">
                                <div className="font-mono text-xs text-white truncate max-w-[280px] md:max-w-[360px]" title={asset.key}>
                                  {asset.key}
                                </div>
                                <div className="text-[11px] text-[#666666] font-mono mt-0.5 truncate">
                                  Bucket: {asset.bucket || "bamako-podcast-media"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Format */}
                          <td className="px-6 py-4">
                            <span className={classNames("px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border", meta.badgeBg, meta.badgeText)}>
                              {asset.mimeType || "Inconnu"}
                            </span>
                          </td>

                          {/* Taille */}
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-gray-200">{sizeFormatted}</span>
                          </td>

                          {/* Propriétaire */}
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-300 font-medium">
                              {asset.owner?.fullName || "Système"}
                            </div>
                            {asset.owner?.email && (
                              <div className="text-[10px] text-[#777777] truncate max-w-[160px]">{asset.owner.email}</div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4">
                            <span className="text-xs text-[#777777]">
                              {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString("fr-FR") : "-"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {/* Copier clé */}
                              <button
                                title="Copier la clé"
                                onClick={() => handleCopyKey(asset.key)}
                                className="p-2 rounded-lg bg-[#141414] hover:bg-[#202020] text-[#888888] hover:text-white border border-[#242424] transition-colors"
                              >
                                {copiedKey === asset.key ? <Check className="w-3.5 h-3.5 text-[#1DB954]" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Supprimer */}
                              <button
                                title="Supprimer ce fichier"
                                onClick={() => setAssetToDelete(asset)}
                                className="p-2 rounded-lg bg-[#141414] hover:bg-[#2A1517] text-[#888888] hover:text-[#EF4444] border border-[#242424] hover:border-red-900/40 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ONGLET 2 : TÂCHES WORKER (BACKGROUND JOBS) */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          {/* État des Files */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
              <div className="text-xs text-[#888888] font-medium mb-1 flex items-center justify-between">
                <span>File d'importation RSS</span>
                <Rss className="w-4 h-4 text-[#FFBF00]" />
              </div>
              <div className="text-lg font-bold text-white">rss-importer</div>
              <p className="text-xs text-[#666666] mt-1">Synchronisation automatique des épisodes distants</p>
            </div>

            <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
              <div className="text-xs text-[#888888] font-medium mb-1 flex items-center justify-between">
                <span>File de transcodage média</span>
                <FileAudio className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg font-bold text-white">media-processing</div>
              <p className="text-xs text-[#666666] mt-1">Normalisation et optimisation audio/vidéo</p>
            </div>

            <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
              <div className="text-xs text-[#888888] font-medium mb-1 flex items-center justify-between">
                <span>File de transcription AI</span>
                <Cpu className="w-4 h-4 text-[#1DB954]" />
              </div>
              <div className="text-lg font-bold text-white">transcript-worker</div>
              <p className="text-xs text-[#666666] mt-1">Génération des chapitres et sous-titres</p>
            </div>
          </div>

          {/* Tâches Échouées nécessitant attention */}
          <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                  Tâches asynchrones en échec
                </h3>
                <p className="text-xs text-[#888888] mt-0.5">
                  Ces tâches ont rencontré une erreur lors de l'exécution et peuvent être relancées manuellement.
                </p>
              </div>
            </div>

            {storageData?.failedJobs?.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#0E1711] border border-emerald-900/40 text-emerald-300">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#1DB954]" />
                <div className="text-sm font-bold text-white">Aucune tâche en échec</div>
                <div className="text-xs opacity-80 mt-1">Toutes les opérations d'arrière-plan fonctionnent normalement.</div>
              </div>
            ) : (
              <div className="divide-y divide-[#222222] border border-[#222222] rounded-xl overflow-hidden">
                {storageData?.failedJobs?.map((job: any) => (
                  <div key={job.id} className="p-4 bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">{job.queueName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2E1417] text-[#EF4444] border border-red-900/40">
                          {job.attempts} tentative(s)
                        </span>
                      </div>
                      <p className="text-xs text-[#EF4444] mt-1 font-mono leading-relaxed bg-[#201012] p-2 rounded border border-red-900/30">
                        {job.lastError || "Erreur non documentée"}
                      </p>
                      <span className="text-[10px] text-[#666666] mt-1 block">
                        Dernier échec le {new Date(job.updatedAt).toLocaleString("fr-FR")}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleRetryJob(job.id)}
                      disabled={retryingJobId === job.id}
                      className="bg-[#202020] hover:bg-[#2E2E2E] text-white border border-[#333333] text-xs font-semibold shrink-0"
                    >
                      {retryingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
                      Relancer la tâche
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ONGLET 3 : IMPORTATEUR RSS */}
      {activeTab === "rss" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#111111] border border-[#222222]">
            <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
              <Rss className="w-5 h-5 text-[#FFBF00]" />
              Tester & Analyser un flux RSS de podcast
            </h3>
            <p className="text-xs text-[#888888] mb-5">
              Saisissez l'URL d'un flux RSS distant (Anchor, Acast, Buzzsprout, etc.) pour vérifier sa conformité et ses métadonnées.
            </p>

            <form onSubmit={handlePreviewRss} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="url"
                required
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder="https://anchor.fm/s/exemple/podcast/rss"
                className="flex-1 bg-[#161616] border border-[#2E2E2E] rounded-xl px-4 py-2.5 text-xs md:text-sm text-white outline-none focus:border-[#FFBF00] font-mono transition-colors"
              />
              <Button
                type="submit"
                disabled={isCheckingRss || !rssUrl.trim()}
                className="bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-bold text-xs py-2.5 px-6 rounded-xl shrink-0"
              >
                {isCheckingRss ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Analyser le flux
              </Button>
            </form>

            {rssError && (
              <div className="p-4 rounded-xl bg-[#2E1417] border border-red-900/50 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
                {rssError}
              </div>
            )}

            {/* Aperçu du Flux Analysé */}
            {rssPreview && (
              <div className="p-5 rounded-xl bg-[#161616] border border-[#2A2A2A] animate-in fade-in duration-200">
                <div className="flex flex-col md:flex-row items-start gap-4">
                  {rssPreview.image ? (
                    <img
                      src={rssPreview.image}
                      alt=""
                      className="w-24 h-24 rounded-xl object-cover border border-[#333333] shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-[#222222] border border-[#333333] flex items-center justify-center text-gray-500 shrink-0">
                      <Rss className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-[#1DB954] border border-emerald-900/40">
                        Flux Valide
                      </span>
                      <span className="text-xs text-[#888888] font-mono">
                        {rssPreview.episodesCount} épisodes détectés
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mt-1.5">{rssPreview.title}</h4>
                    <p className="text-xs text-[#AAAAAA] mt-1 line-clamp-2 leading-relaxed">
                      {rssPreview.description}
                    </p>

                    {rssPreview.sampleEpisodes?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[#262626]">
                        <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-2">
                          Derniers épisodes au catalogue :
                        </div>
                        <div className="space-y-1.5">
                          {rssPreview.sampleEpisodes.map((ep: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-300 flex items-center justify-between">
                              <span className="truncate pr-4">• {ep.title}</span>
                              <span className="text-[10px] text-[#666666] shrink-0 font-mono">
                                {ep.durationSeconds ? `${Math.round(ep.durationSeconds / 60)} min` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALE DE PRÉVISUALISATION DU MÉDIA */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#242424] mb-4">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-5 h-5 text-[#FFBF00]" />
                <h3 className="text-base font-bold text-white">Détails du média S3</h3>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="text-[#888888] hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Clé */}
              <div>
                <label className="text-[11px] font-bold text-[#777777] uppercase tracking-wider block mb-1">
                  Clé de stockage
                </label>
                <div className="p-2.5 rounded-xl bg-[#0D0D0D] border border-[#222222] font-mono text-xs text-white break-all flex items-center justify-between gap-2">
                  <span>{previewAsset.key}</span>
                  <button
                    onClick={() => handleCopyKey(previewAsset.key)}
                    className="p-1 rounded text-[#888888] hover:text-white shrink-0"
                  >
                    {copiedKey === previewAsset.key ? <Check className="w-4 h-4 text-[#1DB954]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Métadonnées */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
                  <span className="text-[#888888] block text-[11px]">Type MIME</span>
                  <span className="font-mono font-semibold text-white mt-0.5 block">{previewAsset.mimeType || "Inconnu"}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#181818] border border-[#262626]">
                  <span className="text-[#888888] block text-[11px]">Taille</span>
                  <span className="font-mono font-semibold text-white mt-0.5 block">
                    {previewAsset.sizeBytes ? formatBytes(Number(previewAsset.sizeBytes)) : "0 B"}
                  </span>
                </div>
              </div>

              {/* Propriétaire */}
              <div className="p-3 rounded-xl bg-[#181818] border border-[#262626] text-xs">
                <span className="text-[#888888] block text-[11px]">Propriétaire</span>
                <span className="text-white font-medium mt-0.5 block">
                  {previewAsset.owner?.fullName || "Système"} {previewAsset.owner?.email ? `(${previewAsset.owner.email})` : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#242424]">
              <Button
                variant="ghost"
                onClick={() => setPreviewAsset(null)}
                className="bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Fermer
              </Button>
              <Button
                onClick={() => {
                  setAssetToDelete(previewAsset);
                  setPreviewAsset(null);
                }}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION DE SUPPRESSION DE FICHIER */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#2E1417] border border-red-900/50 flex items-center justify-center text-[#EF4444] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer ce fichier média ?</h3>
                <p className="text-xs text-[#888888]">Suppression définitive de Cloudflare R2 / S3</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A1A1A] border border-[#282828] mb-4">
              <div className="text-xs font-mono text-white truncate">{assetToDelete.key}</div>
              <div className="text-[11px] text-[#888888] font-mono mt-1">
                Taille: {assetToDelete.sizeBytes ? formatBytes(Number(assetToDelete.sizeBytes)) : "0 B"}
              </div>
            </div>

            <p className="text-xs text-[#AAAAAA] mb-5 leading-relaxed">
              Le fichier sera définitivement détruit du stockage objet. Tout épisode ou élément dépendant de ce fichier sera désolidarisé.
            </p>

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setAssetToDelete(null)}
                disabled={isDeleting}
                className="bg-[#202020] hover:bg-[#2A2A2A] text-white text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteAsset}
                disabled={isDeleting}
                className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
