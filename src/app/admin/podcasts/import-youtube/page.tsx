"use client";
import { AdminPageAccess } from "@/components/admin/AdminAccess";
import { AdminAction } from "@/components/admin/AdminAccess";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  Youtube,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
  Layers,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Plus,
  Sliders,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminYoutubeImportPage() {
  const [activeTab, setActiveTab] = useState<"list" | "new">("list");

  // Step state for new import
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  // Form data for creating or connecting
  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [existingPodcastId, setExistingPodcastId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [languageCode, setLanguageCode] = useState("fr");
  const [countryId, setCountryId] = useState("ML");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [autoPublish, setAutoPublish] = useState(false);
  const [excludeShorts, setExcludeShorts] = useState(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // SWR hooks
  const { data: channelsData, mutate: mutateChannels, isLoading: loadingChannels } = useSWR(
    "/admin/youtube/imports",
    (u) => adminApi(u).then((res) => res.data)
  );

  const { data: podcastsData } = useSWR("/admin/catalog", (u) => adminApi(u).then((res) => res.data));
  const { data: catData } = useSWR("/admin/categories", (u) => adminApi(u).then((res) => res.data));
  const { data: langData } = useSWR("/admin/languages", (u) => adminApi(u).then((res) => res.data));

  const channels = channelsData || [];
  const podcasts = podcastsData?.items || podcastsData || [];
  const categories = (catData || []).filter((c: any) => c.isActive);
  const languages = (langData || []).filter((l: any) => l.isActive);

  // Analyser l'URL YouTube
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setPreviewData(null);

    try {
      const res = await adminApi("/admin/youtube/preview", {
        method: "POST",
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.success) throw new Error(res.message || "Erreur de résolution.");

      setPreviewData(res.data);
      setName(res.data.channel.title || "");
      setDescription(res.data.channel.description || "");
      setCover(res.data.channel.thumbnailUrl || "");

      // Sélectionner par défaut toutes les vidéos non encore importées (en respectant l'exclusion des shorts)
      const unimported = new Set<string>();
      const videoList = res.data.videos || res.data.items || [];
      videoList.forEach((item: any) => {
        const vid = item.videoId || item.youtubeVideoId;
        const isAlready = item.alreadyImported ?? item.isAlreadyImported ?? false;
        const isShort = item.isLikelyShort === true;
        if (!isAlready && vid && (!excludeShorts || !isShort)) {
          unimported.add(vid);
        }
      });
      setSelectedVideoIds(unimported);
    } catch (err: any) {
      setError(err.message || "Impossible d'analyser cette URL YouTube.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleExcludeShorts = (val: boolean) => {
    setExcludeShorts(val);
    if (!previewData) return;
    const videoList = previewData.videos || previewData.items || [];
    const next = new Set(selectedVideoIds);
    videoList.forEach((item: any) => {
      const vid = item.videoId || item.youtubeVideoId;
      if (!vid) return;
      if (val && item.isLikelyShort) {
        next.delete(vid);
      }
    });
    setSelectedVideoIds(next);
  };

  const toggleVideo = (videoId: string) => {
    const next = new Set(selectedVideoIds);
    if (next.has(videoId)) next.delete(videoId);
    else next.add(videoId);
    setSelectedVideoIds(next);
  };

  const handleLaunchImport = async () => {
    if (!previewData) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        channelUrl: url.trim(),
        autoPublish,
        excludeShorts,
        selectedVideoIds: Array.from(selectedVideoIds),
      };

      if (targetMode === "existing") {
        if (!existingPodcastId) throw new Error("Veuillez sélectionner une émission existante.");
        payload.existingPodcastId = existingPodcastId;
      } else {
        if (!name.trim()) throw new Error("Le nom de l'émission est requis.");
        payload.name = name.trim();
        payload.description = description.trim();
        payload.cover = cover.trim();
        payload.languageCode = languageCode;
        payload.countryId = countryId;
        payload.categoryIds = selectedCategoryIds;
      }

      const res = await adminApi("/admin/youtube/imports", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.success) throw new Error(res.message || "Erreur lors du lancement de l'import.");

      setSuccessMessage("Chaîne YouTube connectée avec succès ! Synchronisation en cours.");
      mutateChannels();
      setActiveTab("list");
      setPreviewData(null);
      setUrl("");
    } catch (err: any) {
      setError(err.message || "Erreur lors du traitement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Synchronisation manuelle admin
  const handleSyncNow = async (podcastId: string) => {
    try {
      await adminApi(`/admin/podcasts/${podcastId}/youtube/sync`, { method: "POST" });
      mutateChannels();
    } catch (err: any) {
      alert("Erreur de synchronisation : " + err.message);
    }
  };

  // Suspendre ou reprendre la synchronisation
  const handleToggleSync = async (podcastId: string, currentStatus: boolean) => {
    try {
      await adminApi(`/admin/podcasts/${podcastId}/youtube/settings`, {
        method: "PATCH",
        body: JSON.stringify({ syncEnabled: !currentStatus }),
      });
      mutateChannels();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    }
  };

  // Déconnecter la chaîne
  const handleDisconnect = async (podcastId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir déconnecter cette chaîne ? Les épisodes existants seront conservés.")) return;
    try {
      await adminApi(`/admin/podcasts/${podcastId}/youtube`, { method: "DELETE" });
      mutateChannels();
    } catch (err: any) {
      alert("Erreur lors de la déconnexion : " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <AdminPageAccess href="/admin/podcasts"><Link href="/admin/podcasts" className="hover:text-white flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /> Émissions
            </Link></AdminPageAccess>
            <span>/</span>
            <span className="text-[#FF0000] font-bold">YouTube Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Youtube className="w-7 h-7 text-[#FF0000]" />
            Gestion des Chaînes & Synchronisations YouTube
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Connectez des chaînes YouTube, pilotez la synchronisation périodique et gérez les flux Atom en conformité avec les directives Bamako Podcast.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "list" ? "default" : "outline"}
            onClick={() => setActiveTab("list")}
            className={activeTab === "list" ? "bg-[#FFBF00] text-black font-bold" : "border-[#333333] text-gray-300"}
          >
            Chaînes connectées ({channels.length})
          </Button>
          <AdminAction permission="catalog.create"><Button
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className={activeTab === "new" ? "bg-[#FF0000] text-white font-bold" : "border-[#333333] text-gray-300"}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Connecter une chaîne
          </Button></AdminAction>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="font-bold text-emerald-400 hover:underline">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold text-red-400 hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Onglet 1 : Liste des chaînes connectées */}
      {activeTab === "list" && (
        <div className="space-y-4">
          {loadingChannels ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
            </div>
          ) : channels.length === 0 ? (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-12 text-center space-y-3">
              <Youtube className="w-10 h-10 text-gray-600 mx-auto" />
              <h3 className="text-white font-bold text-sm">Aucune chaîne YouTube connectée</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Connectez une chaîne YouTube pour alimenter le catalogue Bamako Podcast avec des émissions vidéo natives.
              </p>
              <AdminAction permission="catalog.create"><Button onClick={() => setActiveTab("new")} className="bg-[#FF0000] text-white font-bold text-xs mt-2">
                Connecter la première chaîne
              </Button></AdminAction>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {channels.map((c: any) => {
                const latestRun = c.syncRuns?.[0];
                return (
                  <div
                    key={c.id}
                    className="bg-[#111111] border border-[#222222] hover:border-[#333333] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition"
                  >
                    <div className="flex items-start gap-4">
                      {c.thumbnailUrl && (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.channelTitle}
                          className="w-14 h-14 rounded-xl object-cover bg-black border border-[#222222]"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-white font-bold text-sm">{c.channelTitle}</h4>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                              c.syncStatus === "SYNCING"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                                : c.syncEnabled
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                            }`}
                          >
                            {c.syncStatus}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Émission :{" "}
                          <AdminPageAccess href={`/admin/podcasts/${c.podcast?.id}`}><Link
                            href={`/admin/podcasts/${c.podcast?.id}`}
                            className="text-[#FFBF00] font-bold hover:underline"
                          >
                            {c.podcast?.name || "Sans nom"}
                          </Link></AdminPageAccess>{" "}
                          • <span className="font-mono text-[11px]">ID : {c.channelId}</span>
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-0.5">
                          <span>Vidéos : <strong className="text-white">{c._count?.importedVideos || 0}</strong></span>
                          <span>•</span>
                          <span>Dernier sync : {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString("fr-FR") : "Jamais"}</span>
                          {latestRun && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">
                                +{latestRun.episodesImported} nouveau(x)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <AdminAction permission="catalog.edit"><Button
                        size="sm"
                        onClick={() => handleSyncNow(c.podcastId)}
                        className="bg-[#FFBF00] hover:bg-[#F5B82E] text-black text-xs font-bold"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Synchroniser
                      </Button></AdminAction>
                      <AdminAction permission="catalog.edit"><Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleSync(c.podcastId, c.syncEnabled)}
                        className="border-[#333333] text-gray-300 text-xs font-bold"
                      >
                        {c.syncEnabled ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {c.syncEnabled ? "Suspendre" : "Reprendre"}
                      </Button></AdminAction>
                      <AdminAction permission="catalog.delete"><Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(c.podcastId)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button></AdminAction>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Onglet 2 : Connexion d'une nouvelle chaîne */}
      {activeTab === "new" && (
        <div className="space-y-6">
          <AdminAction permission="catalog.create"><form onSubmit={handleAnalyze} className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                URL ou identifiant de la chaîne YouTube
              </label>
              <p className="text-xs text-gray-400">
                Saisissez l'URL d'une chaîne (<code className="text-[#FFBF00]">https://youtube.com/@chaine</code>,{" "}
                <code className="text-[#FFBF00]">/channel/UC...</code>) ou son identifiant. Les liens de vidéos isolées sont refusés.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Ex : https://www.youtube.com/@lespitchounestv"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 bg-black border border-[#222222] focus:border-[#FFBF00] text-white text-sm px-4 py-3 rounded-xl outline-none placeholder:text-gray-600"
              />
              <Button
                type="submit"
                disabled={isAnalyzing || !url.trim()}
                className="bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold px-6 py-3 rounded-xl text-sm"
              >
                {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {isAnalyzing ? "Analyse..." : "Analyser la chaîne"}
              </Button>
            </div>
          </form></AdminAction>

          {previewData && (
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-6">
              {/* Infos Chaîne détectée */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
                <div className="flex items-center gap-4">
                  {previewData.channel.thumbnailUrl && (
                    <img
                      src={previewData.channel.thumbnailUrl}
                      alt={previewData.channel.title}
                      className="w-14 h-14 rounded-full border border-[#222222] object-cover bg-black"
                    />
                  )}
                  <div>
                    <h3 className="text-white font-black text-lg">{previewData.channel.title}</h3>
                    <p className="text-xs text-gray-400 font-mono">
                      ID : {previewData.channel.channelId} {previewData.channel.customUrl && `• ${previewData.channel.customUrl}`}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">{previewData.channel.description}</p>
                  </div>
                </div>

                <div className="text-xs text-right text-gray-400">
                  <p>Vidéos dans le flux : <strong className="text-white">{(previewData.videos || previewData.items || []).length}</strong></p>
                  <p>Sélectionnées : <strong className="text-[#FFBF00]">{selectedVideoIds.size}</strong></p>
                </div>
              </div>

              {/* Choix Destination : Nouvelle émission ou existante */}
              <div className="bg-black border border-[#222222] rounded-xl p-5 space-y-4 text-xs">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FFBF00]" /> Destination & Paramètres éditoriaux
                </h4>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === "new"}
                      onChange={() => setTargetMode("new")}
                      className="text-[#FFBF00]"
                    />
                    <span>Créer une nouvelle émission</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={targetMode === "existing"}
                      onChange={() => setTargetMode("existing")}
                      className="text-[#FFBF00]"
                    />
                    <span>Lier à une émission existante</span>
                  </label>
                </div>

                {targetMode === "existing" ? (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-gray-400">Choisir l'émission existante :</label>
                    <select
                      value={existingPodcastId}
                      onChange={(e) => setExistingPodcastId(e.target.value)}
                      className="w-full bg-[#111111] border border-[#222222] text-white px-3 py-2.5 rounded-lg outline-none"
                    >
                      <option value="">Sélectionner une émission...</option>
                      {podcasts.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-gray-400">Nom de l'émission :</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#111111] border border-[#222222] text-white px-3 py-2 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400">Langue principale :</label>
                      <select
                        value={languageCode}
                        onChange={(e) => setLanguageCode(e.target.value)}
                        className="w-full bg-[#111111] border border-[#222222] text-white px-3 py-2 rounded-lg outline-none"
                      >
                        {languages.map((l: any) => (
                          <option key={l.code} value={l.code}>
                            {l.name} ({l.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={autoPublish}
                      onChange={(e) => setAutoPublish(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FFBF00]"
                    />
                    <span>Publier directement les vidéos importées (sinon état Brouillon)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#FFBF00] font-semibold">
                    <input
                      type="checkbox"
                      checked={excludeShorts}
                      onChange={(e) => handleToggleExcludeShorts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#FFBF00]"
                    />
                    <span>Exclure les YouTube Shorts (≤ 60s)</span>
                  </label>
                </div>
              </div>

              {/* Liste des vidéos sélectionnables */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#222222] pb-2">
                  <h4 className="text-white font-bold">Vidéos à importer ({selectedVideoIds.size}/{(previewData.videos || previewData.items || []).length})</h4>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const std = new Set<string>();
                        (previewData.videos || previewData.items || []).forEach((i: any) => {
                          const vid = i.videoId || i.youtubeVideoId;
                          if (vid && !i.isLikelyShort) std.add(vid);
                        });
                        setSelectedVideoIds(std);
                      }}
                      className="text-emerald-400 font-bold hover:underline"
                    >
                      Standards uniquement
                    </button>
                    <span className="text-gray-600">•</span>
                    <button
                      onClick={() => {
                        const all = new Set<string>();
                        (previewData.videos || previewData.items || []).forEach((i: any) => {
                          const vid = i.videoId || i.youtubeVideoId;
                          if (vid) all.add(vid);
                        });
                        setSelectedVideoIds(all);
                      }}
                      className="text-[#FFBF00] font-bold hover:underline"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-gray-600">•</span>
                    <button onClick={() => setSelectedVideoIds(new Set())} className="text-gray-400 font-bold hover:underline">
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {(previewData.videos || previewData.items || []).map((item: any) => {
                    const vid = item.videoId || item.youtubeVideoId;
                    const isChecked = selectedVideoIds.has(vid);
                    const isAlready = item.alreadyImported ?? item.isAlreadyImported ?? false;
                    return (
                      <div
                        key={vid}
                        onClick={() => toggleVideo(vid)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer text-xs transition ${
                          isChecked
                            ? "bg-[#1A2234] border-[#E5A93C]/40"
                            : "bg-black border-[#222222] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#FFBF00] shrink-0"
                          />
                          {item.thumbnailUrl && (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-16 h-10 object-cover rounded bg-black shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-lg">{item.title}</p>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span>
                                {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("fr-FR") : "Date inconnue"}
                              </span>
                              {item.durationLabel && (
                                <>
                                  <span>•</span>
                                  <span>{item.durationLabel}</span>
                                </>
                              )}
                              {item.isLikelyShort ? (
                                <span className="text-[10px] bg-red-950/70 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded font-bold">
                                  Short (≤ 60s)
                                </span>
                              ) : (
                                <span className="text-[10px] bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded font-bold">
                                  Standard
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                          isAlready
                            ? "bg-slate-800 text-slate-400"
                            : isChecked
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-gray-800 text-gray-500"
                        }`}>
                          {isAlready ? "Déjà importé" : isChecked ? "Sélectionné" : "Exclu"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bouton d'action */}
              <div className="pt-4 border-t border-[#222222] flex justify-end">
                <AdminAction permission="catalog.create"><Button
                  onClick={handleLaunchImport}
                  disabled={isSubmitting || selectedVideoIds.size === 0}
                  className="bg-[#FF0000] hover:bg-[#CC0000] text-white font-extrabold px-8 py-3 text-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  {isSubmitting ? "Lancement de l'import..." : `Lancer l'importation (${selectedVideoIds.size} vidéos)`}
                </Button></AdminAction>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
