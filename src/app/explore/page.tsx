"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  Play,
  Share2,
  Bookmark,
  ListPlus,
  Smartphone,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  Music,
  Radio,
} from "lucide-react";
import { usePlayerStore, PlayerEpisode } from "../../store/playerStore";
import { AppDownloadModal } from "@/components/modals/AppDownloadModal";
import SuggestModal from "@/components/ui/SuggestModal";

function ExploreContent() {
  const { playEpisode } = usePlayerStore();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("Musique et culture à Bamako");
  const [activeTab, setActiveTab] = useState<"tous" | "podcasts" | "episodes">("tous");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    "Les voix de Bamako",
    "Amadou & Mariam Interview",
  ]);

  // Filter dropdown state
  const [selectedLang, setSelectedLang] = useState("Toutes les langues");
  const [selectedTopic, setSelectedTopic] = useState("Musique & Patrimoine");
  const [selectedDuration, setSelectedDuration] = useState("20 - 45 min (Standard)");
  const [selectedSort, setSelectedSort] = useState("Pertinence Mandé");

  useEffect(() => {
    const q = searchParams.get("q");
    const lang = searchParams.get("lang");
    if (q) setSearchQuery(q);
    if (lang === "bm") setSelectedLang("Bamanankan (Bambara)");
    else if (lang === "fr") setSelectedLang("Français");
    else if (lang === "ALL") setSelectedLang("Toutes les langues");
  }, [searchParams]);

  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({
    "chroniques-nuits": true,
  });

  const toggleFollow = (id: string) => {
    setFollowingMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const trendingTopics = [
    "Créer son entreprise",
    "Histoire de Ségou",
    "Musique mandingue",
    "Contes traditionnels",
  ];

  // Podcasts associées
  const matchingPodcasts = [
    {
      id: "pod-1",
      slug: "kora-balafon-moderne",
      title: "Kora & Balafon Moderne",
      studio: "STUDIO BADALABOUGOU • Saison 3",
      description:
        "L'exploration des ponts entre les mélodies traditionnelles mandingues et la production contemporaine.",
      stats: "14,2k abonnés • 28 épisodes",
      lang: "Bamanankan",
      cover: "/images/cover-studio.jpg",
    },
    {
      id: "pod-2",
      slug: "chroniques-nuits-bamako",
      title: "Chroniques des Nuits de...",
      studio: "COLLECTIF SABALIBOUGOU • Hebdo",
      description:
        "Rencontres intimes avec les musiciens de live clubs, les conteurs de rues et les voix de la capitale.",
      stats: "8,5k abonnés • 19 épisodes",
      lang: "Français",
      cover: "/images/cover-musique.jpg",
    },
  ];

  // Épisodes correspondants
  const matchingEpisodes: (PlayerEpisode & {
    epNumber: string;
    dateStr: string;
    lang: string;
    description: string;
    durationStr: string;
  })[] = [
    {
      id: "res-ep-1",
      slug: "la-nuit-hip-hop-griots",
      title: "La nuit où le hip-hop a rencontré les griots de Badalabougou",
      epNumber: "Épisode 24",
      dateStr: "Il y a 2 jours",
      lang: "Bamanankan",
      description:
        "Discussion avec Toumani Diabaté Jr. et le crew BKO Underground sur l'évolution de la parole scandée et des louanges urbaines.",
      durationStr: "34 min",
      durationSeconds: 2040,
      cover: "/images/cover-musique.jpg",
      podcast: {
        slug: "les-voix-de-bamako",
        name: "Les voix de Bamako",
        cover: "/images/cover-musique.jpg",
      },
      mediaSources: [
        {
          id: "m-1",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          durationSeconds: 2040,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "res-ep-2",
      slug: "les-guitares-du-nord-blues",
      title: "Les guitares du Nord et le blues du fleuve à Quinzambougou",
      epNumber: "Hors-série",
      dateStr: "14 mai 2024",
      lang: "Français",
      description:
        "Immersion nocturne dans les cours familiales où résonne le son des amplificateurs à lampes et des mélodies sahariennes.",
      durationStr: "42 min",
      durationSeconds: 2520,
      cover: "/images/cover-culture.jpg",
      podcast: {
        slug: "culture-vivante",
        name: "Culture vivante",
        cover: "/images/cover-culture.jpg",
      },
      mediaSources: [
        {
          id: "m-2",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
          durationSeconds: 2520,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "res-ep-3",
      slug: "heritage-ali-farka-toure",
      title: "L'héritage intemporel d'Ali Farka Touré expliqué aux jeunes beatmakers",
      epNumber: "Épisode 11",
      dateStr: "28 avr. 2024",
      lang: "Bamanankan",
      description:
        "Analyse note par note des motifs de Niafunké et de leur résonance dans les clubs électro de la capitale malienne.",
      durationStr: "29 min",
      durationSeconds: 1740,
      cover: "/images/cover-kora.jpg",
      podcast: {
        slug: "kora-balafon-moderne",
        name: "Kora & Balafon Moderne",
        cover: "/images/cover-kora.jpg",
      },
      mediaSources: [
        {
          id: "m-3",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          durationSeconds: 1740,
          isPrimaryAudio: true,
        },
      ],
    },
  ];

  const removeRecentSearch = (item: string) => {
    setRecentSearches(recentSearches.filter((s) => s !== item));
  };

  const filteredPodcasts = matchingPodcasts.filter((p) => {
    if (selectedLang.includes("Bamanankan") && p.lang !== "Bamanankan") return false;
    if (selectedLang.includes("Français") && p.lang !== "Français") return false;
    return true;
  });

  const filteredEpisodes = matchingEpisodes.filter((ep) => {
    if (selectedLang.includes("Bamanankan") && ep.lang !== "Bamanankan") return false;
    if (selectedLang.includes("Français") && ep.lang !== "Français") return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none">
      {/* 1. Header Status Pill (Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#242424] text-[#B8B8B8] w-fit">
          <span className="w-2 h-2 rounded-full bg-[#FFBF00]" />
          <span className="font-semibold text-white">ARCHIVE SONORE MANDÉ</span>
          <span className="text-[#666666]">•</span>
          <span>2 840 Épisodes répertoriés</span>
        </div>

        <button
          onClick={() => setIsAppModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1C180E] border border-[#FFBF00]/40 text-[#FFBF00] hover:bg-[#FFBF00] hover:text-[#0B0B0B] text-xs font-bold transition-all w-fit shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Écouter sur mobile • Télécharger l'App</span>
        </button>
      </div>

      {/* 2. Large Search Input (Image 3) */}
      <div className="relative">
        <div className="flex items-center bg-[#141414] border border-[#262626] rounded-2xl p-2 focus-within:border-[#FFBF00] transition-colors shadow-lg">
          <Search className="w-5 h-5 text-[#FFBF00] ml-3 mr-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des archives, récits mandingues, voix..."
            className="w-full bg-transparent text-sm md:text-base text-white placeholder-[#666666] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1.5 text-[#757575] hover:text-white mr-2"
              title="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => {}}
            className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shrink-0"
          >
            <span>Rechercher</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Filter Dropdown Selectors (Image 3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Langue de narration */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-2.5 space-y-1">
          <label className="text-[10px] text-[#757575] uppercase font-bold block">
            Langue de narration
          </label>
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="truncate">{selectedLang}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 ml-1" />
          </div>
        </div>

        {/* Thématique */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-2.5 space-y-1">
          <label className="text-[10px] text-[#757575] uppercase font-bold block">
            Thématique
          </label>
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="truncate">{selectedTopic}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 ml-1" />
          </div>
        </div>

        {/* Durée audio */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-2.5 space-y-1">
          <label className="text-[10px] text-[#757575] uppercase font-bold block">
            Durée audio
          </label>
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="truncate">{selectedDuration}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 ml-1" />
          </div>
        </div>

        {/* Trier par */}
        <div className="bg-[#141414] border border-[#242424] rounded-xl p-2.5 space-y-1">
          <label className="text-[10px] text-[#757575] uppercase font-bold block">
            Trier par
          </label>
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="truncate">{selectedSort}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#FFBF00] shrink-0 ml-1" />
          </div>
        </div>
      </div>

      {/* 4. Tendances & Recherches Récentes (Image 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: TENDANCES À BAMAKO */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FFBF00]">
            <TrendingUp className="w-4 h-4" />
            <span>TENDANCES À BAMAKO</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                onClick={() => setSearchQuery(topic)}
                className="px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#262626] text-xs text-[#B8B8B8] hover:text-white transition-colors"
              >
                • {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Recherches Récentes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#B8B8B8]">
              <Clock className="w-3.5 h-3.5" />
              <span>Recherches récentes</span>
            </div>
            {recentSearches.length > 0 && (
              <button
                onClick={() => setRecentSearches([])}
                className="text-[11px] text-[#757575] hover:text-white"
              >
                Effacer tout
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-xs text-[#B8B8B8]"
              >
                <span
                  onClick={() => setSearchQuery(item)}
                  className="cursor-pointer hover:text-white"
                >
                  ↗ {item}
                </span>
                <button
                  onClick={() => removeRecentSearch(item)}
                  className="text-[#666666] hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            {recentSearches.length === 0 && (
              <span className="text-xs text-[#666666]">Aucune recherche récente</span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Results Filter Tabs + Toggle État Vide (Image 3) */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1C1C1C]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("tous")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeTab === "tous"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]"
            }`}
          >
            Tous les résultats (18)
          </button>
          <button
            onClick={() => setActiveTab("podcasts")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === "podcasts"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]"
            }`}
          >
            Podcasts (4)
          </button>
          <button
            onClick={() => setActiveTab("episodes")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeTab === "episodes"
                ? "bg-[#FFBF00] text-[#0B0B0B]"
                : "bg-[#141414] text-[#B8B8B8] hover:text-white border border-[#242424]"
            }`}
          >
            Épisodes (14)
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#B8B8B8]">
          <button
            onClick={() => setShowEmptyState(!showEmptyState)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              showEmptyState
                ? "bg-[#FFBF00]/20 border-[#FFBF00] text-[#FFBF00]"
                : "bg-[#141414] border-[#2A2A2A] text-[#757575] hover:text-white"
            }`}
            title="Tester l'aperçu état vide"
          >
            Aperçu état vide
          </button>
          <span className="text-[#888888]">
            Requête : <span className="text-white font-medium">"{searchQuery}"</span>
          </span>
        </div>
      </div>

      {showEmptyState ? (
        /* Empty State */
        <div className="bg-[#141414] border border-[#242424] rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-[#1C1A14] border border-[#FFBF00]/40 text-[#FFBF00] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-headline font-bold text-white">
            Aucun résultat trouvé pour "{searchQuery}"
          </h3>
          <p className="text-xs text-[#B8B8B8]">
            Essayez de vérifier l'orthographe, d'utiliser des termes plus généraux ou d'explorer les thématiques en vogue à Bamako.
          </p>
          <button
            onClick={() => setSearchQuery("Musique et culture à Bamako")}
            className="px-4 py-2 rounded-full bg-[#FFBF00] text-black text-xs font-bold"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <>
          {/* 6. Section Podcasts & Émissions associées (Image 3) */}
          {(activeTab === "tous" || activeTab === "podcasts") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#FFBF00] rounded-full" />
                  <h2 className="text-lg font-headline font-bold text-white">
                    Podcasts & Émissions associées
                  </h2>
                </div>
                <Link
                  href="/explore"
                  className="text-xs text-[#FFBF00] hover:underline font-medium"
                >
                  Voir les 4 séries &gt;
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPodcasts.map((podcast) => {
                  const isFollowing = !!followingMap[podcast.id];
                  return (
                    <div
                      key={podcast.id}
                      className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 flex gap-4 transition-all"
                    >
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-[#282828]">
                        <Image
                          src={podcast.cover}
                          alt={podcast.title}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-[#0B0B0B]/90 text-[9px] text-[#FFBF00] font-bold px-1.5 py-0.5 rounded">
                          {podcast.lang}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#FFBF00] truncate">
                            {podcast.studio}
                          </p>
                          <Link href={`/podcasts/${podcast.slug}`}>
                            <h3 className="text-sm font-bold text-white truncate hover:text-[#FFBF00] transition-colors">
                              {podcast.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#B8B8B8] line-clamp-2 mt-1">
                            {podcast.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[11px] text-[#757575]">
                            {podcast.stats}
                          </span>
                          <button
                            onClick={() => toggleFollow(podcast.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                              isFollowing
                                ? "bg-[#1E1E1E] text-white border border-[#333333] hover:border-red-500/50 hover:text-red-400"
                                : "bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B]"
                            }`}
                          >
                            {isFollowing ? "Suivi" : "Suivre"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 7. Section Épisodes Correspondants (Image 3) */}
          {(activeTab === "tous" || activeTab === "episodes") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-[#FFBF00] rounded-full" />
                  <h2 className="text-lg font-headline font-bold text-white">
                    Épisodes Correspondants
                  </h2>
                </div>
                <span className="text-xs text-[#757575]">14 résultats trouvés</span>
              </div>

              <div className="space-y-3">
                {filteredEpisodes.map((ep, idx) => (
                  <div
                    key={ep.id}
                    className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => playEpisode(ep)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all ${
                          idx === 0
                            ? "bg-[#FFBF00] text-[#0B0B0B]"
                            : "bg-[#1E1E1E] group-hover:bg-[#FFBF00] text-[#B8B8B8] group-hover:text-[#0B0B0B]"
                        }`}
                        aria-label="Lecture"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </button>

                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="bg-[#1E1E1E] text-[#FFBF00] font-semibold px-2 py-0.5 rounded border border-[#2E2E2E]">
                            {ep.lang}
                          </span>
                          <span className="text-[#888888]">
                            {ep.epNumber} • {ep.dateStr}
                          </span>
                        </div>

                        <h3
                          onClick={() => playEpisode(ep)}
                          className="text-xs md:text-sm font-bold text-white truncate cursor-pointer hover:text-[#FFBF00] transition-colors"
                        >
                          {ep.title}
                        </h3>

                        <p className="text-xs text-[#B8B8B8] line-clamp-1 max-w-2xl">
                          {ep.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222222]">
                      <span className="font-mono text-xs text-[#B8B8B8]">{ep.durationStr}</span>
                      <button
                        className="p-1.5 text-[#757575] hover:text-white"
                        title="Ajouter à la file d'attente"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-[#757575] hover:text-[#FFBF00]"
                        title="Sauvegarder"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-[#757575] hover:text-white"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 8. Bottom CTA Banner (Image 3) */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#1C1A14] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-headline font-bold text-white">
              Vous ne trouvez pas votre voix favorite ?
            </h3>
            <p className="text-xs text-[#B8B8B8]">
              Suggérez un griot, un animateur radio ou un studio indépendant de Bamako.
            </p>
          </div>
        </div>

        <button onClick={() => setIsSuggestModalOpen(true)} className="px-5 py-2.5 rounded-full bg-[#1E1E1E] hover:bg-[#282828] border border-[#333333] hover:border-[#FFBF00] text-white text-xs font-semibold transition-colors shrink-0">
          Proposer une émission
        </button>
      </div>

      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />
        <SuggestModal isOpen={isSuggestModalOpen} onClose={() => setIsSuggestModalOpen(false)} />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement des archives sonores...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
