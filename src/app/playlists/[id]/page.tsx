"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { usePlayerStore, PlayerEpisode } from "../../../store/playerStore";
import { ListMusic, Play, Pause, Trash2, Pencil, ArrowLeft } from "lucide-react";

export default function PlaylistDetailPage() {
  const params = useParams();
  const playlistId = String(params.id ?? "");
  const router = useRouter();
  const { user } = useAuthStore();
  const { playEpisode, currentEpisode, isPlaying, togglePlay } = usePlayerStore();

  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = () => (getAccessToken());

  const fetchPlaylist = () => {
    const t = token();
    fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      headers: t ? { Authorization: `Bearer ${t}` } : {},
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPlaylist(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaylist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const isOwner = Boolean(user && playlist && user.id === playlist.user?.id);

  const handleRename = async () => {
    const name = window.prompt("Nouveau nom de la playlist ?", playlist?.name ?? "");
    if (!name || !name.trim()) return;
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ name: name.trim() }),
      });
      fetchPlaylist();
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer définitivement cette playlist ?")) return;
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      router.push("/library");
    } catch (e) {}
  };

  const handleRemoveItem = async (episodeId: string) => {
    const t = token();
    if (!t) return;
    try {
      await fetch(`${API_BASE_URL}/playlists/${playlistId}/items/${episodeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      fetchPlaylist();
    } catch (e) {}
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement de la playlist…</div>;
  if (!playlist) return <div className="p-12 text-center text-gray-400">Playlist introuvable ou privée.</div>;

  const items: any[] = playlist.items ?? [];

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-4">
        <button onClick={() => router.push("/library")} className="inline-flex items-center text-xs text-gray-400 hover:text-[#E5A93C]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Ma bibliothèque
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#E5A93C]/10 text-[#E5A93C] rounded-2xl flex items-center justify-center">
              <ListMusic className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{playlist.name}</h1>
              {playlist.description && <p className="text-xs text-gray-400 mt-1">{playlist.description}</p>}
              <p className="text-[11px] text-gray-500 mt-1">
                {items.length} épisode{items.length > 1 ? "s" : ""} • {playlist.visibility} • par{" "}
                {playlist.user?.fullName ?? "—"}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRename}
                className="bg-[#0A0D14] text-gray-200 border border-[#1E2638] px-3 py-2 rounded-lg text-xs font-semibold hover:border-[#E5A93C] transition flex items-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" /> Renommer
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-12 text-center text-xs text-gray-400">
          Cette playlist est vide. Ajoutez des épisodes depuis leur page.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const ep = item.episode;
            if (!ep) return null;
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
              <div
                key={item.id}
                className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between hover:border-[#E5A93C]/50 transition"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <img
                    src={ep.cover || ep.podcast?.cover}
                    alt={ep.title}
                    className="w-14 h-14 rounded-lg object-cover border border-[#E5A93C]/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{ep.title}</h4>
                    <p className="text-xs text-[#E5A93C] truncate">{ep.podcast?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => playEpisode(playerEp, "AUDIO")}
                    className="bg-[#E5A93C] text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-[#F5B82E] transition flex items-center space-x-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Écouter</span>
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveItem(ep.id)}
                      title="Retirer de la playlist"
                      className="text-red-400 border border-red-500/20 p-2 rounded-full hover:bg-red-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
