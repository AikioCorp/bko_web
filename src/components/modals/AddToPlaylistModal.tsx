"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { X, ListMusic, Plus, Check, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

interface AddToPlaylistModalProps {
  episodeId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPlaylistModal({ episodeId, isOpen, onClose }: AddToPlaylistModalProps) {
  const { isAuthenticated } = useAuthStore();
  const { data: playlists, isLoading } = useSWR<any[]>(
    isOpen && isAuthenticated ? "/me/playlists" : null,
    fetcher
  );

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [addingToId, setAddingToId] = useState<string | null>(null);
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  if (!isOpen || !episodeId) return null;

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToId(playlistId);
    try {
      await fetchApi(`/playlists/${playlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ episodeId }),
      });
      setAddedSuccessId(playlistId);
      setTimeout(() => {
        onClose();
        setAddedSuccessId(null);
      }, 700);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetchApi("/playlists", {
        method: "POST",
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });
      if (res.success && res.data) {
        // Automatically add the episode to the newly created playlist
        await fetchApi(`/playlists/${res.data.id}/items`, {
          method: "POST",
          body: JSON.stringify({ episodeId }),
        });
        mutate("/me/playlists");
        setAddedSuccessId(res.data.id);
        setTimeout(() => {
          onClose();
          setAddedSuccessId(null);
          setNewPlaylistName("");
        }, 700);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#141414] border border-[#242424] rounded-2xl p-5 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#FFBF00]" />
            <h3 className="text-sm font-bold text-white">Ajouter à une playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#757575] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-xs text-[#A0A0A0]">
              Connectez-vous pour ajouter cet épisode à vos playlists personnelles.
            </p>
            <a
              href="/login"
              className="inline-block px-4 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs"
            >
              Se connecter
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Playlists List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {isLoading ? (
                <div className="py-6 text-center text-xs text-[#757575]">Chargement...</div>
              ) : !playlists || playlists.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#757575]">
                  Vous n'avez pas encore de playlist.
                </div>
              ) : (
                playlists.map((pl) => {
                  const isAdded = addedSuccessId === pl.id;
                  const isProcessing = addingToId === pl.id;

                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl.id)}
                      disabled={isProcessing || isAdded}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#262626] transition-colors text-left"
                    >
                      <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {pl.name}
                      </span>
                      {isAdded ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Ajouté
                        </span>
                      ) : isProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFBF00]" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#888888]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Create Playlist form */}
            <form onSubmit={handleCreatePlaylist} className="pt-2 border-t border-[#222222] flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nouvelle playlist..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#1A1A1A] border border-[#282828] text-xs text-white placeholder-[#666666] focus:border-[#FFBF00] outline-none"
              />
              <button
                type="submit"
                disabled={isCreating || !newPlaylistName.trim()}
                className="px-3 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs hover:bg-[#e6ac00] transition-colors disabled:opacity-50 shrink-0"
              >
                {isCreating ? "..." : "Créer"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
