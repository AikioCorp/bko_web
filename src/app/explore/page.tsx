"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { fetchApi } from "@/lib/api";
import {
  Search, X, SlidersHorizontal, ChevronDown, Check,
  Play, Video, Headphones, Radio, Bookmark, BookmarkCheck,
  ListPlus, Share2, MoreVertical, Loader2, Sparkles,
  ExternalLink, Building2, Clock, Globe, ArrowRight, Heart
} from "lucide-react";
import { usePlayerStore, PlayerEpisode } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { useLikesStore } from "../../store/likesStore";
import { AdBannerSlot } from "@/components/ads/AdBannerSlot";
import { CreatorCalloutSlot, PromoteCalloutSlot } from "@/components/explore/CalloutSlots";
import { AdvertiserInquiryModal } from "@/components/modals/AdvertiserInquiryModal";
import { AddToPlaylistModal } from "@/components/modals/AddToPlaylistModal";

const fetcher = (url: string) => fetchApi(url);

// Format seconds into "1h 15 min" or "45 min"
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins} min` : `${hours}h`;
}

// Relative date formatter
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function ExploreMain() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { playEpisode, addToQueue } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const { isLiked, toggleLike, loadLikes, isLoaded: likesLoaded } = useLikesStore();

  // URL state parameters
  const qParam = searchParams.get("q") || "";
  const viewParam = (searchParams.get("view") as "episodes" | "podcasts") || "episodes";
  const formatParam = (searchParams.get("format") as "ALL" | "AUDIO" | "VIDEO") || "ALL";
  const sortParam = (searchParams.get("sort") as "recent" | "oldest" | "popular") || "recent";
  const langParam = searchParams.get("lang") || "";
  const catParam = searchParams.get("category") || "";
  const countryParam = searchParams.get("country") || "";
  const durationParam = (searchParams.get("duration") as "ALL" | "SHORT" | "MEDIUM" | "LONG") || "ALL";

  // Local state
  const [searchInput, setSearchInput] = useState(qParam);
  const [debouncedQ, setDebouncedQ] = useState(qParam);
  const [activeView, setActiveView] = useState<"episodes" | "podcasts">(viewParam);
  const [formatFilter, setFormatFilter] = useState<"ALL" | "AUDIO" | "VIDEO">(formatParam);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "popular">(sortParam);
  const [selectedLang, setSelectedLang] = useState(langParam);
  const [selectedCat, setSelectedCat] = useState(catParam);
  const [selectedCountry, setSelectedCountry] = useState(countryParam);
  const [selectedDuration, setSelectedDuration] = useState<"ALL" | "SHORT" | "MEDIUM" | "LONG">(durationParam);

  // Filter drawer / sheet
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeMenuEpisodeId, setActiveMenuEpisodeId] = useState<string | null>(null);

  // Modals state
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [playlistEpisodeId, setPlaylistEpisodeId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Saved episodes local cache for instant UI feedback
  const [savedEpisodeIds, setSavedEpisodeIds] = useState<Set<string>>(new Set());

  // Pagination state for Episodes
  const [episodeOffset, setEpisodeOffset] = useState(0);
  const [loadedEpisodes, setLoadedEpisodes] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Pagination state for Podcasts
  const [podcastOffset, setPodcastOffset] = useState(0);
  const [loadedPodcasts, setLoadedPodcasts] = useState<any[]>([]);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Synchronize state when URL query parameters change (e.g. from navigation links or back/forward)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const v = (searchParams.get("view") as "episodes" | "podcasts") || "episodes";
    const f = (searchParams.get("format") as "ALL" | "AUDIO" | "VIDEO") || "ALL";
    const s = (searchParams.get("sort") as "recent" | "oldest" | "popular") || "recent";
    const l = searchParams.get("lang") || "";
    const c = searchParams.get("category") || "";
    const co = searchParams.get("country") || "";
    const d = (searchParams.get("duration") as "ALL" | "SHORT" | "MEDIUM" | "LONG") || "ALL";

    setActiveView(v);
    setFormatFilter(f);
    setSortOrder(s);
    setSelectedLang(l);
    setSelectedCat(c);
    setSelectedCountry(co);
    setSelectedDuration(d);
    if (q !== searchInput) {
      setSearchInput(q);
      setDebouncedQ(q);
    }
  }, [searchParams]);

  // Sync state to URL without resetting scroll
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (activeView !== "episodes") params.set("view", activeView);
    if (formatFilter !== "ALL") params.set("format", formatFilter);
    if (sortOrder !== "recent") params.set("sort", sortOrder);
    if (selectedLang) params.set("lang", selectedLang);
    if (selectedCat) params.set("category", selectedCat);
    if (selectedCountry) params.set("country", selectedCountry);
    if (selectedDuration !== "ALL") params.set("duration", selectedDuration);

    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      router.replace(`${pathname}${newQuery ? `?${newQuery}` : ""}`, { scroll: false });
    }
  }, [
    debouncedQ, activeView, formatFilter, sortOrder,
    selectedLang, selectedCat, selectedCountry, selectedDuration
  ]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setEpisodeOffset(0);
    setPodcastOffset(0);
  }, [
    debouncedQ, activeView, formatFilter, sortOrder,
    selectedLang, selectedCat, selectedCountry, selectedDuration
  ]);

  // Fetch taxonomies (Categories, Languages, Countries)
  const { data: exploreTaxonomies } = useSWR("/explore", fetcher);

  // Fetch active Ads campaigns
  const { data: activeAdsResponse } = useSWR<any>("/ads/active?placement=EXPLORE_CATALOG", fetcher);
  const activeAds: any[] = activeAdsResponse?.data || (Array.isArray(activeAdsResponse) ? activeAdsResponse : []);

  // Build Episodes API endpoint
  const episodesQueryUrl = useMemo(() => {
    if (activeView !== "episodes") return null;
    const p = new URLSearchParams();
    p.set("limit", "24");
    p.set("offset", episodeOffset.toString());
    if (debouncedQ) p.set("q", debouncedQ);
    if (selectedCat) p.set("category", selectedCat);
    if (selectedLang) p.set("lang", selectedLang);
    if (selectedCountry) p.set("country", selectedCountry);
    if (formatFilter !== "ALL") p.set("mediaType", formatFilter);
    if (selectedDuration !== "ALL") p.set("duration", selectedDuration);
    if (sortOrder) p.set("sort", sortOrder);
    return `/episodes/catalog?${p.toString()}`;
  }, [
    activeView, episodeOffset, debouncedQ, selectedCat,
    selectedLang, selectedCountry, formatFilter, selectedDuration, sortOrder
  ]);

  const {
    data: episodesResponse,
    isLoading: isEpisodesInitialLoading,
    error: episodesError,
    mutate: mutateEpisodes,
  } = useSWR(episodesQueryUrl, fetcher);

  // Accumulate paginated episodes
  useEffect(() => {
    const list = episodesResponse?.data || (Array.isArray(episodesResponse) ? episodesResponse : null);
    if (list) {
      if (episodeOffset === 0) {
        setLoadedEpisodes(list);
      } else {
        setLoadedEpisodes((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = list.filter((e: any) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
      setIsLoadingMore(false);
    }
  }, [episodesResponse, episodeOffset]);

  // Build Podcasts API endpoint
  const podcastsQueryUrl = useMemo(() => {
    if (activeView !== "podcasts") return null;
    const p = new URLSearchParams();
    p.set("limit", "20");
    p.set("offset", podcastOffset.toString());
    if (debouncedQ) p.set("q", debouncedQ);
    if (selectedCat) p.set("category", selectedCat);
    if (selectedLang) p.set("language", selectedLang);
    if (selectedCountry) p.set("country", selectedCountry);
    if (sortOrder) p.set("sort", sortOrder);
    return `/podcasts?${p.toString()}`;
  }, [activeView, podcastOffset, debouncedQ, selectedCat, selectedLang, selectedCountry, sortOrder]);

  const {
    data: podcastsResponse,
    isLoading: isPodcastsInitialLoading,
    error: podcastsError,
  } = useSWR(podcastsQueryUrl, fetcher);

  // Accumulate paginated podcasts
  useEffect(() => {
    const list = podcastsResponse?.data || (Array.isArray(podcastsResponse) ? podcastsResponse : null);
    if (list) {
      if (podcastOffset === 0) {
        setLoadedPodcasts(list);
      } else {
        setLoadedPodcasts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = list.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }
      setIsLoadingMore(false);
    }
  }, [podcastsResponse, podcastOffset]);

  // Fetch user saved episodes if authenticated
  const { data: userSavedResponse } = useSWR(isAuthenticated ? "/me/saved" : null, fetcher);
  useEffect(() => {
    const list = userSavedResponse?.data || (Array.isArray(userSavedResponse) ? userSavedResponse : null);
    if (Array.isArray(list)) {
      setSavedEpisodeIds(new Set(list.map((e: any) => e.id)));
    }
  }, [userSavedResponse]);

  // Handle Play Episode
  const handlePlayEpisode = (ep: any, preferredMode?: "AUDIO" | "VIDEO") => {
    if (!ep) return;
    const mode = preferredMode || (ep.videoAvailable ? "VIDEO" : "AUDIO");
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.cover || ep.podcast?.cover || "/images/default-cover.jpg",
      durationSeconds: ep.durationSeconds || 1800,
      podcast: {
        slug: ep.podcast?.slug || "podcast",
        name: ep.podcast?.name || ep.showName || "",
        cover: ep.podcast?.cover || ep.cover || "/images/default-cover.jpg",
      },
      mediaSources: ep.mediaSources || [],
    };
    playEpisode(playerEp, mode);
  };

  // Handle Add to Queue
  const handleAddToQueue = (ep: any) => {
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.cover || ep.podcast?.cover || "/images/default-cover.jpg",
      durationSeconds: ep.durationSeconds || 1800,
      podcast: {
        slug: ep.podcast?.slug || "podcast",
        name: ep.podcast?.name || ep.showName || "",
        cover: ep.podcast?.cover || ep.cover || "/images/default-cover.jpg",
      },
      mediaSources: ep.mediaSources || [],
    };
    addToQueue(playerEp);
    showToast("Épisode ajouté à la file d'attente");
    setActiveMenuEpisodeId(null);
  };

  // Handle Save / Unsave Episode
  const handleToggleSave = async (ep: any) => {
    if (!isAuthenticated) {
      showToast("Veuillez vous connecter pour enregistrer cet épisode");
      return;
    }
    const isSaved = savedEpisodeIds.has(ep.id);
    const newSet = new Set(savedEpisodeIds);
    if (isSaved) {
      newSet.delete(ep.id);
      setSavedEpisodeIds(newSet);
      showToast("Retiré des enregistrements");
      await fetchApi(`/episodes/${ep.id}/save`, { method: "DELETE" }).catch(() => {});
    } else {
      newSet.add(ep.id);
      setSavedEpisodeIds(newSet);
      showToast("Épisode enregistré dans votre bibliothèque");
      await fetchApi(`/episodes/${ep.id}/save`, { method: "POST" }).catch(() => {});
    }
    setActiveMenuEpisodeId(null);
  };

  useEffect(() => {
    if (isAuthenticated && !likesLoaded) {
      loadLikes();
    }
  }, [isAuthenticated, likesLoaded, loadLikes]);

  const handleToggleLike = async (episodeId: string) => {
    if (!isAuthenticated) {
      showToast("Veuillez vous connecter pour aimer cet épisode");
      return;
    }
    try {
      const nowLiked = await toggleLike(episodeId);
      showToast(nowLiked ? "Épisode ajouté à vos favoris" : "Épisode retiré de vos favoris");
    } catch {
      showToast("Erreur lors de la mise à jour des favoris");
    }
    setActiveMenuEpisodeId(null);
  };

  // Handle Share Episode
  const handleShareEpisode = (ep: any) => {
    const url = `${window.location.origin}/podcasts/${ep.podcast?.slug || "podcast"}/episodes/${ep.slug || ep.id}`;
    if (navigator.share) {
      navigator.share({ title: ep.title, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      showToast("Lien de l'épisode copié dans le presse-papier !");
    }
    setActiveMenuEpisodeId(null);
  };

  // Close menus on outside click
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuEpisodeId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter counters and labels
  const taxonomies = exploreTaxonomies?.data || exploreTaxonomies;
  const categoriesList = taxonomies?.categories || [];
  const languagesList = taxonomies?.languages || [];
  const countriesList = taxonomies?.countries || [];

  const activeFiltersCount = [
    selectedLang !== "",
    selectedCat !== "",
    selectedCountry !== "",
    formatFilter !== "ALL",
    selectedDuration !== "ALL",
    sortOrder !== "recent",
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSelectedLang("");
    setSelectedCat("");
    setSelectedCountry("");
    setFormatFilter("ALL");
    setSelectedDuration("ALL");
    setSortOrder("recent");
    setSearchInput("");
  };

  // Pagination totals
  const totalEpisodes = (episodesResponse as any)?.meta?.total ?? (Array.isArray(episodesResponse?.data) ? episodesResponse.data.length : loadedEpisodes.length);
  const hasMoreEpisodes = (episodesResponse as any)?.meta?.hasMore ?? false;

  const totalPodcasts = (podcastsResponse as any)?.meta?.pagination?.total ?? (podcastsResponse as any)?.pagination?.total ?? (Array.isArray(podcastsResponse?.data) ? podcastsResponse.data.length : loadedPodcasts.length);
  const hasMorePodcasts = (podcastsResponse as any)?.meta?.pagination?.hasMore ?? (podcastsResponse as any)?.pagination?.hasMore ?? false;

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    if (activeView === "episodes") {
      setEpisodeOffset((prev) => prev + 24);
    } else {
      setPodcastOffset((prev) => prev + 20);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-7 animate-fade-in text-white select-none pb-36">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-[90] px-4 py-2.5 rounded-xl bg-[#1E1E1E] border border-[#333333] text-white text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-[#FFBF00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. EN-TÊTE */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-black text-white tracking-tight">
              Explorer
            </h1>
            <p className="text-xs sm:text-sm text-[#A0A0A0] mt-1 font-medium">
              Trouvez votre prochaine écoute.
            </p>
          </div>

          {/* Annoncer sur Bamako Podcast - Discrete Header Link */}
          <button
            onClick={() => setIsInquiryModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#262626] hover:border-[#FFBF00]/60 text-[#A0A0A0] hover:text-white text-xs font-semibold transition-colors self-start md:self-auto"
          >
            <Building2 className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Annoncer sur Bamako Podcast</span>
          </button>
        </div>

        {/* Barre de Recherche Principale */}
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-3 bg-[#141414] border border-[#242424] rounded-2xl px-4 py-3 focus-within:border-[#FFBF00] transition-colors shadow-sm">
            <Search className="w-5 h-5 text-[#666666] shrink-0" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher une émission ou un épisode…"
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#666666] outline-none"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="p-1 rounded-full text-[#757575] hover:text-white transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Switcher Vues Principales: Épisodes / Émissions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setActiveView("episodes")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === "episodes"
                ? "bg-[#FFBF00] text-[#0B0B0B] shadow-sm"
                : "bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#242424]"
            }`}
          >
            Épisodes
          </button>
          <button
            onClick={() => setActiveView("podcasts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === "podcasts"
                ? "bg-[#FFBF00] text-[#0B0B0B] shadow-sm"
                : "bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#242424]"
            }`}
          >
            Émissions
          </button>
        </div>
      </div>

      {/* 2. BARRE DE DÉCOUVERTE STICKY */}
      <div className="sticky top-0 z-30 bg-[#0B0B0B]/95 backdrop-blur-md py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 border-b border-[#1C1C1C] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Format Toggle (Tout / Audio / Vidéo) */}
          {activeView === "episodes" && (
            <div className="flex items-center p-1 rounded-xl bg-[#141414] border border-[#222222]">
              <button
                onClick={() => setFormatFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  formatFilter === "ALL"
                    ? "bg-[#242424] text-white"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                Tout
              </button>
              <button
                onClick={() => setFormatFilter("AUDIO")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  formatFilter === "AUDIO"
                    ? "bg-[#242424] text-white"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                <Headphones className="w-3.5 h-3.5 text-[#FFBF00]" />
                Audio
              </button>
              <button
                onClick={() => setFormatFilter("VIDEO")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  formatFilter === "VIDEO"
                    ? "bg-[#242424] text-white"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-[#FFBF00]" />
                Vidéo
              </button>
            </div>
          )}

          {/* Tri + Bouton Filtres */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Tri Selector */}
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="appearance-none bg-[#141414] border border-[#242424] hover:border-[#383838] text-white text-xs font-bold rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer"
              >
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="popular">Plus populaires</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Bouton Filtres Drawer/Sheet */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                activeFiltersCount > 0
                  ? "bg-[#FFBF00]/10 text-[#FFBF00] border-[#FFBF00]/30"
                  : "bg-[#141414] text-[#A0A0A0] hover:text-white border-[#242424]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Compteur de résultats & Pastilles de filtres actifs */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#888888] font-medium">
              {activeView === "episodes"
                ? `${totalEpisodes.toLocaleString()} épisode${totalEpisodes > 1 ? "s" : ""}`
                : `${totalPodcasts.toLocaleString()} émission${totalPodcasts > 1 ? "s" : ""}`}
            </span>

            {/* Pastille Catégorie */}
            {selectedCat && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>Catégorie: {categoriesList.find((c: any) => c.slug === selectedCat)?.name || selectedCat}</span>
                <button onClick={() => setSelectedCat("")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {/* Pastille Langue */}
            {selectedLang && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>Langue: {languagesList.find((l: any) => l.code === selectedLang)?.name || selectedLang}</span>
                <button onClick={() => setSelectedLang("")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {/* Pastille Pays */}
            {selectedCountry && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>Pays: {countriesList.find((c: any) => c.code === selectedCountry)?.name || selectedCountry}</span>
                <button onClick={() => setSelectedCountry("")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {/* Pastille Durée */}
            {selectedDuration !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>
                  Durée: {selectedDuration === "SHORT" ? "< 15 min" : selectedDuration === "MEDIUM" ? "15-45 min" : "> 45 min"}
                </span>
                <button onClick={() => setSelectedDuration("ALL")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {/* Pastille Format */}
            {formatFilter !== "ALL" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>Format: {formatFilter === "AUDIO" ? "Audio uniquement" : "Vidéo"}</span>
                <button onClick={() => setFormatFilter("ALL")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {/* Pastille Tri */}
            {sortOrder !== "recent" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-white text-[11px] font-medium">
                <span>Tri: {sortOrder === "popular" ? "Populaires" : "Plus anciens d'abord"}</span>
                <button onClick={() => setSortOrder("recent")} className="text-[#757575] hover:text-white">✕</button>
              </span>
            )}

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-semibold text-[#FFBF00] hover:underline ml-1"
              >
                Tout réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Raccourcis Thématiques Visuels (quand aucune recherche n'est saisie) */}
      {!debouncedQ && categoriesList.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#888888] block">
            Filtres rapides par thématique
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categoriesList.slice(0, 8).map((cat: any) => {
              const isSelected = selectedCat === cat.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(isSelected ? "" : cat.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isSelected
                      ? "bg-[#FFBF00] text-[#0B0B0B] font-bold"
                      : "bg-[#141414] text-[#A0A0A0] hover:text-white border border-[#222222]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CATALOGUE PRINCIPAL */}

      {/* VUE 1: ÉPISODES */}
      {activeView === "episodes" && (
        <div className="space-y-6">
          {isEpisodesInitialLoading && episodeOffset === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#141414] border border-[#202020] animate-pulse flex gap-4 h-28">
                  <div className="w-24 h-24 rounded-xl bg-[#222222] shrink-0" />
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-4 bg-[#222222] rounded w-3/4" />
                    <div className="h-3 bg-[#222222] rounded w-1/2" />
                    <div className="h-3 bg-[#222222] rounded w-1/4 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : episodesError ? (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-3">
              <p className="text-sm font-semibold text-white">Impossible de charger les épisodes</p>
              <button
                onClick={() => mutateEpisodes()}
                className="px-4 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs"
              >
                Réessayer
              </button>
            </div>
          ) : loadedEpisodes.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-3">
              <Radio className="w-12 h-12 text-[#444444] mx-auto" />
              <p className="text-base font-bold text-white">Aucun épisode trouvé</p>
              <p className="text-xs text-[#757575] max-w-sm mx-auto">
                Aucun contenu ne correspond à vos filtres actuels. Modifiez ou réinitialisez vos critères de recherche.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-[#222222] text-[#FFBF00] font-bold text-xs border border-[#333333] hover:border-[#FFBF00] transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Episodes List with Editorial/Ad Insertions every 12 items */}
              {Array.from({ length: Math.ceil(loadedEpisodes.length / 12) }).map((_, chunkIndex) => {
                const chunk = loadedEpisodes.slice(chunkIndex * 12, (chunkIndex + 1) * 12);
                const adForSlot = activeAds && activeAds.length > chunkIndex ? activeAds[chunkIndex] : activeAds?.[0];

                return (
                  <React.Fragment key={`chunk-${chunkIndex}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {chunk.map((ep) => {
                        const isSaved = savedEpisodeIds.has(ep.id);
                        const durationText = formatDuration(ep.durationSeconds);
                        const dateText = formatDate(ep.publishedAt);
                        const isMenuOpen = activeMenuEpisodeId === ep.id;

                        return (
                          <div
                            key={ep.id}
                            className="group relative p-3.5 sm:p-4 rounded-2xl bg-[#141414] border border-[#202020] hover:border-[#303030] transition-all flex items-start gap-4"
                          >
                            {/* Pochette avec bouton Play Overlay */}
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#1A1A1A] border border-[#262626]">
                              <Image
                                unoptimized
                                src={ep.cover || ep.podcast?.cover || "/images/default-cover.jpg"}
                                alt={ep.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <button
                                onClick={() => handlePlayEpisode(ep)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Lancer la lecture"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </button>
                            </div>

                            {/* Informations de l'épisode */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Badges Format & Podcast */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {ep.videoAvailable && ep.audioAvailable ? (
                                  <span className="px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[10px] font-bold flex items-center gap-1">
                                    <Video className="w-3 h-3 text-[#FFBF00]" /> Audio + Vidéo
                                  </span>
                                ) : ep.videoAvailable ? (
                                  <span className="px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[10px] font-bold flex items-center gap-1">
                                    <Video className="w-3 h-3 text-[#FFBF00]" /> Vidéo
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[10px] font-bold flex items-center gap-1">
                                    <Headphones className="w-3 h-3 text-[#FFBF00]" /> Audio
                                  </span>
                                )}

                                <Link
                                  href={`/podcasts/${ep.podcast?.slug || ""}`}
                                  className="text-[11px] font-semibold text-[#888888] hover:text-[#FFBF00] transition-colors truncate max-w-[150px]"
                                >
                                  {ep.podcast?.name}
                                </Link>
                              </div>

                              {/* Titre */}
                              <Link
                                href={`/podcasts/${ep.podcast?.slug || "podcast"}/episodes/${ep.slug || ep.id}`}
                                className="block"
                              >
                                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors line-clamp-2 leading-snug">
                                  {ep.title}
                                </h3>
                              </Link>

                              {/* Métadonnées : Durée & Date */}
                              <div className="flex items-center gap-3 text-[11px] text-[#757575] font-medium pt-0.5">
                                {durationText && <span>{durationText}</span>}
                                {dateText && <span>• {dateText}</span>}
                                {ep.language?.name && <span>• {ep.language.name}</span>}
                              </div>

                              {/* Actions rapides */}
                              <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleLike(ep.id)}
                                    className={`p-2 rounded-xl transition-colors ${
                                      isLiked(ep.id)
                                        ? "text-[#FFBF00] bg-[#FFBF00]/10"
                                        : "text-[#757575] hover:text-[#FFBF00] hover:bg-[#202020]"
                                    }`}
                                    title={isLiked(ep.id) ? "Retirer des favoris" : "Aimer cet épisode"}
                                  >
                                    <Heart className={`w-3.5 h-3.5 ${isLiked(ep.id) ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
                                  </button>

                                  <button
                                    onClick={() => handlePlayEpisode(ep, "AUDIO")}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#FFBF00] text-white hover:text-[#0B0B0B] text-xs font-bold transition-colors"
                                  >
                                    <Play className="w-3 h-3 fill-current" />
                                    <span>Écouter</span>
                                  </button>

                                  {ep.videoAvailable && (
                                    <button
                                      onClick={() => handlePlayEpisode(ep, "VIDEO")}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-white text-white hover:text-[#0B0B0B] text-xs font-bold transition-colors"
                                    >
                                      <Video className="w-3 h-3" />
                                      <span>Regarder</span>
                                    </button>
                                  )}
                                </div>

                                {/* Menu 3-Points Actions */}
                                <div className="relative" ref={isMenuOpen ? menuRef : null}>
                                  <button
                                    onClick={() => setActiveMenuEpisodeId(isMenuOpen ? null : ep.id)}
                                    className="p-1.5 rounded-lg text-[#757575] hover:text-white hover:bg-[#202020] transition-colors"
                                    title="Options"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {isMenuOpen && (
                                    <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl shadow-2xl p-1.5 z-40 space-y-1 animate-fade-in text-xs">
                                      <button
                                        onClick={() => handleToggleLike(ep.id)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D0D0D0] hover:bg-[#262626] hover:text-white transition-colors"
                                      >
                                        <Heart className={`w-4 h-4 ${isLiked(ep.id) ? "fill-[#FFBF00] text-[#FFBF00]" : "text-[#888]"}`} />
                                        <span>{isLiked(ep.id) ? "Ne plus aimer" : "Aimer cet épisode"}</span>
                                      </button>

                                      <button
                                        onClick={() => handleToggleSave(ep)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D0D0D0] hover:bg-[#262626] hover:text-white transition-colors"
                                      >
                                        {isSaved ? (
                                          <>
                                            <BookmarkCheck className="w-4 h-4 text-[#FFBF00]" />
                                            <span>Retirer des enregistrés</span>
                                          </>
                                        ) : (
                                          <>
                                            <Bookmark className="w-4 h-4" />
                                            <span>Enregistrer l'épisode</span>
                                          </>
                                        )}
                                      </button>

                                      <button
                                        onClick={() => handleAddToQueue(ep)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D0D0D0] hover:bg-[#262626] hover:text-white transition-colors"
                                      >
                                        <ListPlus className="w-4 h-4" />
                                        <span>Ajouter à la file d'attente</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          setPlaylistEpisodeId(ep.id);
                                          setActiveMenuEpisodeId(null);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D0D0D0] hover:bg-[#262626] hover:text-white transition-colors"
                                      >
                                        <Radio className="w-4 h-4" />
                                        <span>Ajouter à une playlist</span>
                                      </button>

                                      <button
                                        onClick={() => handleShareEpisode(ep)}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[#D0D0D0] hover:bg-[#262626] hover:text-white transition-colors"
                                      >
                                        <Share2 className="w-4 h-4" />
                                        <span>Partager le lien</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 4. RYTHME ÉDITORIAL & BANNIÈRES SPONSORISÉES (entre 2 groupes) */}
                    {!debouncedQ && (
                      <div className="py-2">
                        {chunkIndex === 0 ? (
                          adForSlot ? (
                            <AdBannerSlot
                              ad={adForSlot}
                              onOpenInquiry={() => setIsInquiryModalOpen(true)}
                            />
                          ) : (
                            <CreatorCalloutSlot />
                          )
                        ) : chunkIndex === 1 ? (
                          <PromoteCalloutSlot onOpenInquiry={() => setIsInquiryModalOpen(true)} />
                        ) : (
                          adForSlot && (
                            <AdBannerSlot
                              ad={adForSlot}
                              onOpenInquiry={() => setIsInquiryModalOpen(true)}
                            />
                          )
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Bouton Charger Davantage */}
              {hasMoreEpisodes && (
                <div className="text-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-white border border-[#303030] font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FFBF00]" />
                        <span>Chargement des épisodes...</span>
                      </>
                    ) : (
                      <span>Charger davantage d'épisodes</span>
                    )}
                  </button>
                </div>
              )}

              {!hasMoreEpisodes && loadedEpisodes.length > 0 && (
                <p className="text-center text-xs text-[#666666] pt-6 font-medium">
                  Vous avez parcouru tous les épisodes disponibles.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* VUE 2: ÉMISSIONS (PODCASTS) */}
      {activeView === "podcasts" && (
        <div className="space-y-6">
          {isPodcastsInitialLoading && podcastOffset === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="p-3 rounded-2xl bg-[#141414] border border-[#202020] animate-pulse space-y-3">
                  <div className="aspect-square rounded-xl bg-[#222222]" />
                  <div className="h-4 bg-[#222222] rounded w-3/4" />
                  <div className="h-3 bg-[#222222] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : podcastsError ? (
            <div className="p-12 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-3">
              <p className="text-sm font-semibold text-white">Impossible de charger les émissions</p>
            </div>
          ) : loadedPodcasts.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-3">
              <Radio className="w-12 h-12 text-[#444444] mx-auto" />
              <p className="text-base font-bold text-white">Aucune émission trouvée</p>
              <button
                onClick={resetAllFilters}
                className="px-4 py-2 rounded-xl bg-[#222222] text-[#FFBF00] font-bold text-xs border border-[#333333] hover:border-[#FFBF00] transition-colors"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {loadedPodcasts.map((podcast) => {
                  const episodesCount = podcast._count?.episodes ?? 0;
                  const categoryName = podcast.categories?.[0]?.category?.name;

                  return (
                    <div
                      key={podcast.id}
                      className="group p-3 rounded-2xl bg-[#141414] border border-[#202020] hover:border-[#383838] transition-all flex flex-col justify-between"
                    >
                      <Link href={`/podcasts/${podcast.slug}`} className="block space-y-3">
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#262626]">
                          <Image
                            unoptimized
                            src={podcast.cover || "/images/default-cover.jpg"}
                            alt={podcast.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FFBF00] transition-colors truncate">
                            {podcast.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#757575] truncate">
                            {categoryName && <span>{categoryName}</span>}
                            {categoryName && <span>•</span>}
                            <span>{episodesCount} ép.</span>
                          </div>
                        </div>
                      </Link>

                      <div className="pt-3 border-t border-[#1C1C1C] mt-2">
                        <Link
                          href={`/podcasts/${podcast.slug}`}
                          className="w-full py-1.5 rounded-lg bg-[#1C1C1C] hover:bg-[#FFBF00] text-white hover:text-[#0B0B0B] text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Découvrir</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMorePodcasts && (
                <div className="text-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E1E1E] hover:bg-[#282828] text-white border border-[#303030] font-bold text-xs transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? "Chargement..." : "Charger davantage d'émissions"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FILTER DRAWER / SHEET */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#141414] border-l border-[#242424] h-full p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#FFBF00]" />
                  <h3 className="text-base font-bold text-white">Filtres du catalogue</h3>
                </div>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-1.5 text-[#757575] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                  Catégorie
                </label>
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FFBF00]"
                >
                  <option value="">Toutes les catégories</option>
                  {categoriesList.map((c: any) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Langue */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                  Langue
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FFBF00]"
                >
                  <option value="">Toutes les langues</option>
                  {languagesList.map((l: any) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pays d'origine */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                  Pays
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-[#FFBF00]"
                >
                  <option value="">Tous les pays</option>
                  {countriesList.map((cty: any) => (
                    <option key={cty.id} value={cty.code || cty.id}>
                      {cty.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durée (pour épisodes) */}
              {activeView === "episodes" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                    Durée de l'épisode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "ALL", label: "Toutes" },
                      { key: "SHORT", label: "< 15 min" },
                      { key: "MEDIUM", label: "15-45 min" },
                      { key: "LONG", label: "> 45 min" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setSelectedDuration(item.key as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-colors ${
                          selectedDuration === item.key
                            ? "bg-[#FFBF00] text-[#0B0B0B]"
                            : "bg-[#1A1A1A] text-[#888888] hover:text-white border border-[#262626]"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-[#222222] flex items-center gap-3">
              <button
                onClick={resetAllFilters}
                className="w-1/2 py-2.5 rounded-xl bg-[#1E1E1E] text-[#A0A0A0] hover:text-white text-xs font-bold transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="w-1/2 py-2.5 rounded-xl bg-[#FFBF00] text-[#0B0B0B] text-xs font-bold hover:bg-[#e6ac00] transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUT À UNE PLAYLIST */}
      <AddToPlaylistModal
        episodeId={playlistEpisodeId}
        isOpen={!!playlistEpisodeId}
        onClose={() => setPlaylistEpisodeId(null)}
      />

      {/* MODAL ANNONCEUR / CONTACT COMMERCIAL */}
      <AdvertiserInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575] text-xs">Chargement du catalogue...</div>}>
      <ExploreMain />
    </Suspense>
  );
}
