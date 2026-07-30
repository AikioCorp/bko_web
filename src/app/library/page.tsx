"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { usePlayerStore, PlayerEpisode } from "../../store/playerStore";
import { Bookmark, Play, Clock, ListMusic, Mic, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { playEpisode } = usePlayerStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"saved" | "history" | "playlists">("saved");
  const [savedEpisodes, setSavedEpisodes] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/library");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    if (activeTab === "saved") {
      fetch("http://localhost:8080/api/v1/me/saved", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setSavedEpisodes(json.data);
        })
        .catch(() => {});
    } else if (activeTab === "history") {
      fetch("http://localhost:8080/api/v1/me/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setHistory(json.data);
        })
        .catch(() => {});
    } else if (activeTab === "playlists") {
      fetch("http://localhost:8080/api/v1/me/playlists", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setPlaylists(json.data);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleClearHistory = async () => {
    if (!confirm("Voulez-vous vraiment effacer tout votre historique d'écoute ?")) return;

    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch("http://localhost:8080/api/v1/me/history", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory([]);
    } catch (e) {}
  };

  if (isLoading || !isAuthenticated) {
    return <div className="p-12 text-center text-gray-400">Chargement de votre bibliothèque...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2638] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white">Ma Bibliothèque</h1>
          <p className="text-xs text-gray-400">Retrouvez vos épisodes enregistrés, votre historique et vos playlists</p>
        </div>

        {/* Onglets */}
        <div className="flex items-center space-x-2 bg-[#121722] p-1.5 rounded-full border border-[#1E2638]">
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center space-x-2 ${
              activeTab === "saved" ? "bg-[#E5A93C] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Enregistrés ({savedEpisodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center space-x-2 ${
              activeTab === "history" ? "bg-[#E5A93C] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Historique ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 text-xs font-bold rounded-full transition flex items-center space-x-2 ${
              activeTab === "playlists" ? "bg-[#E5A93C] text-black" : "text-gray-400 hover:text-white"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>
        </div>
      </div>

      {/* Contenu de l'onglet Enregistrés */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {savedEpisodes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs bg-[#121722] rounded-2xl border border-[#1E2638] p-8">
              Vous n'avez aucun épisode enregistré pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {savedEpisodes.map((ep) => {
                const playerEp: PlayerEpisode = {
                  id: ep.id,
                  slug: ep.slug,
                  title: ep.title,
                  cover: ep.cover || ep.podcast?.cover,
                  durationSeconds: ep.durationSeconds,
                  podcast: {
                    slug: ep.podcast?.slug || "",
                    name: ep.podcast?.name || "",
                    cover: ep.podcast?.cover || "",
                  },
                  mediaSources: ep.mediaSources || [],
                };

                return (
                  <div key={ep.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between hover:border-[#E5A93C]/50 transition">
                    <div className="flex items-center space-x-4">
                      <img src={ep.cover || ep.podcast?.cover} alt={ep.title} className="w-14 h-14 rounded-lg object-cover border border-[#E5A93C]/20" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{ep.title}</h4>
                        <p className="text-xs text-[#E5A93C]">{ep.podcast?.name}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => playEpisode(playerEp, "AUDIO")}
                      className="bg-[#E5A93C] text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-[#F5B82E] transition flex items-center space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Écouter</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Historique */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {history.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleClearHistory}
                className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1 border border-red-500/20 px-3 py-1.5 rounded-full"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Effacer tout l'historique</span>
              </button>
            </div>
          )}

          {history.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs bg-[#121722] rounded-2xl border border-[#1E2638] p-8">
              Votre historique d'écoute est vide.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => {
                const ep = h.episode;
                const playerEp: PlayerEpisode = {
                  id: ep.id,
                  slug: ep.slug,
                  title: ep.title,
                  cover: ep.cover || ep.podcast?.cover,
                  durationSeconds: ep.durationSeconds,
                  podcast: {
                    slug: ep.podcast?.slug || "",
                    name: ep.podcast?.name || "",
                    cover: ep.podcast?.cover || "",
                  },
                  mediaSources: ep.mediaSources || [],
                };

                return (
                  <div key={h.episodeId} className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between hover:border-[#E5A93C]/50 transition">
                    <div className="flex items-center space-x-4">
                      <img src={ep.cover || ep.podcast?.cover} alt={ep.title} className="w-14 h-14 rounded-lg object-cover border border-[#E5A93C]/20" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{ep.title}</h4>
                        <p className="text-xs text-gray-400">
                          Arrêté à {Math.floor(h.positionSeconds / 60)}m • {h.completed ? "Terminé" : "En cours"}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => playEpisode(playerEp, "AUDIO")}
                      className="bg-[#E5A93C] text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-[#F5B82E] transition flex items-center space-x-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Reprendre à {Math.floor(h.positionSeconds / 60)}m</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenu de l'onglet Playlists */}
      {activeTab === "playlists" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {playlists.map((pl) => (
              <div key={pl.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#E5A93C]/10 text-[#E5A93C] rounded-lg flex items-center justify-center font-bold">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{pl.name}</h4>
                    <p className="text-xs text-gray-400">{pl._count?.items || 0} épisodes • {pl.visibility}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
