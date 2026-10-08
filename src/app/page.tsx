"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import {
  Play, Pause,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  Download,
  MoreVertical,
  ListPlus,
  ListMinus,
  SlidersHorizontal,
  Mic,
  ArrowRight,
  Info,
  Check,
  Smartphone,
} from "lucide-react";
import { usePlayerStore, PlayerEpisode } from "../store/playerStore";
import { AppDownloadModal } from "@/components/modals/AppDownloadModal";
import { DownloadAppSection } from "@/components/ui/DownloadAppSection";

function HomeSkeleton() {
  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-pulse select-none bg-[#0B0B0B] min-h-screen">
      {/* Alert Banner Skeleton */}
      <div className="bg-[#141414] border border-[#242424] rounded-xl h-12 w-full"></div>
      
      {/* Hero Card Skeleton */}
      <div className="rounded-2xl bg-[#141414] border border-[#242424] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 h-[300px]">
        <div className="space-y-4 w-full max-w-xl">
          <div className="h-4 bg-[#2A2A2A] rounded w-24"></div>
          <div className="h-8 bg-[#2A2A2A] rounded w-3/4"></div>
          <div className="h-4 bg-[#2A2A2A] rounded w-full"></div>
          <div className="h-4 bg-[#2A2A2A] rounded w-5/6"></div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-[#2A2A2A] rounded-full w-32"></div>
            <div className="h-10 bg-[#2A2A2A] rounded-full w-32"></div>
          </div>
        </div>
        <div className="w-48 h-48 bg-[#2A2A2A] rounded-xl hidden md:block shrink-0"></div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex gap-2 pb-2 overflow-hidden">
        <div className="h-8 bg-[#141414] border border-[#242424] rounded-full w-24"></div>
        <div className="h-8 bg-[#141414] border border-[#242424] rounded-full w-20"></div>
        <div className="h-8 bg-[#141414] border border-[#242424] rounded-full w-32"></div>
        <div className="h-8 bg-[#141414] border border-[#242424] rounded-full w-24"></div>
      </div>

      {/* Sections Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-[#2A2A2A] rounded w-48 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square bg-[#141414] border border-[#242424] rounded-xl w-full"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-3/4 mt-1"></div>
              <div className="h-3 bg-[#2A2A2A] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
        </div>
    );
}

function HomeContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const personalDataReady = isAuthenticated && !authLoading;
  const { playEpisode, currentEpisode, isPlaying, togglePlay } = usePlayerStore();
  const searchParams = useSearchParams();
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };
    const { data: resumeEpisodesData } = useSWR(personalDataReady ? ["/me/continue-listening", user?.id] : null, async ([url]) => {
    try { const data = (await fetchApi(url)).data; return Array.isArray(data) ? data : []; } catch { return []; }
  });
  
  const { data: savedEpisodesData, mutate: mutateSaved } = useSWR(personalDataReady ? ["/me/saved", user?.id] : null, async ([url]) => {
    try { const data = (await fetchApi(url)).data; return Array.isArray(data) ? data : []; } catch { return []; }
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };

  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam === "bm") setSelectedFilter("• Bamanankan");
    else if (langParam === "fr") setSelectedFilter("Français");
    else if (langParam === "ALL") setSelectedFilter("Toutes les langues");
  }, [searchParams]);

  const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data);
  const { data, isLoading } = useSWR(`${API_BASE_URL}/home?country=all`, fetcher);
  const { data: categoriesData } = useSWR(`${API_BASE_URL}/categories`, fetcher);
  
  const filters = ["Tous", "Français", "Bamanankan", ...(categoriesData ? categoriesData.slice(0, 8).map((c: any) => c.name) : [])];


  

    const heroEpisode = data?.heroEpisode || null;
  const recommendedPodcasts = data?.trending || [];
  const latestEpisodes = (data?.latestEpisodes || []).filter((ep: any) => ep.id !== heroEpisode?.id);
  const resumeEpisodes = personalDataReady && Array.isArray(resumeEpisodesData) ? resumeEpisodesData.slice(0, 4) : [];
  const savedEpisodes = personalDataReady && Array.isArray(savedEpisodesData) ? savedEpisodesData : [];

  const isSaved = heroEpisode ? savedEpisodes.some((e: any) => e.episodeId === heroEpisode.id) : false;

  const toggleSaveList = async (ep: any) => {
    if (!personalDataReady) { flash("Connectez-vous pour enregistrer un épisode."); return; }
    const currentlySaved = savedEpisodes.some((e: any) => e.episodeId === ep.id);
    mutateSaved(
      currentlySaved 
        ? savedEpisodes.filter((e: any) => e.episodeId !== ep.id)
        : [...savedEpisodes, { episodeId: ep.id }],
      false
    );
    try {
      await fetchApi(`/episodes/${ep.id}/save`, { method: currentlySaved ? "DELETE" : "POST" });
    } catch {
      mutateSaved(savedEpisodesData, false);
      flash("Erreur lors de la sauvegarde.");
    }
  };

  const handleSave = async () => {
    if (!heroEpisode) return;
    if (!personalDataReady) { flash("Connectez-vous pour enregistrer un épisode."); return; }
    const currentlySaved = isSaved;
    
    // Optimistic UI update
    mutateSaved(
      currentlySaved 
        ? savedEpisodes.filter((e: any) => e.episodeId !== heroEpisode.id)
        : [...savedEpisodes, { episodeId: heroEpisode.id }],
      false
    );

    try {
      if (currentlySaved) {
        await fetchApi(`/episodes/${heroEpisode.id}/save`, { method: "DELETE" });
      } else {
        await fetchApi(`/episodes/${heroEpisode.id}/save`, { method: "POST" });
      }
      mutateSaved();
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
      mutateSaved(); // Revert UI
    }
  };

  const filteredPodcasts = recommendedPodcasts
    .filter((p: any) => {
      if (selectedFilter === "Tous") return true;
      if (selectedFilter === "Français") return p.primaryLanguage?.code === "fr" || p.primaryLanguage?.name?.toLowerCase().includes("fran");
      if (selectedFilter === "Bamanankan") return p.primaryLanguage?.code === "bm" || p.primaryLanguage?.name?.toLowerCase().includes("bama");
      // filter by category
      return p.categories?.some((c: any) => c.category?.name === selectedFilter);
    })
    .map((p: any) => ({
    ...p,
    title: p.name,
    author: "Créateur",
    badge: p.categories?.[0]?.category?.name || "Podcast",
    episodesCount: p._count?.episodes || 0,
    lang: p.primaryLanguage?.name || "FR",
    cover: p.cover || "/images/placeholder.jpg",
  }));
  const filteredEpisodes = latestEpisodes
    .filter((ep: any) => {
      if (selectedFilter === "Tous") return true;
      if (selectedFilter === "Français") return ep.languageCode === "fr" || ep.language?.name?.toLowerCase().includes("fran");
      if (selectedFilter === "Bamanankan") return ep.languageCode === "bm" || ep.language?.name?.toLowerCase().includes("bama");
      // filter by podcast category
      return ep.podcast?.categories?.some((c: any) => c.category?.name === selectedFilter);
    })
    .map((ep: any) => ({
    ...ep,
    timeAgo: (() => {
      const days = Math.floor((new Date().getTime() - new Date(ep.publishedAt).getTime()) / (1000 * 3600 * 24));
      if (days === 0) return "Aujourd'hui";
      if (days === 1) return "Hier";
      if (days < 7) return `Il y a ${days} jours`;
      return new Date(ep.publishedAt).toLocaleDateString();
    })(),
    durationStr: ep.durationSeconds ? Math.floor(ep.durationSeconds / 60) + " min" : "",
    podcast: ep.podcast || { name: "Podcast inconnu", cover: "/images/placeholder.jpg" }
  }));

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none">
      {/* 1. Alert Banner (Image 1) */}
      <div className="bg-[#141414] border border-[#242424] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-[#B8B8B8]">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#1C180E] border border-[#FFBF00]/30 flex items-center justify-center text-[#FFBF00] shrink-0">
            <Info className="w-3 h-3" />
          </span>
          <p className="leading-snug">
            <span className="text-white font-semibold">Écoute libre et fluide</span> — Accessible sans inscription obligatoire • Les voix phares et récits du Mandé en accès illimité.
          </p>
        </div>
        <button
          onClick={() => setIsAppModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Télécharger l'App</span>
        </button>
      </div>

      {/* 2. Hero Featured Card (Dynamic) */}
        {heroEpisode ? (
        <div className="relative rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                EN VEDETTE
              </span>
              <span className="bg-[#1C1C1C] border border-[#2E2E2E] text-[#B8B8B8] text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                {heroEpisode.language?.name || heroEpisode.languageCode || 'Français'}
              </span>
            </div>
  
            <p className="text-[#FFBF00] text-xs font-bold uppercase tracking-wider">
              {heroEpisode.podcast?.name || "BAMAKO PODCAST"}
            </p>
  
            <h1 className="text-2xl md:text-4xl font-headline font-extrabold text-white leading-tight">
              {heroEpisode.title}
            </h1>
  
            <p className="text-xs md:text-sm text-[#B8B8B8] leading-relaxed line-clamp-3">
              {heroEpisode.description ? heroEpisode.description.replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/g, "").replace(/Regardez la vidéo :/gi, "").trim() : "Écoutez cet épisode incontournable de Bamako Podcast..."}
            </p>
  
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (currentEpisode?.id === heroEpisode.id && isPlaying) {
                    togglePlay();
                  } else {
                    playEpisode(heroEpisode);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                {currentEpisode?.id === heroEpisode.id && isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>
                  {currentEpisode?.id === heroEpisode.id && isPlaying ? "Mettre en pause" : `Écouter maintenant ${heroEpisode.durationSeconds ? `(${Math.floor(heroEpisode.durationSeconds / 60)} min)` : ""}`}
                </span>
              </button>
  
              <button
                onClick={handleSave}
                className={`px-4 py-2.5 rounded-full hover:bg-[#252525] border border-[#2E2E2E] text-xs font-semibold flex items-center gap-2 transition-colors ${
                  isSaved ? "bg-[#252525] text-[#FFBF00]" : "bg-[#1C1C1C] text-white"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-[#FFBF00]" : "text-[#B8B8B8]"}`} />
                <span className="hidden sm:inline">{isSaved ? "Ajouté à la bibliothèque" : "Ajouter à la bibliothèque"}</span>
              </button>
  
              <button
                onClick={() => {
                    usePlayerStore.getState().addToQueue(heroEpisode);
                    flash("Ajouté à la file d'attente !");
                  }}
                className="p-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white transition-colors"
                title="Ajouter à la file d'attente"
              >
                <ListPlus className="w-4 h-4" />
              </button>
  
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white transition-colors"
                title="Partager l'épisode"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#FFBF00]" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
  
          <div className="relative w-full md:w-[400px] lg:w-[500px] aspect-video rounded-xl overflow-hidden shrink-0 border border-[#262626] bg-[#0E0E0E] shadow-2xl">
            <Image
              src={heroEpisode.cover || heroEpisode.podcast?.cover || "/images/cover-musique.jpg"}
              alt={heroEpisode.title}
              fill
              className="object-cover" sizes="(max-width: 768px) 100vw, 30vw" priority
            />
          </div>
        </div>
        ) : null}
  
        {/* 3. Filter Bar (Image 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tracking-wider uppercase text-[#B8B8B8]">
            FILTRER L'ÉCOUTE
          </span>
          <span className="text-[#FFBF00] font-medium">64 séries disponibles</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => {
            const isActive = selectedFilter === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#FFBF00] text-[#0B0B0B]"
                    : "bg-[#141414] hover:bg-[#1E1E1E] text-[#B8B8B8] hover:text-white border border-[#242424]"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Continuer l'écoute (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
            <Clock className="w-4 h-4 text-[#FFBF00]" />
            <h2>Continuer l'écoute</h2>
          </div>
          <Link
            href="/library"
            className="text-xs text-[#B8B8B8] hover:text-[#FFBF00] transition-colors"
          >
            Voir l'historique
          </Link>
        </div>

        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
          {resumeEpisodes.map((item: any) => {
            const position = item.positionSeconds || 0;
            const duration = item.episode?.durationSeconds || 1;
            const percent = Math.min(100, (position / duration) * 100);
            
            return (
              <div
                key={item.episodeId || item.id}
                onClick={() => {
                  const epToPlay = item.episode || item;
                  if (currentEpisode?.id === epToPlay.id && isPlaying) {
                    togglePlay();
                  } else {
                    playEpisode(epToPlay);
                  }
                }}
                className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl p-3.5 flex items-center gap-4 transition-all cursor-pointer group w-[300px] md:w-[350px] shrink-0 snap-start shadow"
              >
                <div className="relative w-28 aspect-video rounded-lg overflow-hidden shrink-0 border border-[#282828] bg-[#0E0E0E]">
                  <Image src={(item.episode?.cover || item.cover) || "/images/cover-entreprendre.jpg"} alt={item.episode?.title || item.title} fill sizes="112px" className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentEpisode?.id === (item.episode?.id || item.id) && isPlaying ? (
                      <Pause className="w-5 h-5 fill-white text-white drop-shadow" />
                    ) : (
                      <Play className="w-5 h-5 fill-white text-white drop-shadow" />
                    )}
                  </div>
                </div>
  
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="font-bold text-[#FFBF00] text-[10px] uppercase tracking-wide truncate block">
                    {item.episode?.podcast?.name || item.podcast?.name || "Podcast"}
                  </span>
  
                  <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors leading-tight">
                    {item.episode?.title || item.title}
                  </h3>
  
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[9px] text-[#757575] font-mono">
                      <span>Reprendre</span>
                      <span>{item.episode?.durationSeconds ? `${Math.floor(item.episode.durationSeconds / 60)} min` : ""}</span>
                    </div>
                    <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FFBF00]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Podcasts recommandés (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Podcasts recommandés
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              Sélection éditoriale des productions phares du Mali et de la diaspora
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-semibold text-[#FFBF00] hover:underline"
          >
            Tout explorer
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredPodcasts.slice(0, 10).map((podcast: any) => (
            <Link
              key={podcast.slug}
              href={`/podcasts/${podcast.slug}`}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-xl p-3 flex flex-col gap-2.5 transition-all group"
            >
              <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#282828] bg-[#0E0E0E]">
                <Image src={podcast.cover} alt={podcast.title} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 backdrop-blur-sm text-[10px] font-semibold text-white px-2 py-0.5 rounded border border-[#333333]">
                  {podcast.badge}
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                  {podcast.title}
                </h3>
                <p className="text-[11px] text-[#757575] truncate">{podcast.author}</p>
                <p className="text-[10px] text-[#B8B8B8] pt-1">
                  {podcast.episodesCount} épisodes • {podcast.lang}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Derniers épisodes parus (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Derniers épisodes parus
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              Fraîchement enregistrés dans nos studios partenaires
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#242424] hover:border-[#333333] text-xs font-medium text-[#B8B8B8] hover:text-white transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Trier par récence</span>
          </button>
        </div>

        <div className="space-y-2">
          {filteredEpisodes.map((ep: any) => (
            <div
              key={ep.id}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => playEpisode(ep)}
                  className="w-8 h-8 rounded-full bg-[#1E1E1E] group-hover:bg-[#FFBF00] text-[#B8B8B8] group-hover:text-[#0B0B0B] flex items-center justify-center shrink-0 transition-colors shadow-sm"
                  aria-label="Écouter"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#FFBF00] font-semibold">{ep.podcast.name}</span>
                    {ep.langBadge && (
                      <span className="bg-[#1E1E1E] text-[#B8B8B8] px-1.5 py-0.2 rounded text-[10px] border border-[#2A2A2A]">
                        {ep.langBadge}
                      </span>
                    )}
                    <span className="text-[#757575]">• {ep.timeAgo}</span>
                  </div>
                  <h3
                    onClick={() => {
                      if (currentEpisode?.id === ep.id && isPlaying) {
                        togglePlay();
                      } else {
                        playEpisode(ep);
                      }
                    }}
                    className="text-xs font-bold text-white truncate cursor-pointer hover:underline"
                  >
                    {ep.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-[#757575]">
                <span className="font-mono text-[#B8B8B8]">{ep.durationStr}</span>
                {(() => {
                  const isEpSaved = savedEpisodes.some((e: any) => e.episodeId === ep.id);
                  const queueIndex = usePlayerStore.getState().queue.findIndex((q: any) => q.id === ep.id);
                  const isInQueue = queueIndex !== -1;
                  return (
                    <>
                      <button
                        onClick={() => toggleSaveList(ep)}
                        className={`p-1.5 transition-colors ${isEpSaved ? "text-[#FFBF00]" : "hover:text-white"}`}
                        title={isEpSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        {isEpSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (isInQueue) {
                            usePlayerStore.getState().removeFromQueue(queueIndex);
                            flash("Retiré de la file d'attente !");
                          } else {
                            usePlayerStore.getState().addToQueue(ep);
                            flash("Ajouté à la file d'attente !");
                          }
                        }}
                        className={`p-1.5 transition-colors ${isInQueue ? "text-[#FFBF00]" : "hover:text-white"}`}
                        title={isInQueue ? "Retirer de la file d'attente" : "Ajouter à la file d'attente"}
                      >
                        {isInQueue ? <ListMinus className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />}
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA Créateurs Studio (Image 2) */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 shadow-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-headline font-bold text-white">
              Vous racontez des histoires à Bamako ?
            </h3>
            <p className="text-xs text-[#B8B8B8] max-w-xl">
              Rejoignez le collectif des créateurs sonores de Bamako Podcast. Accédez à nos studios, formations au montage et monétisation directe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Link
            href="/studio"
            className="flex-1 md:flex-none text-center px-5 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-md"
          >
            Ouvrir mon studio
          </Link>
          <Link
            href="/studio"
            className="text-xs font-semibold text-[#B8B8B8] hover:text-white px-3 py-2 transition-colors"
          >
            En savoir plus
          </Link>
        </div>
      </div>

      {/* 9. Mobile App Promotion Section */}
      <DownloadAppSection />

      {/* App Download Modal */}
      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
    {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#FFBF00] text-[#0B0B0B] px-4 py-2 rounded-full font-bold text-sm shadow-xl animate-fade-in pointer-events-none">
            {toast}
          </div>
        )}
      </div>
    );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <HomeSkeleton />;
  }

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
