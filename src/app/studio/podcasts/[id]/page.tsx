"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, Settings, Play, Radio } from "lucide-react";

export default function CreatorPodcastDetailPage() {
  const params = useParams();
  const podcastId = params.id as string;

  const [podcast, setPodcast] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"episodes" | "team">("episodes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch(`http://localhost:8080/api/v1/creator/podcasts/${podcastId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPodcast(json.data);
      })
      .catch(() => {});

    fetch(`http://localhost:8080/api/v1/creator/podcasts/${podcastId}/episodes`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setEpisodes(json.data);
      })
      .catch(() => {});

    fetch(`http://localhost:8080/api/v1/creator/podcasts/${podcastId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMembers(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [podcastId]);

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement des données du podcast...</div>;
  if (!podcast) return <div className="p-12 text-center text-gray-400">Podcast introuvable.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <img src={podcast.cover} alt={podcast.name} className="w-20 h-20 rounded-xl object-cover border border-[#E5A93C]/30 shadow-lg" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {podcast.userRole}
              </span>
              <span className="text-xs text-gray-400">{podcast.country?.name}</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-1">{podcast.name}</h1>
            <p className="text-xs text-gray-400 line-clamp-1">{podcast.description}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={`/studio/podcasts/${podcastId}/episodes/new`}
            className="bg-[#E5A93C] text-black font-extrabold px-5 py-2.5 rounded-full text-xs hover:bg-[#F5B82E] transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>AJOUTER UN ÉPISODE</span>
          </a>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center space-x-2 border-b border-[#1E2638] pb-4">
        <button
          onClick={() => setActiveTab("episodes")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition ${
            activeTab === "episodes" ? "bg-[#E5A93C] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Épisodes ({episodes.length})
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 text-xs font-bold rounded-full transition ${
            activeTab === "team" ? "bg-[#E5A93C] text-black" : "text-gray-400 hover:text-white"
          }`}
        >
          Équipe ({members.length})
        </button>
      </div>

      {/* Onglet Épisodes */}
      {activeTab === "episodes" && (
        <div className="space-y-4">
          {episodes.length === 0 ? (
            <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-8 text-center text-xs text-gray-400">
              Aucun épisode disponible pour cette émission.
            </div>
          ) : (
            <div className="space-y-3">
              {episodes.map((ep) => (
                <div key={ep.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={ep.cover || podcast.cover} alt={ep.title} className="w-12 h-12 rounded-lg object-cover border border-[#E5A93C]/20" />
                    <div>
                      <h4 className="font-bold text-white text-sm">{ep.title}</h4>
                      <p className="text-xs text-gray-400">
                        Statut : <span className="text-[#E5A93C] font-bold uppercase">{ep.status}</span> • {ep.mediaSources.length} source(s) média
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/studio/episodes/${ep.id}/edit`}
                    className="bg-[#0A0D14] text-gray-300 border border-[#1E2638] px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:border-[#E5A93C] transition"
                  >
                    Gérer & Publier
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Onglet Équipe */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#E5A93C] rounded-full flex items-center justify-center font-bold text-black text-sm">
                    {m.user.fullName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{m.user.fullName}</h4>
                    <p className="text-xs text-gray-400">{m.user.email}</p>
                  </div>
                </div>

                <span className="bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
