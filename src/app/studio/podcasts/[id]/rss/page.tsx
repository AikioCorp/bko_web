"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Rss, RefreshCw, CheckCircle2, AlertCircle, Link as LinkIcon, Trash2, ArrowRight } from "lucide-react";

export default function PodcastRssPage() {
  const params = useParams();
  const podcastId = params.id as string;

  const [feedUrl, setFeedUrl] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [rssStatus, setRssStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/rss`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRssStatus(json.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
  }, [podcastId]);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setPreviewData(null);
    setLoadingPreview(true);

    const token = localStorage.getItem("bko_access_token");
    if (!token) {
      setErrorMessage("Veuillez vous connecter");
      setLoadingPreview(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/rss/preview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedUrl }),
      });

      const json = await res.json();
      if (!json.success) {
        setErrorMessage(json.message || "Erreur d'analyse du flux RSS");
      } else {
        setPreviewData(json.data);
      }
    } catch (e: any) {
      setErrorMessage("Erreur de connexion au serveur");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConnect = async () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token || !feedUrl) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/rss/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ feedUrl }),
      });

      const json = await res.json();
      if (json.success) {
        setPreviewData(null);
        setFeedUrl("");
        fetchStatus();
      } else {
        setErrorMessage(json.message);
      }
    } catch (e) {
      setErrorMessage("Erreur de connexion");
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/rss/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimeout(() => {
        fetchStatus();
        setSyncing(false);
      }, 2000);
    } catch (e) {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Voulez-vous vraiment déconnecter le flux RSS ? Les épisodes déjà importés resteront sur Bamako Podcast.")) return;

    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/creator/podcasts/${podcastId}/rss`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStatus();
    } catch (e) {}
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* En-tête */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <div className="flex items-center space-x-2 text-[#E5A93C]">
          <Rss className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Synchronisation & Distribution RSS</span>
        </div>
        <h1 className="text-3xl font-black text-white">Flux RSS & Importation Automatique</h1>
        <p className="text-xs text-gray-400">
          Connectez un flux RSS existant (Anchor, Spotify for Podcasters, Acast, Buzzsprout...) pour importer et synchroniser automatiquement vos épisodes sans doubler les téléchargements.
        </p>
      </div>

      {/* Si un flux est déjà connecté */}
      {rssStatus ? (
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1E2638] pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h3 className="font-bold text-white text-sm">Flux RSS Connecté</h3>
              </div>
              <p className="text-xs text-gray-400 font-mono">{rssStatus.url}</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="bg-[#E5A93C] text-black hover:bg-[#F5B82E] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "Synchronisation..." : "Synchroniser maintenant"}</span>
              </button>

              <button
                onClick={handleDisconnect}
                className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Déconnecter</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Épisodes Importés</span>
              <p className="text-xl font-black text-white">{rssStatus._count?.importedEpisodes || 0}</p>
            </div>

            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Dernière Synchronisation</span>
              <p className="text-sm font-bold text-gray-300">
                {rssStatus.lastSyncAt ? new Date(rssStatus.lastSyncAt).toLocaleString("fr-FR") : "Aucune"}
              </p>
            </div>

            <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-1">
              <span className="text-gray-500">Statut de Synchro</span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-green-500/10 text-green-400 border border-green-500/30">
                {rssStatus.syncStatus || "IDLE"}
              </span>
            </div>
          </div>

          {/* Historique des SyncRuns */}
          {rssStatus.syncRuns && rssStatus.syncRuns.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#1E2638]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Historique de synchronisation</h4>
              <div className="space-y-2">
                {rssStatus.syncRuns.map((run: any) => (
                  <div key={run.id} className="bg-[#0A0D14] p-3 rounded-lg border border-[#1E2638] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">{new Date(run.startedAt).toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="text-gray-400 space-x-3">
                      <span>Nouveaux : <strong className="text-white">{run.episodesImported}</strong></span>
                      <span>Mis à jour : <strong className="text-white">{run.episodesUpdated}</strong></span>
                      <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">{run.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Formulaire de connexion initial */
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-6">
          <form onSubmit={handlePreview} className="space-y-4">
            <label className="block text-xs font-bold text-gray-300">URL du Flux RSS du Podcast</label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="url"
                  placeholder="https://anchor.fm/s/12345/podcast/rss"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  required
                  className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl pl-9 pr-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPreview}
                className="bg-[#E5A93C] text-black hover:bg-[#F5B82E] px-6 py-3 rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center space-x-2"
              >
                {loadingPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyse...</span>
                  </>
                ) : (
                  <>
                    <span>Analyser</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Prévisualisation */}
          {previewData && (
            <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-6 space-y-6">
              <div className="flex items-start space-x-4">
                {previewData.image && (
                  <img src={previewData.image} alt={previewData.title} className="w-20 h-20 rounded-xl object-cover border border-[#1E2638]" />
                )}
                <div className="space-y-1 flex-1">
                  <h3 className="font-extrabold text-white text-base">{previewData.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{previewData.description}</p>
                  <div className="text-[10px] text-gray-500 space-x-3 pt-1">
                    <span>Auteur : {previewData.author || "Inconnu"}</span>
                    <span>•</span>
                    <span>Langue : {previewData.language}</span>
                    <span>•</span>
                    <span className="text-[#E5A93C] font-bold">{previewData.episodeCount} épisodes détectés</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1E2638] pt-4 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase">Échantillon des premiers épisodes</h4>
                <div className="space-y-1.5">
                  {previewData.sampleEpisodes?.map((ep: any, idx: number) => (
                    <div key={idx} className="bg-[#121722] p-2.5 rounded-lg border border-[#1E2638] flex items-center justify-between text-xs">
                      <span className="text-gray-200 font-medium truncate">{ep.title}</span>
                      <span className="text-gray-500 text-[10px] font-mono shrink-0 ml-2">{ep.durationSeconds}s</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#1E2638] pt-4 flex justify-end">
                <button
                  onClick={handleConnect}
                  className="bg-green-500 hover:bg-green-600 text-black px-6 py-3 rounded-xl text-xs font-black transition flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer & Importer {previewData.episodeCount} épisodes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
