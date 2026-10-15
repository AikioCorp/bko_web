"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";
import {
  Youtube,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Filter,
  Calendar,
  Clock,
  Layers,
  Pause,
  Sliders,
  History,
  Info,
  ExternalLink,
} from "lucide-react";

export default function PodcastYoutubePage() {
  const params = useParams();
  const podcastId = params.id as string;

  // Formulaire de prévisualisation
  const [channelInput, setChannelInput] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Sélection & Filtres
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoPublish, setAutoPublish] = useState(false);
  const [initialImportMode,setInitialImportMode]=useState<"SELECT"|"FUTURE_ONLY">("SELECT");
  const [loadingMore,setLoadingMore]=useState(false);
  const [historicalSelected,setHistoricalSelected]=useState<Set<string>>(new Set());
  const [importingHistorical,setImportingHistorical]=useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [keepManualEdits, setKeepManualEdits] = useState(true);
  const [excludeShorts, setExcludeShorts] = useState(true);
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");

  // Statut actuel de la chaîne connectée
  const [channelStatus, setChannelStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Historique paginé
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [historicalNextPageToken, setHistoricalNextPageToken] = useState<string | null>(null);
  const [historicalVideos, setHistoricalVideos] = useState<any[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(false);
  const [historicalError, setHistoricalError] = useState("");

  const fetchStatus = () => {
    const token = getAccessToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const status=json.data.channel || json.data;
          setChannelStatus({...status,counts:json.data.counts});
          setAutoSync(status.syncEnabled===true);
          json.data=status;
          if (json.data.importSettings) {
            setAutoPublish(!!json.data.importSettings.autoPublish);
            setKeepManualEdits(json.data.importSettings.keepManualEdits !== false);
            if (json.data.importSettings.excludeShorts !== undefined) {
              setExcludeShorts(json.data.importSettings.excludeShorts);
            }
            setIncludeKeywords((json.data.importSettings.filterKeywords || json.data.importSettings.includeKeywords)?.join(", ") || "");
            setExcludeKeywords(json.data.importSettings.excludeKeywords?.join(", ") || "");
          }
        } else {
          setChannelStatus(null);
        }
      })
      .catch(() => setErrorMessage("Impossible de charger le statut de la chaîne. Réessayez avant de la reconnecter."))
      .finally(() => setLoadingStatus(false));
  };

  useEffect(() => {
    fetchStatus();
    const timer=setInterval(()=>{if(document.visibilityState==="visible")fetchStatus();},10000);
    return ()=>clearInterval(timer);
  }, [podcastId]);

  // Analyse et prévisualisation d'une URL de chaîne
  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setPreviewData(null);
    setLoadingPreview(true);

    const token = getAccessToken();
    if (!token) {
      setErrorMessage("Veuillez vous connecter pour continuer.");
      setLoadingPreview(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/creator/youtube/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: channelInput, podcastId }),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error?.message || json.message || "Impossible d'analyser cette chaîne YouTube.");
      } else {
        setPreviewData(json.data);
        // Par défaut, sélectionner toutes les vidéos non encore importées (en respectant excludeShorts)
        const unimported = new Set<string>();
        const list = json.data.items || json.data.videos || [];
        list.forEach((item: any) => {
          const vid = item.youtubeVideoId || item.videoId;
          const isAlready = item.isAlreadyImported ?? item.alreadyImported ?? false;
          const isShort = item.isLikelyShort === true;
          if (!isAlready && item.embeddable!==false && vid && (!excludeShorts || !isShort)) unimported.add(vid);
        });
        setSelectedIds(unimported);
      }
    } catch {
      setErrorMessage("Erreur réseau lors de la communication avec le serveur.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadMoreVideos=async()=>{
    if(!previewData?.nextPageToken||loadingMore)return;setLoadingMore(true);setErrorMessage("");
    try{const res=await fetch(API_BASE_URL+"/creator/youtube/preview",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+getAccessToken()},body:JSON.stringify({url:previewData.channel.channelId,podcastId,pageToken:previewData.nextPageToken})});const json=await res.json();if(!res.ok||!json.success)throw new Error(json.error?.message||"Chargement impossible");setPreviewData((prev:any)=>{const items=Array.from(new Map([...(prev.items||[]),...(json.data.items||[])].map((i:any)=>[i.videoId,i])).values());return {...json.data,items,videos:items};});}catch(e:any){setErrorMessage(e.message);}finally{setLoadingMore(false);}
  };
  const importHistorical=async()=>{
    if(!historicalSelected.size)return;setImportingHistorical(true);setHistoricalError("");
    try{const res=await fetch(API_BASE_URL+"/creator/podcasts/"+podcastId+"/youtube/historical-import",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+getAccessToken()},body:JSON.stringify({selectedVideoIds:Array.from(historicalSelected)})});const json=await res.json();if(!res.ok||!json.success)throw new Error(json.error?.message||"Import impossible");setHistoricalSelected(new Set());setShowHistoricalModal(false);setInfoMessage("Importation des archives placée en file d’attente.");fetchStatus();}catch(e:any){setHistoricalError(e.message);}finally{setImportingHistorical(false);}
  };
  // Filtrage local en temps réel des vidéos prévisualisées
  const filteredPreviewItems = useMemo(() => {
    const rawList = previewData?.items || previewData?.videos;
    if (!rawList) return [];
    return rawList.filter((item: any) => {
      if (excludeShorts && item.isLikelyShort) return false;
      const titleLower = (item.title || "").toLowerCase();
      if (includeKeywords) {
        const inc = includeKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        if (inc.length > 0 && !inc.some((k: string) => titleLower.includes(k))) return false;
      }
      if (excludeKeywords) {
        const exc = excludeKeywords.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
        if (exc.length > 0 && exc.some((k: string) => titleLower.includes(k))) return false;
      }
      return true;
    });
  }, [previewData, includeKeywords, excludeKeywords, excludeShorts]);

  useEffect(()=>{
    const allowed=new Set(filteredPreviewItems.filter((i:any)=>!i.isAlreadyImported && !i.alreadyImported && i.embeddable!==false).map((i:any)=>i.videoId||i.youtubeVideoId));
    setSelectedIds(previous=>{const next=new Set(Array.from(previous).filter(id=>allowed.has(id)));return next.size===previous.size?previous:next;});
  },[filteredPreviewItems]);

  const toggleSelect = (videoId: string) => {
    const next = new Set(selectedIds);
    if (next.has(videoId)) next.delete(videoId);
    else next.add(videoId);
    setSelectedIds(next);
  };

  const selectAll = () => {
    const all = new Set<string>();
    filteredPreviewItems.forEach((i: any) => {
      const vid = i.youtubeVideoId || i.videoId;
      if (vid && !i.isAlreadyImported && !i.alreadyImported && i.embeddable!==false) all.add(vid);
    });
    setSelectedIds(all);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Connexion de la chaîne
  const handleConnect = async () => {
    if (!previewData) return;
    if(selectedIds.size>500){setErrorMessage("Sélectionnez au maximum 500 vidéos par import.");return;}
    setConnecting(true);
    setErrorMessage("");

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channelId: previewData.channel.channelId,
          channelTitle: previewData.channel.title,
          channelDescription: previewData.channel.description,
          thumbnailUrl: previewData.channel.thumbnailUrl,
          customUrl: previewData.channel.customUrl,
          uploadsPlaylistId: previewData.channel.uploadsPlaylistId,
          feedUrl: previewData.channel.feedUrl,
          selectedVideoIds: Array.from(selectedIds),
          settings: {
            autoPublish,
            initialImportMode,
            keepManualEdits,
            autoSyncFuture: autoSync,
            excludeShorts,
            filterKeywords: includeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
            excludeKeywords: excludeKeywords.split(",").map((s) => s.trim()).filter(Boolean),
            importScope: selectedIds.size > 0 ? "SELECT" : "ALL",
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setPreviewData(null);
        setChannelInput("");
        setInfoMessage("Chaîne connectée ! L'importation s'exécute en tâche de fond.");
        fetchStatus();
      } else {
        setErrorMessage(json.error?.message || json.message || "Erreur de connexion");
      }
    } catch {
      setErrorMessage("Erreur réseau");
    } finally {
      setConnecting(false);
    }
  };

  // Synchronisation manuelle
  const handleSyncNow = async () => {
    setSyncing(true);
    setErrorMessage("");
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.error?.message || json.message);
      } else {
        setInfoMessage("Synchronisation démarrée en tâche de fond.");
        setTimeout(fetchStatus, 2500);
      }
    } catch {
      setErrorMessage("Erreur lors de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  // Suspendre ou reprendre la synchronisation
  const handleToggleSync = async () => {
    if (!channelStatus) return;
    setUpdatingSettings(true);
    const token = getAccessToken();
    if (!token) return;

    try {
      const nextSync = !channelStatus.syncEnabled;
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          syncEnabled: nextSync,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchStatus();
      }
    } catch {
      setErrorMessage("Erreur de mise à jour des paramètres");
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Déconnexion de la chaîne
  const handleDisconnect = async () => {
    const confirmMsg =
      "Souhaitez-vous déconnecter cette chaîne YouTube ?\n\nPar défaut, vos épisodes déjà importés seront conservés dans votre émission.";
    if (!window.confirm(confirmMsg)) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setChannelStatus(null);
        setInfoMessage("Chaîne YouTube déconnectée avec succès.");
      }
    } catch {
      setErrorMessage("Erreur lors de la déconnexion");
    }
  };

  // Chargement des archives historiques
  const handleFetchHistorical = async (pageToken?: string) => {
    setLoadingHistorical(true);
    setHistoricalError("");
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/youtube/historical-import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageToken,
          maxResults: 25,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setHistoricalVideos((prev) => (pageToken ? [...prev, ...json.data.videos] : json.data.videos));
        setHistoricalNextPageToken(json.data.nextPageToken || null);
      } else {
        setHistoricalError(json.error?.message || json.message || "Erreur de récupération des archives.");
      }
    } catch {
      setHistoricalError("Impossible de joindre le serveur.");
    } finally {
      setLoadingHistorical(false);
    }
  };

  return (
    <div className="w-full py-4 space-y-8">
      {/* En-tête */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 sm:p-8 space-y-3">
        <div className="flex items-center space-x-2.5 text-[#FF0000]">
          <Youtube className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Passerelle Officielle YouTube</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Importation & Synchronisation de Chaîne</h1>
        <p className="text-xs text-gray-400 max-w-3xl leading-relaxed">
          Associez une chaîne YouTube à votre émission pour importer vos vidéos de manière fluide. Les épisodes utilisent le lecteur officiel YouTube (aucune extraction audio non autorisée). Les synchronisations protègent vos modifications éditoriales locales.
        </p>
      </div>

      {infoMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
          <button onClick={() => setInfoMessage("")} className="font-bold text-emerald-400 hover:underline">
            Fermer
          </button>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage("")} className="font-bold text-red-400 hover:underline">
            Fermer
          </button>
        </div>
      )}

      {/* État 1 : Chaîne déjà connectée */}
      {channelStatus ? (
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
            <div className="flex items-start gap-4">
              {channelStatus.thumbnailUrl && (
                <img
                  src={channelStatus.thumbnailUrl}
                  alt={channelStatus.channelTitle}
                  className="w-14 h-14 rounded-full border border-[#1E2638] object-cover bg-black"
                />
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{channelStatus.channelTitle}</h3>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      channelStatus.syncStatus === "SYNCING"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
                        : channelStatus.syncEnabled
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-700/30 text-slate-400 border-slate-600/30"
                    }`}
                  >
                    {channelStatus.syncStatus}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">
                  ID : {channelStatus.channelId} {channelStatus.customUrl && `• ${channelStatus.customUrl}`}
                </p>
                <p className="text-[11px] text-gray-500">
                  Abonnement WebSub : {channelStatus.webSubStatus === "ACTIVE" ? "Actif (Push)" : "Passif (Polling 6h)"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="bg-[#E5A93C] hover:bg-[#F5B82E] text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Synchronisation..." : "Synchroniser maintenant"}</span>
              </button>

              <button
                onClick={handleToggleSync}
                disabled={updatingSettings}
                className="bg-[#1A2234] hover:bg-[#222C42] border border-[#2D3952] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                {channelStatus.syncEnabled ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{channelStatus.syncEnabled ? "Suspendre" : "Reprendre"}</span>
              </button>

              <button
                onClick={() => {
                  setShowHistoricalModal(true);
                  if (historicalVideos.length === 0) handleFetchHistorical();
                }}
                className="bg-[#1A2234] hover:bg-[#222C42] border border-[#2D3952] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <History className="w-3.5 h-3.5 text-[#FFBF00]" />
                <span>Archives anciennes</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Déconnecter</span>
              </button>
            </div>
          </div>

          {/* Cartes métriques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Vidéos Importées</span>
              <p className="text-xl font-black text-white">{channelStatus._count?.importedVideos || 0}</p>
            </div>

            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Dernière Vérification</span>
              <p className="text-xs font-bold text-gray-300">
                {channelStatus.lastSyncAt ? new Date(channelStatus.lastSyncAt).toLocaleString("fr-FR") : "Jamais"}
              </p>
            </div>

            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Prochaine Vérification</span>
              <p className="text-xs font-bold text-gray-300">
                {channelStatus.nextSyncAt ? new Date(channelStatus.nextSyncAt).toLocaleString("fr-FR") : channelStatus.syncEnabled ? "En attente" : "Désactivée"}
              </p>
            </div>

            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Mode Publication</span>
              <p className="text-xs font-bold text-gray-300">
                {channelStatus.importSettings?.autoPublish ? "Directe (Publié)" : "Brouillons"}
              </p>
            </div>
          </div>

          {/* Historique des SyncRuns */}
          {channelStatus.syncRuns && channelStatus.syncRuns.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#1E2638]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dernières synchronisations</h4>
              <div className="space-y-2">
                {channelStatus.syncRuns.map((run: any) => (
                  <div key={run.id} className="bg-[#0A0D14] p-3 rounded-lg border border-[#1E2638] flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-gray-300">{new Date(run.startedAt).toLocaleString("fr-FR")}</span>
                      {run.trigger && (
                        <span className="text-[10px] text-gray-500 uppercase px-1.5 py-0.5 rounded bg-slate-800">
                          {run.trigger}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 flex items-center gap-3">
                      {run.errorMessage&&<p className="w-full whitespace-pre-wrap text-red-400">{run.errorMessage}</p>}
                      <span>Erreurs : {run.videosFailed || 0}</span>
                      <span>Nouveaux : <strong className="text-white">{run.videosImported}</strong></span>
                      <span>Mis à jour : <strong className="text-white">{run.videosUpdated}</strong></span>
                      <span>Ignorés : <strong className="text-slate-400">{run.videosSkipped}</strong></span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                        {run.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* État 2 : Pas encore connecté -> Formulaire de connexion */
        <div className="space-y-6">
          <p className="text-sm text-gray-400">{previewData?.note}</p>
          {previewData?.nextPageToken&&<button disabled={loadingMore} onClick={()=>void loadMoreVideos()} className="text-sm text-[#FFBF00]">{loadingMore?"Chargement…":"Charger les vidéos suivantes / anciennes"}</button>}
          {previewData&&<label className="block text-sm">Import initial<select value={initialImportMode} onChange={e=>setInitialImportMode(e.target.value as any)} className="ml-3 rounded-lg bg-[#222] p-2"><option value="SELECT">Importer les vidéos sélectionnées</option><option value="FUTURE_ONLY">Ne suivre que les prochaines publications</option></select></label>}
          <form onSubmit={handlePreview} className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="space-y-1">
              <label htmlFor="channel-url" className="text-xs font-bold text-white uppercase tracking-wider">
                URL ou identifiant de la chaîne YouTube
              </label>
              <p className="text-xs text-gray-400">
                Exemples pris en charge : <code className="text-[#FFBF00]">https://youtube.com/@MaChaine</code>,{" "}
                <code className="text-[#FFBF00]">https://youtube.com/channel/UC...</code>, ou simplement{" "}
                <code className="text-[#FFBF00]">@MaChaine</code> / <code className="text-[#FFBF00]">UC...</code>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="channel-url"
                type="text"
                placeholder="Ex : https://www.youtube.com/@lespitchounestv"
                value={channelInput}
                onChange={(e) => {setChannelInput(e.target.value);setPreviewData(null);setSelectedIds(new Set());}}
                className="flex-1 bg-[#0A0D14] border border-[#1E2638] focus:border-[#E5A93C] text-white text-sm px-4 py-3 rounded-xl outline-none placeholder:text-gray-600"
              />
              <button
                type="submit"
                disabled={loadingPreview || !channelInput.trim()}
                className="bg-[#E5A93C] hover:bg-[#F5B82E] text-black font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPreview ? "animate-spin" : ""}`} />
                <span>{loadingPreview ? "Analyse en cours..." : "Analyser la chaîne"}</span>
              </button>
            </div>
          </form>

          {/* Aperçu de la chaîne et sélection des vidéos */}
          {previewData && (
            <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-6">
              {/* Infos Chaîne */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2638] pb-5">
                <div className="flex items-center gap-4">
                  {previewData.channel.thumbnailUrl && (
                    <img
                      src={previewData.channel.thumbnailUrl}
                      alt={previewData.channel.title}
                      className="w-14 h-14 rounded-full border border-[#1E2638] object-cover bg-black"
                    />
                  )}
                  <div>
                    <h2 className="text-lg font-black text-white">{previewData.channel.title}</h2>
                    <p className="text-xs text-gray-400 font-mono">
                      ID : {previewData.channel.channelId} {previewData.channel.customUrl && `• ${previewData.channel.customUrl}`}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{previewData.channel.description}</p>
                  </div>
                </div>

                <div className="text-xs text-right text-gray-400 shrink-0">
                  <p>
                    Vidéos détectées dans le flux : <strong className="text-white">{(previewData.items || previewData.videos || []).length}</strong>
                  </p>
                  <p>
                    Sélectionnées pour import : <strong className="text-[#FFBF00]">{selectedIds.size}</strong>
                  </p>
                </div>
              </div>

              {/* Options & Filtres d'import */}
              <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-4 space-y-4 text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sliders className="w-4 h-4 text-[#FFBF00]" />
                  <span>Paramètres et filtres d'importation</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-400">Mots-clés requis (séparés par des virgules) :</label>
                    <input
                      type="text"
                      placeholder="Ex : podcast, interview, episode"
                      value={includeKeywords}
                      onChange={(e) => setIncludeKeywords(e.target.value)}
                      className="w-full bg-[#121722] border border-[#1E2638] text-white px-3 py-2 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-gray-400">Mots-clés exclus (séparés par des virgules) :</label>
                    <input
                      type="text"
                      placeholder="Ex : teaser, short, extrait"
                      value={excludeKeywords}
                      onChange={(e) => setExcludeKeywords(e.target.value)}
                      className="w-full bg-[#121722] border border-[#1E2638] text-white px-3 py-2 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E5A93C] focus:ring-0"
                    />
                    <span>Synchroniser les futures vidéos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={autoPublish}
                      onChange={(e) => setAutoPublish(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E5A93C] focus:ring-0"
                    />
                    <span>Publier directement (sinon Brouillon)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                    <input
                      type="checkbox"
                      checked={keepManualEdits}
                      onChange={(e) => setKeepManualEdits(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E5A93C] focus:ring-0"
                    />
                    <span>Protéger mes éditions locales</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-[#FFBF00] font-semibold">
                    <input
                      type="checkbox"
                      checked={excludeShorts}
                      onChange={(e) => setExcludeShorts(e.target.checked)}
                      className="w-4 h-4 rounded text-[#E5A93C] focus:ring-0"
                    />
                    <span>Exclure les YouTube Shorts</span>
                  </label>
                </div>
              </div>

              {/* Barre d'action sélection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-[#1E2638] pb-3">
                <div className="flex items-center gap-3">
                  <button onClick={selectAll} className="text-[#FFBF00] font-bold hover:underline">
                    Tout sélectionner
                  </button>
                  <span className="text-gray-600">•</span>
                  <button onClick={deselectAll} className="text-gray-400 font-bold hover:underline">
                    Tout désélectionner
                  </button>
                </div>
                <span className="text-gray-500">
                  Affichage de {filteredPreviewItems.length} vidéo(s) éligible(s)
                </span>
              </div>

              {/* Grille / Liste des vidéos prévisualisées */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredPreviewItems.map((video: any) => {
                  const vid = video.youtubeVideoId || video.videoId;
                  const isChecked = selectedIds.has(vid);
                  const isAlready = video.isAlreadyImported ?? video.alreadyImported ?? false;
                  return (
                    <div
                      key={vid}
                      onClick={() => toggleSelect(vid)}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition ${
                        isChecked
                          ? "bg-[#1A2234] border-[#E5A93C]/40"
                          : "bg-[#0A0D14] border-[#1E2638] opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // géré par le clic conteneur
                          className="w-4 h-4 rounded text-[#E5A93C] focus:ring-0 shrink-0"
                        />
                        {video.thumbnailUrl && (
                          <div className="relative w-20 h-12 bg-black rounded-lg overflow-hidden shrink-0 border border-[#1E2638]">
                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate max-w-xl">{video.title}</h4>
                          <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {video.publishedAt ? new Date(video.publishedAt).toLocaleDateString("fr-FR") : "Date inconnue"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {video.durationSeconds || video.duration ? `${Math.floor((video.durationSeconds || video.duration) / 60)} min` : (video.durationLabel || "Durée inconnue")}
                            </span>
                            {video.isLikelyShort && (
                              <span className="text-[10px] bg-red-950/70 text-red-400 border border-red-800/50 px-1.5 py-0.5 rounded font-bold">
                                Short (≤ 60s)
                              </span>
                            )}
                            <a
                              href={video.canonicalUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-white flex items-center gap-0.5"
                            >
                              <span>Voir</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isAlready ? (
                          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            Déjà importé
                          </span>
                        ) : isChecked ? (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Sélectionné
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded">
                            Exclu
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton de confirmation de connexion */}
              <div className="pt-4 border-t border-[#1E2638] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-gray-400">
                  <strong className="text-white">{selectedIds.size} vidéo(s)</strong> seront importées dans cette émission.
                </p>

                <button
                  onClick={handleConnect}
                  disabled={connecting || (initialImportMode==="SELECT"&&!selectedIds.size)}
                  className="bg-[#E5A93C] hover:bg-[#F5B82E] text-black font-extrabold px-8 py-3 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{connecting ? "Connexion en cours..." : "Confirmer et lancer l'importation"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Historique des Anciennes Vidéos (YouTube Data API v3) */}
      {showHistoricalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-[#1E2638] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[#1E2638] flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <History className="w-4 h-4 text-[#FFBF00]" />
                <span>Archives anciennes (Playlist Uploads)</span>
              </div>
              <button
                onClick={() => setShowHistoricalModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {historicalError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-xs text-red-400 rounded-lg">
                  {historicalError}
                </div>
              )}

              {historicalVideos.length === 0 && !loadingHistorical && (
                <div className="p-8 text-center text-xs text-gray-400">
                  Aucune ancienne vidéo supplémentaire chargée.
                </div>
              )}

              <div className="space-y-2">
                {historicalVideos.map((item: any) => (
                  <div key={item.videoId} className="bg-[#0A0D14] p-3 rounded-lg border border-[#1E2638] flex items-center gap-3 text-xs">
                    <input type="checkbox" aria-label={"Importer "+item.title} disabled={item.alreadyImported || item.embeddable===false} checked={historicalSelected.has(item.videoId)} onChange={()=>setHistoricalSelected(prev=>{const next=new Set(prev);if(next.has(item.videoId))next.delete(item.videoId);else next.add(item.videoId);return next;})}/>
                    {item.thumbnailUrl && (
                      <img src={item.thumbnailUrl} alt={item.title} className="w-16 h-10 object-cover rounded bg-black" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-white truncate">{item.title}</h5>
                      <span className="text-[11px] text-gray-500">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("fr-FR") : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {loadingHistorical && (
                <div className="text-center py-4 text-xs text-[#FFBF00] font-bold">
                  Chargement des archives...
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1E2638] flex items-center justify-between text-xs">
              <span className="text-gray-400">{historicalVideos.length} vidéo(s) chargée(s)</span>
              <button disabled={importingHistorical||!historicalSelected.size} onClick={()=>void importHistorical()} className="rounded-full bg-[#FFBF00] px-4 py-2 text-black disabled:opacity-50">Importer {historicalSelected.size} sélectionnées</button>
              {historicalNextPageToken && (
                <button
                  onClick={() => handleFetchHistorical(historicalNextPageToken)}
                  disabled={loadingHistorical}
                  className="bg-[#1A2234] hover:bg-[#222C42] text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                  Charger la page suivante
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
