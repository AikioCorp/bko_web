"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link as LinkIcon, Check, ArrowRight, Video, Headphones, Sparkles } from "lucide-react";

export default function NewEpisodePage() {
  const params = useParams();
  const podcastId = params.id as string;
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [rawUrl, setRawUrl] = useState("");
  const [detectedSource, setDetectedSource] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDetectUrl = (url: string) => {
    setRawUrl(url);
    if (!url) {
      setDetectedSource(null);
      return;
    }

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      setDetectedSource({ provider: "YOUTUBE", type: "VIDEO", mode: "EMBED", label: "Vidéo YouTube" });
    } else if (url.includes("spotify.com")) {
      setDetectedSource({ provider: "SPOTIFY", type: "AUDIO", mode: "EMBED", label: "Audio Spotify" });
    } else if (url.includes("vimeo.com")) {
      setDetectedSource({ provider: "VIMEO", type: "VIDEO", mode: "EMBED", label: "Vidéo Vimeo" });
    } else {
      setDetectedSource({ provider: "OTHER", type: "AUDIO", mode: "EXTERNAL_REDIRECT", label: "Lien Externe Général" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      // 1. Créer l'épisode en brouillon
      const epRes = await fetch(`http://localhost:8080/api/v1/creator/podcasts/${podcastId}/episodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          cover,
          status: "DRAFT",
        }),
      });
      const epJson = await epRes.json();

      if (!epJson.success) {
        setError(epJson.error?.message || "Erreur lors de la création de l'épisode");
        setLoading(false);
        return;
      }

      const episodeId = epJson.data.id;

      // 2. Ajouter la source média si fournie
      if (rawUrl) {
        await fetch(`http://localhost:8080/api/v1/creator/episodes/${episodeId}/media-sources`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rawUrl }),
        });
      }

      // 3. Publier l'épisode
      const pubRes = await fetch(`http://localhost:8080/api/v1/creator/episodes/${episodeId}/publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const pubJson = await pubRes.json();

      if (pubJson.success) {
        router.push(`/studio/podcasts/${podcastId}`);
      } else {
        setError(pubJson.error?.message || "Épisode créé mais impossible de le publier (source média requise)");
      }
    } catch (err) {
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="space-y-1 border-b border-[#1E2638] pb-4">
          <span className="text-[#E5A93C] text-[10px] font-bold uppercase tracking-wider">Créateur • Nouvel Épisode</span>
          <h1 className="text-2xl font-black text-white">Ajouter un Épisode</h1>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Titre de l'Épisode *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Entreprendre au Mali : Défis et Opportunités"
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Résumé des sujets abordés dans cet épisode..."
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          {/* Détecteur de lien média */}
          <div className="bg-[#0A0D14] border border-[#1E2638] rounded-xl p-5 space-y-3">
            <label className="block text-xs font-bold text-[#E5A93C] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Coller un lien Audio ou Vidéo Externe *</span>
            </label>
            <div className="relative">
              <input
                type="url"
                required
                value={rawUrl}
                onChange={(e) => handleDetectUrl(e.target.value)}
                placeholder="Ex: https://youtube.com/watch?v=... ou Spotify / Soundcloud"
                className="w-full bg-[#121722] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>

            {detectedSource && (
              <div className="bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-white p-3 rounded-lg text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-[#E5A93C]" />
                  <span className="font-bold">{detectedSource.label} Détecté</span>
                </div>
                <span className="text-[10px] bg-[#E5A93C] text-black font-extrabold px-2 py-0.5 rounded uppercase">
                  {detectedSource.mode}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E5A93C] text-black font-extrabold py-3.5 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg flex items-center justify-center space-x-2"
          >
            <span>{loading ? "Traitement..." : "PUBLIER L'ÉPISODE MAINTENANT"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
