"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { Mic, Radio, Users, Play, Plus, ArrowRight, Video, Link as LinkIcon, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreatorStudioDashboard() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/studio");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    // Charger le profil créateur
    fetch("http://localhost:8080/api/v1/me/creator-profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCreatorProfile(json.data);
      })
      .catch(() => {});

    // Charger le dashboard créateur
    fetch("http://localhost:8080/api/v1/creator/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMetrics(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCreateCreatorProfile = async () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8080/api/v1/me/creator-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: user?.fullName || "Nouveau Créateur",
          bio: "Créateur sur Bamako Podcast",
          createPerson: true,
        }),
      });
      const json = await res.json();
      if (json.success) setCreatorProfile(json.data);
    } catch (e) {}
  };

  if (isLoading || loading) return <div className="p-12 text-center text-gray-400">Chargement de votre Espace Créateur...</div>;

  if (!creatorProfile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-[#E5A93C] rounded-2xl flex items-center justify-center font-black text-black text-3xl mx-auto shadow-lg">
          🎙️
        </div>
        <h1 className="text-3xl font-black text-white">Devenez Créateur sur Bamako Podcast</h1>
        <p className="text-xs text-gray-300">
          Publiez et diffusez vos podcasts audio et vidéo au Mali et dans toute l'Afrique.
        </p>
        <button
          onClick={handleCreateCreatorProfile}
          className="bg-[#E5A93C] text-black font-extrabold px-8 py-3.5 rounded-full text-xs hover:bg-[#F5B82E] transition shadow-lg inline-flex items-center space-x-2"
        >
          <span>ACTIVER MON ESPACE CRÉATEUR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* En-tête Espace Créateur */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-[#E5A93C] rounded-xl flex items-center justify-center font-black text-black text-2xl shadow-lg">
            {creatorProfile.displayName[0]}
          </div>
          <div>
            <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30">
              ESPACE CRÉATEUR
            </span>
            <h1 className="text-2xl font-black text-white mt-1">{creatorProfile.displayName}</h1>
            <p className="text-xs text-gray-400">Gérez vos podcasts, épisodes, équipes et diffusions</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/studio/podcasts/new"
            className="bg-[#E5A93C] text-black font-extrabold px-5 py-2.5 rounded-full text-xs hover:bg-[#F5B82E] transition shadow flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>CRÉER UN PODCAST</span>
          </a>
        </div>
      </div>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Podcasts Gérés</div>
          <div className="text-3xl font-black text-white">{metrics?.podcastsCount || 0}</div>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Épisodes Publiés</div>
          <div className="text-3xl font-black text-[#E5A93C]">{metrics?.episodesCount || 0}</div>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Abonnés Cumulés</div>
          <div className="text-3xl font-black text-white">{metrics?.totalFollowers || 0}</div>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-2">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Brouillons</div>
          <div className="text-3xl font-black text-gray-400">{metrics?.draftEpisodes || 0}</div>
        </div>
      </div>

      {/* Épisodes Récents Créateur */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Dernières Activités</h3>
        {metrics?.recentEpisodes?.length === 0 ? (
          <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-8 text-center text-xs text-gray-400">
            Aucun épisode créé pour le moment. Créez votre première émission !
          </div>
        ) : (
          <div className="space-y-3">
            {metrics?.recentEpisodes?.map((ep: any) => (
              <div key={ep.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img src={ep.cover || ep.podcast?.cover} alt={ep.title} className="w-12 h-12 rounded-lg object-cover border border-[#E5A93C]/20" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{ep.title}</h4>
                    <p className="text-xs text-[#E5A93C]">{ep.podcast?.name} • <span className="uppercase text-gray-400">{ep.status}</span></p>
                  </div>
                </div>

                <a
                  href={`/studio/episodes/${ep.id}/edit`}
                  className="bg-[#0A0D14] text-gray-300 border border-[#1E2638] px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:border-[#E5A93C] transition"
                >
                  Modifier
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
