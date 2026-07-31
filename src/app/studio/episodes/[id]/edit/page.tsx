"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Link as LinkIcon, Plus, Check, Play, Calendar, Upload } from "lucide-react";
import { MediaDropzone } from "../../../../../components/media/MediaDropzone";

export default function EditEpisodePage() {
  const params = useParams();
  const episodeId = params.id as string;
  const router = useRouter();

  const [episode, setEpisode] = useState<any>(null);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [scheduleAt, setScheduleAt] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const fetchEpisode = () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/episodes/${episodeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setEpisode(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEpisode();
  }, [episodeId]);

  const handleAddMediaSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/episodes/${episodeId}/media-sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rawUrl: newUrl }),
      });
      const json = await res.json();
      if (json.success) {
        setEpisode({ ...episode, mediaSources: [...episode.mediaSources, json.data] });
        setNewUrl("");
      }
    } catch (e) {}
  };

  const runAction = async (path: string, body?: any) => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;
    setActionError("");
    setActionMsg("");
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/creator/episodes/${episodeId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg("Épisode mis à jour avec succès.");
        fetchEpisode();
      } else {
        setActionError(json.error?.message || "Action impossible.");
      }
    } catch (e) {
      setActionError("Impossible de contacter le serveur.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = () => runAction("publish");

  const handleSchedule = () => {
    if (!scheduleAt) {
      setActionError("Choisissez une date de planification.");
      return;
    }
    runAction("schedule", { publishAt: new Date(scheduleAt).toISOString() });
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement de l'épisode...</div>;
  if (!episode) return <div className="p-12 text-center text-gray-400">Épisode introuvable.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              {episode.status}
            </span>
            <h1 className="text-2xl font-black text-white mt-2">{episode.title}</h1>
            <p className="text-xs text-gray-400 mt-1">{episode.description}</p>
          </div>
        </div>
      </div>

      {/* Publication / Planification */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Play className="w-5 h-5 text-[#E5A93C]" />
          <span>Publication</span>
        </h3>

        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold">
            {actionError}
          </div>
        )}
        {actionMsg && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl text-xs font-semibold">
            {actionMsg}
          </div>
        )}

        <p className="text-xs text-gray-400">
          Statut actuel : <span className="font-bold text-gray-200 uppercase">{episode.status}</span>
        </p>

        {!(episode.mediaSources?.length) && (
          <p className="text-xs text-[#E5A93C]">
            Ajoutez au moins une source média (ci-dessous) avant de pouvoir publier ou planifier.
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            disabled={busy || episode.status === "PUBLISHED" || !(episode.mediaSources?.length)}
            onClick={handlePublish}
            className="bg-[#E5A93C] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs hover:bg-[#F5B82E] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Play className="w-4 h-4" />
            <span>{episode.status === "PUBLISHED" ? "Déjà publié" : "Publier maintenant"}</span>
          </button>

          <span className="text-[10px] text-gray-500 uppercase font-bold sm:mx-1">ou</span>

          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="bg-[#0A0D14] border border-[#1E2638] rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
            <button
              disabled={busy || !(episode.mediaSources?.length)}
              onClick={handleSchedule}
              className="bg-[#0A0D14] text-gray-200 border border-[#1E2638] px-4 py-2.5 rounded-xl text-xs font-semibold hover:border-[#E5A93C] transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Planifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Upload Média Natif R2 */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Upload className="w-5 h-5 text-[#E5A93C]" />
          <span>Upload Média Natif Bamako Podcast (Direct R2)</span>
        </h3>
        <MediaDropzone
          mediaType="AUDIO"
          episodeId={episodeId}
          onUploadSuccess={() => fetchEpisode()}
        />
      </div>

      {/* Sources Médias Rattachées */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">Toutes les Sources Médias Rattachées</h3>

        <div className="space-y-3">
          {episode.mediaSources?.map((src: any) => (
            <div key={src.id} className="bg-[#0A0D14] border border-[#1E2638] p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#E5A93C] uppercase">{src.provider || src.sourceType} ({src.type})</span>
                <p className="text-xs text-gray-400 truncate max-w-md">{src.externalUrl}</p>
              </div>
              <div className="flex items-center space-x-2">
                {src.isPrimaryAudio && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-0.5 rounded">Audio Principal</span>}
                {src.isPrimaryVideo && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] px-2 py-0.5 rounded">Vidéo Principale</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Ajouter une source externe */}
        <form onSubmit={handleAddMediaSource} className="pt-4 border-t border-[#1E2638] flex items-center space-x-3">
          <input
            type="url"
            required
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="Coller un autre lien externe (YouTube, Spotify, etc.)"
            className="flex-1 bg-[#0A0D14] border border-[#1E2638] rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
          />
          <button
            type="submit"
            className="bg-[#E5A93C] text-black font-extrabold px-4 py-2.5 rounded-xl text-xs hover:bg-[#F5B82E] transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>AJOUTER LIEN</span>
          </button>
        </form>
      </div>
    </div>
  );
}
