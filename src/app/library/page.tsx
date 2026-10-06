"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Clock,
  Play,
  Download,
  Trash2,
  Radio,
  CheckCircle2,
  Smartphone,
  MoreVertical,
} from "lucide-react";
import { usePlayerStore, PlayerEpisode } from "../../store/playerStore";
import { AppDownloadModal } from "@/components/modals/AppDownloadModal";

export default function LibraryPage() {
  const { playEpisode } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<"history" | "saved" | "following" | "downloads">("history");
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  const historyEpisodes = [
    {
      id: "hist-1",
      title: "Créer son activité à Bamako en 2025",
      podcastName: "Entreprendre au Mali",
      cover: "/images/cover-entreprendre.jpg",
      resumeTime: "18:40",
      durationStr: "45 min",
      durationSeconds: 2700,
      progressPercent: 41,
      lang: "Français",
    },
    {
      id: "hist-2",
      title: "An ka taa Bamako • Épisode 18",
      podcastName: "Bamanankan kuma",
      cover: "/images/cover-griot.jpg",
      resumeTime: "08:15",
      durationStr: "28 min",
      durationSeconds: 1680,
      progressPercent: 29,
      lang: "Bamanankan",
    },
    {
      id: "hist-3",
      title: "Les histoires que racontaient nos grands-parents",
      podcastName: "Culture vivante",
      cover: "/images/cover-culture.jpg",
      resumeTime: "12:35",
      durationStr: "38 min",
      durationSeconds: 2330,
      progressPercent: 35,
      lang: "Bamanankan",
    },
  ];

  const savedEpisodes = [
    {
      id: "saved-1",
      title: "La kora à l'ère numérique : transmission avec Madou Sidiki",
      podcastName: "Culture vivante",
      cover: "/images/cover-kora.jpg",
      durationStr: "36 min",
      durationSeconds: 2160,
      date: "Ajouté hier",
      lang: "Français",
    },
    {
      id: "saved-2",
      title: "Solaire, off-grid et agriculture résiliente le long du fleuve Niger",
      podcastName: "Afrique Demain",
      cover: "/images/cover-culture.jpg",
      durationStr: "51 min",
      durationSeconds: 3060,
      date: "Ajouté il y a 3 jours",
      lang: "Français",
    },
    {
      id: "saved-3",
      title: "Kalan ni dɔnko : Sɛbɛnnikɛla fitininw ka kɔrɔbɔri",
      podcastName: "Bamanankan kuma",
      cover: "/images/cover-griot.jpg",
      durationStr: "24 min",
      durationSeconds: 1440,
      date: "Ajouté il y a 1 semaine",
      lang: "Bamanankan",
    },
  ];

  const followedPodcasts = [
    {
      slug: "culture-vivante",
      title: "Culture vivante",
      author: "Oumar Traoré & Awa Kouyaté",
      episodesCount: 48,
      cover: "/images/cover-kora.jpg",
      badge: "Arts",
    },
    {
      slug: "entreprendre-au-mali",
      title: "Entreprendre au Mali",
      author: "Oumar Diarra",
      episodesCount: 22,
      cover: "/images/cover-entreprendre.jpg",
      badge: "Économie",
    },
    {
      slug: "les-voix-de-bamako",
      title: "Les voix de Bamako",
      author: "Aminata Touré",
      episodesCount: 34,
      cover: "/images/cover-musique.jpg",
      badge: "Société",
    },
  ];

  const handlePlay = (ep: any) => {
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: ep.title,
      cover: ep.cover,
      durationSeconds: ep.durationSeconds || 1800,
      podcast: {
        slug: "podcast",
        name: ep.podcastName || "Bamako Podcast",
        cover: ep.cover,
      },
      mediaSources: [
        {
          id: `src-${ep.id}`,
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          durationSeconds: ep.durationSeconds || 1800,
          isPrimaryAudio: true,
        },
      ],
    };
    playEpisode(playerEp);
  };

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-black text-white">
            Ma Bibliothèque
          </h1>
          <p className="text-xs text-[#B8B8B8]">
            Retrouvez vos écoutes en cours, podcasts favoris et téléchargements hors-ligne.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#141414] border border-[#242424] rounded-xl p-1 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "history"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Continuer l'écoute ({historyEpisodes.length})
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "saved"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Enregistrés ({savedEpisodes.length})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "following"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Abonnements ({followedPodcasts.length})
          </button>
          <button
            onClick={() => setActiveTab("downloads")}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === "downloads"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Hors-ligne
          </button>
        </div>
      </div>

      {/* Tab: History */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {historyEpisodes.map((item) => (
              <div
                key={item.id}
                onClick={() => handlePlay(item)}
                className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all cursor-pointer group shadow"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#282828]">
                    <Image src={item.cover} alt={item.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-5 h-5 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider truncate block">
                      {item.podcastName}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                      {item.title}
                    </h3>
                    <span className="bg-[#1E1E1E] text-[#B8B8B8] px-2 py-0.5 rounded text-[10px] border border-[#2A2A2A]">
                      {item.lang}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#222222]">
                  <div className="flex items-center justify-between text-[11px] text-[#757575] font-mono">
                    <span>Reprendre à {item.resumeTime}</span>
                    <span>{item.durationStr}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFBF00]"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Saved */}
      {activeTab === "saved" && (
        <div className="space-y-3">
          {savedEpisodes.map((ep) => (
            <div
              key={ep.id}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => handlePlay(ep)}
                  className="w-9 h-9 rounded-full bg-[#1E1E1E] group-hover:bg-[#FFBF00] text-[#B8B8B8] group-hover:text-[#0B0B0B] flex items-center justify-center shrink-0 shadow transition-colors"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#FFBF00] font-semibold">{ep.podcastName}</span>
                    <span className="text-[#757575]">• {ep.date}</span>
                  </div>
                  <h3
                    onClick={() => handlePlay(ep)}
                    className="text-xs md:text-sm font-bold text-white truncate cursor-pointer hover:underline"
                  >
                    {ep.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs">
                <span className="font-mono text-[#B8B8B8]">{ep.durationStr}</span>
                <button className="p-1.5 text-[#757575] hover:text-white" title="Télécharger">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-[#757575] hover:text-white" title="Options">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Following */}
      {activeTab === "following" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {followedPodcasts.map((pod) => (
            <Link
              key={pod.slug}
              href={`/podcasts/${pod.slug}`}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-xl p-3.5 flex flex-col gap-2.5 transition-all group"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#282828]">
                <Image src={pod.cover} alt={pod.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 text-[10px] text-white px-2 py-0.5 rounded border border-[#333333]">
                  {pod.badge}
                </span>
              </div>
              <div>
                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00]">
                  {pod.title}
                </h3>
                <p className="text-[11px] text-[#757575] truncate">{pod.author}</p>
                <p className="text-[10px] text-[#B8B8B8] pt-1">{pod.episodesCount} épisodes</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Tab: Downloads */}
      {activeTab === "downloads" && (
        <div className="bg-[#141414] border border-[#242424] rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#1C180E] border border-[#FFBF00]/40 text-[#FFBF00] flex items-center justify-center mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-headline font-bold text-white">Écoute Hors-ligne sur l'App Mobile</h3>
          <p className="text-xs text-[#B8B8B8] leading-relaxed">
            Pour sauvegarder vos podcasts et les écouter sans aucune connexion Internet (dans les transports, en voyage ou sans data), utilisez l'application mobile officielle Bamako Podcast.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsAppModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-bold transition-all shadow-md"
            >
              <Smartphone className="w-4 h-4" />
              <span>Télécharger l'application mobile</span>
            </button>
          </div>
        </div>
      )}

      {/* App Download Modal */}
      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    </div>
  );
}
