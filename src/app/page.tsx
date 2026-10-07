"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import {
  Play,
  Bookmark,
  Share2,
  Clock,
  Download,
  MoreVertical,
  ListPlus,
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

function HomeContent() {
  const { playEpisode } = usePlayerStore();
  const searchParams = useSearchParams();
  const [selectedFilter, setSelectedFilter] = useState("Toutes les langues");
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const handleSave = () => setIsSaved(!isSaved);
  const [copiedLink, setCopiedLink] = useState(false);
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); };

  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam === "bm") setSelectedFilter("â€¢ Bamanankan");
    else if (langParam === "fr") setSelectedFilter("FranÃ§ais");
    else if (langParam === "ALL") setSelectedFilter("Toutes les langues");
  }, [searchParams]);

  const filters = [
    "Toutes les langues",
    "FranÃ§ais",
    "â€¢ Bamanankan",
    "SoninkÃ©",
    "Peul (Fulfulde)",
    "SociÃ©tÃ© & RÃ©cits",
    "Ã‰conomie & Tech",
    "Culture & Arts",
  ];


  const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data);
  const { data, isLoading } = useSWR(`${API_BASE_URL}/home?country=all`, fetcher);

  const heroEpisode = data?.heroEpisode || null;
  const recommendedPodcasts = data?.trending || [];
  const latestEpisodes = data?.latestEpisodes || [];
  const resumeEpisodes: any[] = [];

  const filteredPodcasts = recommendedPodcasts.map((p: any) => ({
    ...p,
    title: p.name,
    author: "CrÃ©ateur",
    badge: p.categories?.[0]?.category?.name || "Podcast",
    episodesCount: p._count?.episodes || 0,
    lang: p.primaryLanguage?.name || "FR",
    cover: p.cover || "/images/placeholder.jpg",
  }));
  const filteredEpisodes = latestEpisodes.map((ep: any) => ({
    ...ep,
    timeAgo: new Date(ep.publishedAt).toLocaleDateString(),
    durationStr: Math.floor(ep.durationSeconds / 60) + " min",
    podcast: ep.podcast || { name: "Podcast inconnu", cover: "/images/placeholder.jpg" }
  }));

  if (isLoading) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-[#FFBF00] animate-pulse font-bold text-xl">Chargement des donnÃ©es...</div>
      </div>
    );
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
            <span className="text-white font-semibold">Ã‰coute libre et fluide</span> â€” Accessible sans inscription obligatoire â€¢ Les voix phares et rÃ©cits du MandÃ© en accÃ¨s illimitÃ©.
          </p>
        </div>
        <button
          onClick={() => setIsAppModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>TÃ©lÃ©charger l'App</span>
        </button>
      </div>

      {/* 2. Hero Featured Card (Image 1) */}
      <div className="relative rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Solid sleek dark layout with image on the right */}
        <div className="space-y-4 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              Ã‰DITION SPÃ‰CIALE
            </span>
            <span className="bg-[#1C1C1C] border border-[#2E2E2E] text-[#B8B8B8] text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              FranÃ§ais & Bamanankan
            </span>
            <span className="text-[#757575] text-xs">â€¢ Parution hebdo</span>
          </div>

          <p className="text-[#FFBF00] text-xs font-bold uppercase tracking-wider">
            LES VOIX DE BAMAKO â€¢ Ã‰P. 34
          </p>

          <h1 className="text-2xl md:text-4xl font-headline font-extrabold text-white leading-tight">
            Une nouvelle gÃ©nÃ©ration de musiciens maliens
          </h1>

          <p className="text-xs md:text-sm text-[#B8B8B8] leading-relaxed">
            Fatoumata Diawara et des artistes Ã©mergents de Badalabougou explorent la rÃ©invention du son mandingue, entre rythmes afro-Ã©lectro et instruments traditionnels...
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => playEpisode(heroEpisode)}
              className="px-5 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ã‰couter maintenant (42 min)</span>
            </button>

            <button
              onClick={handleSave}
              className={`px-4 py-2.5 rounded-full hover:bg-[#252525] border border-[#2E2E2E] text-xs font-semibold flex items-center gap-2 transition-colors ${
                isSaved ? "bg-[#252525] text-[#FFBF00]" : "bg-[#1C1C1C] text-white"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-[#FFBF00]" : "text-[#B8B8B8]"}`} />
              <span>{isSaved ? "AjoutÃ© Ã  la bibliothÃ¨que" : "Ajouter Ã  la bibliothÃ¨que"}</span>
            </button>

            <button
              onClick={() => usePlayerStore.getState().addToQueue(heroEpisode)}
              className="p-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white transition-colors"
              title="Ajouter Ã  la file d'attente"
            >
              <ListPlus className="w-4 h-4" />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white transition-colors"
              title="Partager l'Ã©pisode"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#FFBF00]" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Visual on the right */}
        <div className="relative w-full md:w-80 h-52 md:h-64 rounded-xl overflow-hidden shrink-0 border border-[#262626] bg-[#0E0E0E]">
          <Image
            src="/images/cover-musique.jpg"
            alt="Une nouvelle gÃ©nÃ©ration de musiciens maliens"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* 3. Filter Bar (Image 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tracking-wider uppercase text-[#B8B8B8]">
            FILTRER L'Ã‰COUTE
          </span>
          <span className="text-[#FFBF00] font-medium">64 sÃ©ries disponibles</span>
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

      {/* 4. Continuer l'Ã©coute (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
            <Clock className="w-4 h-4 text-[#FFBF00]" />
            <h2>Continuer l'Ã©coute</h2>
          </div>
          <Link
            href="/library"
            className="text-xs text-[#B8B8B8] hover:text-[#FFBF00] transition-colors"
          >
            Voir l'historique
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumeEpisodes.map((item) => (
            <div
              key={item.id}
              onClick={() => playEpisode(item)}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl p-3.5 flex items-center gap-4 transition-all cursor-pointer group"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#282828]">
                <Image src={item.cover || "/images/cover-entreprendre.jpg"} alt={item.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 fill-white text-white drop-shadow" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#FFBF00] uppercase tracking-wide truncate">
                    {item.podcast.name}
                  </span>
                  <span className="bg-[#1E1E1E] px-2 py-0.5 rounded text-[#B8B8B8] border border-[#2A2A2A]">
                    {item.langBadge}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                  {item.title}
                </h3>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[#757575] font-mono">
                    <span>Reprendre Ã  {item.resumeTime}</span>
                    <span>{Math.round(item.durationSeconds / 60)} min</span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFBF00]"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Podcasts recommandÃ©s (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Podcasts recommandÃ©s
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              SÃ©lection Ã©ditoriale des productions phares du Mali et de la diaspora
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
          {filteredPodcasts.map((podcast: any) => (
            <Link
              key={podcast.slug}
              href={`/podcasts/${podcast.slug}`}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-xl p-3 flex flex-col gap-2.5 transition-all group"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#282828] bg-[#0E0E0E]">
                <Image src={podcast.cover} alt={podcast.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
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
                  {podcast.episodesCount} Ã©pisodes â€¢ {podcast.lang}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Derniers Ã©pisodes parus (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Derniers Ã©pisodes parus
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              FraÃ®chement enregistrÃ©s dans nos studios partenaires
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#242424] hover:border-[#333333] text-xs font-medium text-[#B8B8B8] hover:text-white transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Trier par rÃ©cence</span>
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
                  aria-label="Ã‰couter"
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
                    <span className="text-[#757575]">â€¢ {ep.timeAgo}</span>
                  </div>
                  <h3
                    onClick={() => playEpisode(ep)}
                    className="text-xs font-bold text-white truncate cursor-pointer hover:underline"
                  >
                    {ep.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-[#757575]">
                <span className="font-mono text-[#B8B8B8]">{ep.durationStr}</span>
                <button
                  className="p-1.5 hover:text-white transition-colors"
                  title="TÃ©lÃ©charger l'Ã©pisode"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => usePlayerStore.getState().addToQueue(ep)}
                  className="p-1.5 hover:text-white transition-colors"
                  title="Ajouter Ã  la file d'attente"
                >
                  <ListPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA CrÃ©ateurs Studio (Image 2) */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 shadow-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-headline font-bold text-white">
              Vous racontez des histoires Ã  Bamako ?
            </h3>
            <p className="text-xs text-[#B8B8B8] max-w-xl">
              Rejoignez le collectif des crÃ©ateurs sonores de Bamako Podcast. AccÃ©dez Ã  nos studios, formations au montage et monÃ©tisation directe.
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
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex-1 w-full min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="p-12 text-center text-[#757575] font-semibold animate-pulse">
          Chargement de l'accueil...
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement...</div>}>
      <HomeContent />
    </Suspense>
  );
}
