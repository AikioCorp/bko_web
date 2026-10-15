"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { HeroBanner } from "@/components/home/HeroBanner";
import { AppDownloadModal } from "@/components/modals/AppDownloadModal";
import { DiscoveryPromotionModal } from "@/components/discovery/DiscoveryPromotionModal";
import { TrackedCard } from "@/components/home/TrackedCard";
import { recordRecommendationInteraction } from "@/lib/playTracking";
import { formatPodcastSubtitle, decodeHtmlEntities } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Play,
  Pause,
  Bookmark,
  Share2,
  Clock,
  Download,
  ListPlus,
  Mic,
  Info,
  Briefcase,
  Users,
  Globe,
  Cpu,
  BookOpen,
  Music,
  Newspaper,
  TrendingUp,
  Radio,
  Smartphone,
  ChevronRight,
  SlidersHorizontal,
  ChevronLeft,
  Headphones,
  Sparkles,
  EyeOff,
  ThumbsDown,
  MoreVertical,
  Heart,
  Check,
} from "lucide-react";
import { useLikesStore } from "@/store/likesStore";

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-12 pb-32 bg-[#0B0B0B] min-h-screen">
      <div className="h-[60vh] bg-[#141414] w-full" />
      <div className="px-4 md:px-12 space-y-8">
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-4">
            <div className="h-6 bg-[#2A2A2A] rounded w-48 mb-4"></div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="min-w-[280px] h-[160px] bg-[#1A1A1A] rounded-xl"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContinueListeningShelf({
  sec,
  handlePlay,
  currentEpisode,
  isPlaying,
}: {
  sec: any;
  handlePlay: (ep: any, attribution?: any) => void;
  currentEpisode: any;
  isPlaying: boolean;
}) {
  const shelfRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (shelfRef.current) {
      const scrollAmount = Math.max(300, Math.floor(shelfRef.current.clientWidth * 0.75));
      shelfRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-[#242424] pb-3">
        <div>
          <Link
            href="/discovery/sections/continue-listening"
            className="group flex items-center gap-2"
          >
            <Clock className="w-5 h-5 text-[#FFBF00]" />
            <h2 className="text-xl md:text-2xl font-black text-white group-hover:text-[#FFBF00] transition-colors tracking-tight">
              {sec.title}
            </h2>
            <ChevronRight className="w-4 h-4 text-[#757575] group-hover:text-[#FFBF00] group-hover:translate-x-0.5 transition-all" />
          </Link>
          {sec.subtitle && (
            <p className="text-xs text-[#808080] mt-0.5">{sec.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Faire défiler vers la gauche"
              className="w-8 h-8 rounded-full border border-[#242424] bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#FFBF00]/50 hover:text-white flex items-center justify-center text-[#888888] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Faire défiler vers la droite"
              className="w-8 h-8 rounded-full border border-[#242424] bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#FFBF00]/50 hover:text-white flex items-center justify-center text-[#888888] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link
            href="/discovery/sections/continue-listening"
            className="text-xs font-bold text-[#808080] hover:text-[#FFBF00] transition-colors"
          >
            Historique complet
          </Link>
        </div>
      </div>

      <div
        ref={shelfRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x scroll-smooth"
      >
        {sec.items.map((item: any) => {
          const ep = item.episode || item;
          const pos = ep.positionSeconds || item.positionSeconds || 0;
          const duration = ep.durationSeconds || item.durationSeconds || 1800;
          const progressPercent = Math.min(100, Math.max(0, (pos / duration) * 100));
          const restMins = Math.max(0, Math.floor((duration - pos) / 60));

          return (
            <div
              key={ep.id}
              onClick={() => handlePlay(ep, item.attribution)}
              className="snap-start shrink-0 w-[280px] sm:w-[320px] bg-[#141414] hover:bg-[#1E1E1E] rounded-xl p-3 border border-[#242424] hover:border-[#333333] cursor-pointer transition-colors group relative"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#0B0B0B] relative">
                  <img
                    src={
                      ep.cover ||
                      ep.podcast?.cover ||
                      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"
                    }
                    alt={ep.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {currentEpisode?.id === ep.id && isPlaying ? (
                      <Pause className="w-6 h-6 text-[#FFBF00] fill-current" />
                    ) : (
                      <Play className="w-6 h-6 text-white fill-current ml-0.5" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  {ep.podcast?.slug ? (
                    <Link
                      href={`/podcasts/${ep.podcast.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] font-bold text-[#FFBF00] hover:underline uppercase tracking-wider line-clamp-1 block transition-colors"
                    >
                      {ep.podcast?.title || ep.podcast?.name || "Émission"}
                    </Link>
                  ) : (
                    <p className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider line-clamp-1">
                      {ep.podcast?.title || ep.podcast?.name || "Émission"}
                    </p>
                  )}
                  <h4 className="text-sm font-bold text-white line-clamp-1 group-hover:text-[#FFBF00] transition-colors">
                    {decodeHtmlEntities(ep.title)}
                  </h4>
                  <p className="text-xs text-[#808080] mt-0.5">
                    {restMins > 0 ? `Il reste ${restMins} min` : "Terminé"}
                  </p>
                </div>
              </div>
              <div className="w-full bg-[#242424] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#FFBF00] h-full rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PodcastShelfRow({ sec }: { sec: any }) {
  const shelfRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: "left" | "right") => {
    if (shelfRef.current) {
      const scrollAmount = Math.max(300, Math.floor(shelfRef.current.clientWidth * 0.75));
      shelfRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const destinationUrl =
    sec.discoveryContext?.targetUrl?.startsWith("/discovery")
      ? sec.discoveryContext.targetUrl
      : `/discovery/sections/${sec.slug || sec.id}`;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#242424] pb-4">
        <div>
          <Link
            href={destinationUrl}
            className="group flex items-center gap-2 mb-1"
          >
            <Radio className="w-4 h-4 text-[#FFBF00]" />
            <h2 className="text-2xl md:text-3xl font-black text-white group-hover:text-[#FFBF00] transition-colors tracking-tight">
              {sec.title}
            </h2>
            <ChevronRight className="w-4 h-4 text-[#757575] group-hover:text-[#FFBF00] group-hover:translate-x-0.5 transition-all" />
          </Link>
          {sec.subtitle && (
            <p className="text-sm text-[#B8B8B8] max-w-2xl">{sec.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll("left")}
              aria-label="Faire défiler vers la gauche"
              className="w-8 h-8 rounded-full border border-[#242424] bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#FFBF00]/50 hover:text-white flex items-center justify-center text-[#888888] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Faire défiler vers la droite"
              className="w-8 h-8 rounded-full border border-[#242424] bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#FFBF00]/50 hover:text-white flex items-center justify-center text-[#888888] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <Link
            href={destinationUrl}
            className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#FFBF00]/40 text-xs font-bold text-[#D4D4D4] hover:text-[#FFBF00] transition-colors shrink-0"
          >
            <span>Découvrir davantage</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#FFBF00] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div
        ref={shelfRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x scroll-smooth"
      >
        {sec.items.map((item: any) => {
          const pod = item.podcast || item.collection || item;
          const isCollection = !!item.collection;
          const targetUrl = isCollection
            ? `/discovery/sections/${pod.slug || pod.id}`
            : `/podcasts/${pod.slug || pod.id}`;
          const epCount =
            pod._count?.episodes ?? pod.episodesCount ?? pod.episodes?.length ?? (isCollection ? (pod._count?.items ?? 0) : 0);
          return (
            <TrackedCard
              key={item.id || pod.id}
              batchId={item.attribution?.batchId}
              sectionId={sec.id}
              sectionSlug={sec.slug}
              targetType={isCollection ? ("COLLECTION" as any) : "PODCAST"}
              targetId={pod.id}
              position={item.position ?? 0}
              reason={item.reason}
              className="snap-start shrink-0 w-[180px] sm:w-[210px] bg-[#141414] hover:bg-[#1A1A1A] rounded-2xl p-3 border border-[#242424] hover:border-[#383838] transition-colors group cursor-pointer"
            >
              <Link href={targetUrl} className="block">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#0B0B0B] relative mb-3">
                  <img
                    src={
                      pod.cover ||
                      pod.imageUrl ||
                      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=300&auto=format&fit=crop"
                    }
                    alt={pod.title || pod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#FFBF00] transition-colors truncate">
                  {pod.title || pod.name}
                </h3>
                {formatPodcastSubtitle(pod) && (
                  <p className="text-xs text-[#808080] truncate mt-0.5">
                    {formatPodcastSubtitle(pod)}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-[#707070]">
                  <span>{epCount} épisodes</span>
                  {pod.language && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{pod.language}</span>
                    </>
                  )}
                </div>
              </Link>
            </TrackedCard>
          );
        })}
      </div>
    </section>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const langFilter = searchParams.get("lang") || "ALL";
  const { user, isAuthenticated } = useAuthStore();
  const { playEpisode, currentEpisode, isPlaying, addToQueue, togglePlay } =
    usePlayerStore();
  const { isLiked, toggleLike, loadLikes, isLoaded: likesLoaded } = useLikesStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !likesLoaded) {
      loadLikes();
    }
  }, [isAuthenticated, likesLoaded, loadLikes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
  };

  const handleAddToQueue = (ep: any) => {
    addToQueue(ep);
    showToast("Épisode ajouté à la file d'attente");
  };

  const handlePlay = (ep: any, attribution?: any) => {
    if (currentEpisode?.id === ep.id) {
      togglePlay();
    } else {
      const episodeWithAttribution = attribution ? { ...ep, attribution } : ep;
      playEpisode(episodeWithAttribution);
      if (attribution?.batchId) {
        recordRecommendationInteraction(
          attribution.batchId,
          attribution.sectionId || "section",
          attribution.sectionSlug || "unknown",
          "EPISODE",
          ep.id,
          "PLAY_START"
        );
      }
    }
  };
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Infinite scroll feed state
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | null>(null);
  const [feedHasMore, setFeedHasMore] = useState<boolean>(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const fetcher = (url: string) => fetchApi(url).then((json) => json.data);
  const { data: historyData } = useSWR(
    user ? '/me/continue-listening' : null,
    fetcher,
  );
  // Clé SWR strictement isolée par identité et catégorie pour interdire toute fuite inter-comptes
  const { data, isLoading, mutate: mutateHome } = useSWR(
    [`${API_BASE_URL}/home?country=all&category=${selectedCategory}`, user?.id || 'anon'],
    () => fetcher(`/home?country=all&category=${selectedCategory}`)
  );
  const { data: catData } = useSWR(`${API_BASE_URL}/categories`, fetcher);

  // Synchronisation du flux initial avec les données reçues
  useEffect(() => {
    if (data?.feed) {
      setFeedItems(data.feed.items || []);
      setFeedCursor(data.feed.nextCursor || null);
      setFeedHasMore(data.feed.hasMore ?? false);
    }
  }, [data]);

  // Chargement de la page suivante du flux (Infinite Scroll)
  const loadMoreFeed = async () => {
    if (isLoadingFeed || !feedHasMore || !feedCursor) return;
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetcher(
        `/home/feed?country=all&category=${selectedCategory}&cursor=${feedCursor}&limit=12`
      );
      if (res?.items) {
        setFeedItems((prev) => {
          const seen = new Set(prev.map((it: any) => it.episode?.id || it.id));
          const newOnes = res.items.filter((it: any) => !seen.has(it.episode?.id || it.id));
          return [...prev, ...newOnes];
        });
        setFeedCursor(res.nextCursor || null);
        setFeedHasMore(res.hasMore ?? false);
      }
    } catch (err: any) {
      setFeedError("Impossible de charger la suite du catalogue");
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Détection du scroll proche du bas
  useEffect(() => {
    if (!observerRef.current || !feedHasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingFeed && feedHasMore && feedCursor) {
          loadMoreFeed();
        }
      },
      { rootMargin: "350px" }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [observerRef.current, isLoadingFeed, feedHasMore, feedCursor, selectedCategory]);

  const handleFeedback = async (
    targetType: "EPISODE" | "PODCAST",
    targetId: string,
    action: "NOT_INTERESTED" | "HIDE_PODCAST"
  ) => {
    try {
      await fetchApi("/recommendations/feedback", {
        method: "POST",
        body: JSON.stringify({ targetType, targetId, action }),
      });
      // Invalider l'accueil pour recalculer immédiatement les suggestions
      mutateHome();
    } catch (_) {}
  };

  if (isLoading || !data) return <HomeSkeleton />;

  const { heroEpisode, trending } = data;
  const latestEpisodes = (data.latestEpisodes || []).filter(
    (ep: any) =>
      langFilter === "ALL" ||
      ep.language?.code === langFilter ||
      ep.podcast?.primaryLanguage?.code === langFilter,
  );
  const categoriesList = catData || [];

  const heroSlides =
    data.heroSlides && data.heroSlides.length > 0
      ? data.heroSlides
      : [heroEpisode, ...(latestEpisodes || [])]
          .filter(Boolean)
          .map((episode: any) => ({
            kind: "new",
            label: "Nouveauté",
            episode,
          }));

  // Personnalisation
  const userName =
    (user as any)?.firstName ||
    (user as any)?.name ||
    (user as any)?.username ||
    "";
  const isPersonalized = !!user;

  // Grouper les podcasts pour les "Shelves"
  const groupedByCategory: Record<string, any[]> = {};
  if (trending) {
    trending.forEach((podcast: any) => {
      const catName = podcast.categories?.[0]?.category?.name || "Général";
      if (!groupedByCategory[catName]) groupedByCategory[catName] = [];
      groupedByCategory[catName].push(podcast);
    });
  }
  const resumeItems =
    user && historyData?.length > 0
      ? historyData.map((h: any) => ({
          ...h.episode,
          positionSeconds: h.positionSeconds,
          completed: h.completed,
        }))
      : [];

  const categoryEntries = data.categoryShelves
    ? data.categoryShelves
        .map((shelf: any) => [
            shelf.name,
            shelf.podcasts.filter(
            (p: any) =>
              langFilter === "ALL" ||
              p.primaryLanguage?.code === langFilter ||
              p.language?.code === langFilter,
            ),
            shelf.slug
          ])
          .filter((entry: any) => entry[1].length > 0)
    : Object.entries(groupedByCategory)
        .map((entry: any) => [
          entry[0],
          entry[1].filter(
            (p: any) =>
              langFilter === "ALL" ||
              p.primaryLanguage?.code === langFilter ||
              p.language?.code === langFilter,
            ),
            entry[1][0]?.categories?.[0]?.category?.slug
          ])
          .filter((entry: any) => entry[1].length > 0)
        .sort((a, b) => b[1].length - a[1].length);

  const filteredEpisodes =
    latestEpisodes?.filter((ep: any) => {
      if (filterMode === "ALL") return true;
      const hasAudio = ep.mediaSources?.some((s: any) => s.type === "AUDIO");
      const hasVideo = ep.mediaSources?.some((s: any) => s.type === "VIDEO");
      if (filterMode === "AUDIO") return hasAudio || !hasVideo; // Fallback
      if (filterMode === "VIDEO") return hasVideo;
      return true;
    }) || [];

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("business")) return <Briefcase className="w-4 h-4" />;
    if (n.includes("culture") || n.includes("société"))
      return <Users className="w-4 h-4" />;
    if (n.includes("diaspora")) return <Globe className="w-4 h-4" />;
    if (n.includes("tech") || n.includes("innov"))
      return <Cpu className="w-4 h-4" />;
    if (n.includes("tradition") || n.includes("histoire"))
      return <BookOpen className="w-4 h-4" />;
    if (n.includes("musique")) return <Music className="w-4 h-4" />;
    if (n.includes("actualité")) return <Newspaper className="w-4 h-4" />;
    return <Radio className="w-4 h-4" />;
  };

  return (
    <div className="pb-32 bg-[#0B0B0B] min-h-screen text-[#B8B8B8] font-sans overflow-x-hidden">
      <HeroBanner
        slides={heroSlides}
        onPlay={handlePlay}
        currentId={currentEpisode?.id}
        isPlaying={isPlaying}
      />

      {/* Main Content Container */}
      <div className="px-4 md:px-10 space-y-16 pt-10">
        {/* 2. Filtres Rapides */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#FFBF00]" />
              Filtres Rapides par Thématique
            </h2>
            <span className="text-xs font-bold text-[#808080] hidden md:inline-block">
              {categoriesList.length || 18} thématiques certifiées
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 font-extrabold px-5 py-2 rounded-full text-xs flex items-center gap-2 transition-colors ${
                selectedCategory === "all"
                  ? "bg-[#FFBF00] text-black shadow-sm"
                  : "bg-[#141414] hover:bg-[#1A1A1A] text-[#B8B8B8] hover:text-white border border-[#242424]"
              }`}
            >
              Tout explorer{" "}
              <span
                className={`px-1.5 rounded ${
                  selectedCategory === "all" ? "bg-black/20 text-black" : "bg-[#2A2A2A] text-white"
                }`}
              >
                {trending?.length || 20}
              </span>
            </button>
            {categoriesList.map((cat: any) => {
              const catKey = cat.slug || cat.id || cat.name;
              const isActive = selectedCategory === catKey || selectedCategory === cat.slug;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedCategory(isActive ? "all" : (cat.slug || cat.id))}
                  className={`shrink-0 font-bold px-5 py-2 rounded-full text-xs flex items-center gap-2 transition-colors ${
                    isActive
                      ? "bg-[#FFBF00] text-black font-extrabold border border-[#FFBF00]"
                      : "bg-[#141414] hover:bg-[#1A1A1A] text-[#B8B8B8] hover:text-white border border-[#242424]"
                  }`}
                >
                  {getCategoryIcon(cat.name)}
                  {cat.name}
                  {cat._count?.podcasts != null && (
                    <span
                      className={`px-1.5 rounded text-[10px] ${
                        isActive ? "bg-black/20 text-black font-bold" : "bg-[#2A2A2A] text-white"
                      }`}
                    >
                      {cat._count.podcasts}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. SECTIONS DYNAMIQUES DU MOTEUR DE RECOMMANDATION (OU FALLBACK ÉDITORIAL) */}
        {data.sections && data.sections.length > 0 ? (
          <div className="space-y-16">
            {data.sections.map((sec: any) => {
              if (!sec.items || sec.items.length === 0) return null;

              // A. Section Continuer l'écoute
              if (sec.slug === "continue-listening") {
                return (
                  <ContinueListeningShelf
                    key={sec.id}
                    sec={sec}
                    handlePlay={handlePlay}
                    currentEpisode={currentEpisode}
                    isPlaying={isPlaying}
                  />
                );
              }

              // B. Section Épisodes (Pour vous, Éditoriale, etc.)
              if (sec.type === "EPISODE_ROW") {
                const destinationUrl =
                  sec.discoveryContext?.targetUrl?.startsWith("/discovery")
                    ? sec.discoveryContext.targetUrl
                    : `/discovery/sections/${sec.slug || sec.id}`;

                return (
                  <section key={sec.id} className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242424] pb-4">
                      <div>
                        <Link
                          href={destinationUrl}
                          className="group inline-flex items-center gap-2 mb-1"
                        >
                          <h2 className="text-2xl md:text-3xl font-black text-white group-hover:text-[#FFBF00] transition-colors tracking-tight">
                            {sec.title}
                          </h2>
                          <ChevronRight className="w-4 h-4 text-[#757575] group-hover:text-[#FFBF00] group-hover:translate-x-0.5 transition-all" />
                        </Link>
                        {sec.subtitle && (
                          <p className="text-sm text-[#B8B8B8] max-w-2xl">{sec.subtitle}</p>
                        )}
                      </div>
                      <Link
                        href={destinationUrl}
                        className="self-start md:self-end group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#FFBF00]/40 text-xs font-bold text-[#D4D4D4] hover:text-[#FFBF00] transition-colors shrink-0"
                      >
                        <span>Découvrir davantage</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#FFBF00] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {sec.items.slice(0, 12).map((item: any) => {
                        const ep = item.episode;
                        if (!ep) return null;
                        const isCurrent = currentEpisode?.id === ep.id;

                        return (
                          <TrackedCard
                            key={item.id}
                            batchId={item.attribution?.batchId}
                            sectionId={sec.id}
                            sectionSlug={sec.slug}
                            targetType="EPISODE"
                            targetId={ep.id}
                            position={item.position}
                            reason={item.reason}
                            onClick={() => handlePlay(ep, item.attribution)}
                            className="group hover:bg-[#141414] p-3 rounded-xl flex flex-row items-center gap-4 transition-colors cursor-pointer border border-transparent hover:border-[#242424] bg-[#0E0E0E]"
                          >
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#0B0B0B] border border-[#2A2A2A]">
                              <img
                                src={ep.cover || ep.podcast?.cover || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"}
                                alt={ep.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-[#FFBF00] flex items-center justify-center shadow-lg">
                                  {isCurrent && isPlaying ? (
                                    <Pause className="w-5 h-5 text-black fill-current" />
                                  ) : (
                                    <Play className="w-5 h-5 text-black fill-current ml-1" />
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {ep.podcast?.slug ? (
                                  <Link
                                    href={`/podcasts/${ep.podcast.slug}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] md:text-xs font-bold text-[#FFBF00] hover:underline uppercase tracking-wider truncate cursor-pointer transition-colors"
                                  >
                                    {ep.podcast?.name || ep.podcast?.title}
                                  </Link>
                                ) : (
                                  <span className="text-[10px] md:text-xs font-bold text-[#FFBF00] uppercase tracking-wider truncate">
                                    {ep.podcast?.name || ep.podcast?.title}
                                  </span>
                                )}
                                {item.reason && (
                                  <span className="text-[10px] bg-[#1C1C1C] text-[#D4D4D4] px-2 py-0.5 rounded border border-[#2A2A2A] font-semibold">
                                    {item.reason}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-[#FFBF00] transition-colors">
                                {decodeHtmlEntities(ep.title)}
                              </h4>
                              <p className="text-xs text-[#808080] flex items-center gap-2 font-medium">
                                <span className="flex items-center gap-1">
                                  <Headphones className="w-3 h-3" />
                                  {Math.floor((ep.durationSeconds || 1800) / 60)} min
                                </span>
                                <span>•</span>
                                <span>
                                  {ep.publishedAt
                                    ? new Date(ep.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                                    : "Récemment"}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleLike(ep.id)}
                                className={`p-2.5 rounded-full transition-colors bg-[#1F1F1F] hover:bg-[#2A2A2A] ${
                                  isLiked(ep.id) ? "text-[#FFBF00]" : "text-[#808080] hover:text-[#FFBF00]"
                                }`}
                                title={isLiked(ep.id) ? "Retirer des favoris" : "Aimer cet épisode"}
                              >
                                <Heart className={`w-4 h-4 ${isLiked(ep.id) ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
                              </button>
                              <button
                                onClick={() => handleAddToQueue(ep)}
                                className="p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors"
                                title="Ajouter à la file d'attente"
                              >
                                <ListPlus className="w-4 h-4" />
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#141414] border-[#2A2A2A] text-white">
                                  <DropdownMenuItem
                                    onClick={() => handleFeedback("EPISODE", ep.id, "NOT_INTERESTED")}
                                    className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                                  >
                                    <ThumbsDown className="w-4 h-4 text-[#808080]" />
                                    Pas intéressé par cet épisode
                                  </DropdownMenuItem>
                                  {ep.podcast?.id && (
                                    <DropdownMenuItem
                                      onClick={() => handleFeedback("PODCAST", ep.podcast.id, "HIDE_PODCAST")}
                                      className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                                    >
                                      <EyeOff className="w-4 h-4 text-[#808080]" />
                                      Masquer cette émission
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TrackedCard>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // C. Section Podcasts ou Collections (Découverte, Éditoriale, etc.)
              if (sec.type === "PODCAST_ROW" || sec.type === "COLLECTION_ROW") {
                return <PodcastShelfRow key={sec.id} sec={sec} />;
              }

              return null;
            })}
          </div>
        ) : (
          /* FALLBACK HISTORIQUE LORSQUE SECTIONS EST ABSENT OU VIDE */
          <>
            {resumeItems && resumeItems.length > 0 && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-[#FFBF00] fill-current" />
                    Historique de lecture
                  </h2>
                  <Link
                    href="/library"
                    className="text-xs font-bold text-[#808080] hover:text-white transition-colors"
                  >
                    Voir l'historique
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
                  {resumeItems?.slice(0, 4).map((ep: any) => {
                    const duration = ep.durationSeconds || 1800;
                    const pos = ep.positionSeconds !== undefined ? ep.positionSeconds : 0;
                    const restMins = Math.max(0, Math.floor((duration - pos) / 60));
                    const percent = Math.min(100, Math.max(0, (pos / duration) * 100));

                    return (
                      <div
                        key={ep.id}
                        onClick={() => handlePlay(ep)}
                        className="snap-start shrink-0 w-[320px] bg-[#141414] hover:bg-[#1A1A1A] rounded-xl p-3 border border-[#242424] hover:border-[#333] cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#0B0B0B] relative">
                            <img
                              src={ep.cover || ep.podcast?.cover || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"}
                              alt={ep.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              {currentEpisode?.id === ep.id && isPlaying ? (
                                <Pause className="w-5 h-5 text-white fill-current" />
                              ) : (
                                <Play className="w-5 h-5 text-white fill-current" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <span className="text-[10px] font-black text-[#FFBF00] uppercase tracking-wider truncate mr-2">
                                {ep.category?.name || "ÉPISODE"}
                              </span>
                              <span className="text-[10px] font-bold text-[#808080] whitespace-nowrap">
                                Reste {restMins}m
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white truncate leading-tight">
                              {ep.title}
                            </h4>
                            <p className="text-xs text-[#808080] truncate">
                              {ep.podcast?.name}
                            </p>
                          </div>
                        </div>
                        {pos > 0 ? (
                          <div className="w-full bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#FFBF00] h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        ) : (
                          <div className="w-full bg-transparent h-1.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {latestEpisodes && latestEpisodes.length > 0 && (
              <section className="space-y-6 pt-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242424] pb-4">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">
                      Fraîchement publiés
                    </h2>
                    <p className="text-sm text-[#B8B8B8] mt-1 max-w-2xl">
                      Les derniers épisodes à écouter ou à regarder.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredEpisodes.slice(0, 8).map((ep: any) => (
                    <div
                      key={ep.id}
                      className="group hover:bg-[#141414] p-2 -mx-2 rounded-xl flex flex-row items-center gap-4 transition-colors cursor-pointer border border-transparent hover:border-[#242424]"
                      onClick={() => handlePlay(ep)}
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#0B0B0B] border border-[#2A2A2A]">
                        <img
                          src={ep.cover || ep.podcast?.cover || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"}
                          alt={ep.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-[#FFBF00] flex items-center justify-center shadow-lg">
                            {currentEpisode?.id === ep.id && isPlaying ? (
                              <Pause className="w-5 h-5 text-black fill-current" />
                            ) : (
                              <Play className="w-5 h-5 text-black fill-current ml-1" />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        {ep.podcast?.slug ? (
                          <Link
                            href={`/podcasts/${ep.podcast.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] md:text-xs font-bold text-[#FFBF00] hover:underline uppercase tracking-wider truncate mb-1 block cursor-pointer transition-colors"
                          >
                            {ep.podcast?.name || ep.podcast?.title}
                          </Link>
                        ) : (
                          <p className="text-[10px] md:text-xs font-bold text-[#FFBF00] uppercase tracking-wider truncate mb-1">
                            {ep.podcast?.name || ep.podcast?.title}
                          </p>
                        )}
                        <h4 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-[#FFBF00] transition-colors">
                          {decodeHtmlEntities(ep.title)}
                        </h4>
                        <p className="text-xs text-[#808080] flex items-center gap-2 font-medium">
                          <span className="flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {Math.floor((ep.durationSeconds || 1800) / 60)} min
                          </span>
                          <span>•</span>
                          <span>
                            {ep.publishedAt
                              ? new Date(ep.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                              : "Récemment"}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleLike(ep.id)}
                          className={`p-2.5 rounded-full transition-colors bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] ${
                            isLiked(ep.id) ? "text-[#FFBF00]" : "text-[#808080] hover:text-[#FFBF00]"
                          }`}
                          title={isLiked(ep.id) ? "Retirer des favoris" : "Aimer cet épisode"}
                        >
                          <Heart className={`w-4 h-4 ${isLiked(ep.id) ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleAddToQueue(ep)}
                          className="p-2.5 text-[#808080] hover:text-white bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] rounded-full transition-colors"
                          title="Ajouter à la file d'attente"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Fallback fin de sections dynamiques */}
          </>
        )}

        {/* 4. FLUX CONTINU & DÉFILEMENT INFINI */}
        <section className="space-y-6 pt-10 border-t border-[#242424]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#242424] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#FFBF00]" />
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {selectedCategory === "all" ? "Flux Continu d'Épisodes" : `Flux : ${selectedCategory}`}
                </h2>
              </div>
              <p className="text-sm text-[#B8B8B8] max-w-2xl">
                Explorez l'ensemble des émissions et publications du catalogue sans interruption.
              </p>
            </div>
            <Link
              href={selectedCategory === "all" ? "/explore?view=episodes" : `/explore?view=episodes&category=${selectedCategory}`}
              className="self-start md:self-end group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#FFBF00]/40 text-xs font-bold text-[#D4D4D4] hover:text-[#FFBF00] transition-colors shrink-0"
            >
              <span>Découvrir davantage</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#FFBF00] transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Message si catégorie vide */}
          {!isLoading && feedItems.length === 0 && selectedCategory !== "all" && (
            <div className="py-16 flex flex-col items-center justify-center text-center p-6 bg-[#111] rounded-2xl border border-[#222]">
              <Sparkles className="w-10 h-10 text-[#666] mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">
                Aucun épisode trouvé dans cette thématique
              </h3>
              <p className="text-sm text-[#888] max-w-md mb-6">
                Aucun contenu n'est actuellement publié pour la catégorie « {selectedCategory} ».
              </p>
              <button
                onClick={() => setSelectedCategory("all")}
                className="px-6 py-2.5 bg-[#FFBF00] text-black font-extrabold text-xs rounded-full hover:bg-[#E5AC00] transition-colors"
              >
                Revenir à Tout explorer
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {feedItems.map((item: any, idx: number) => {
              const ep = item.episode || item;
              if (!ep) return null;
              const isCurrent = currentEpisode?.id === ep.id;

              return (
                <TrackedCard
                  key={`${item.id || ep.id}_${idx}`}
                  batchId={item.attribution?.batchId}
                  sectionId="infinite-feed"
                  sectionSlug="infinite-feed"
                  targetType="EPISODE"
                  targetId={ep.id}
                  position={item.position ?? idx}
                  reason={item.reason || "Catalogue"}
                  onClick={() => handlePlay(ep, item.attribution)}
                  className="group hover:bg-[#141414] p-3 rounded-xl flex flex-row items-center gap-4 transition-colors cursor-pointer border border-[#1F1F1F] hover:border-[#2E2E2E] bg-[#0E0E0E]"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#0B0B0B] border border-[#2A2A2A]">
                    <img
                      src={ep.cover || ep.podcast?.cover || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-[#FFBF00] flex items-center justify-center shadow-lg">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-black fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-black fill-current ml-1" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {ep.podcast?.slug ? (
                        <Link
                          href={`/podcasts/${ep.podcast.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] md:text-xs font-bold text-[#FFBF00] hover:underline uppercase tracking-wider truncate cursor-pointer transition-colors"
                        >
                          {ep.podcast?.name || ep.podcast?.title}
                        </Link>
                      ) : (
                        <span className="text-[10px] md:text-xs font-bold text-[#FFBF00] uppercase tracking-wider truncate">
                          {ep.podcast?.name || ep.podcast?.title}
                        </span>
                      )}
                      {item.reason && (
                        <span className="text-[10px] bg-[#1C1C1C] text-[#D4D4D4] px-2 py-0.5 rounded border border-[#2A2A2A] font-semibold">
                          {item.reason}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-[#FFBF00] transition-colors">
                      {decodeHtmlEntities(ep.title)}
                    </h4>
                    <p className="text-xs text-[#808080] flex items-center gap-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {Math.floor((ep.durationSeconds || 1800) / 60)} min
                      </span>
                      <span>•</span>
                      <span>
                        {ep.publishedAt
                          ? new Date(ep.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                          : "Récemment"}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleLike(ep.id)}
                      className={`p-2.5 rounded-full transition-colors bg-[#1F1F1F] hover:bg-[#2A2A2A] ${
                        isLiked(ep.id) ? "text-[#FFBF00]" : "text-[#808080] hover:text-[#FFBF00]"
                      }`}
                      title={isLiked(ep.id) ? "Retirer des favoris" : "Aimer cet épisode"}
                    >
                      <Heart className={`w-4 h-4 ${isLiked(ep.id) ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
                    </button>
                    <button
                      onClick={() => handleAddToQueue(ep)}
                      className="p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors"
                      title="Ajouter à la file d'attente"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#141414] border-[#2A2A2A] text-white">
                        <DropdownMenuItem
                          onClick={() => handleFeedback("EPISODE", ep.id, "NOT_INTERESTED")}
                          className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                        >
                          <ThumbsDown className="w-4 h-4 text-[#808080]" />
                          Pas intéressé par cet épisode
                        </DropdownMenuItem>
                        {ep.podcast?.id && (
                          <DropdownMenuItem
                            onClick={() => handleFeedback("PODCAST", ep.podcast.id, "HIDE_PODCAST")}
                            className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                          >
                            <EyeOff className="w-4 h-4 text-[#808080]" />
                            Masquer cette émission
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TrackedCard>
              );
            })}
          </div>

          {/* Sentinel & Infinite scroll status */}
          <div ref={observerRef} className="py-6 flex flex-col items-center justify-center min-h-[60px]">
            {isLoadingFeed && (
              <div className="flex items-center gap-3 text-sm text-[#FFBF00] font-bold">
                <div className="w-5 h-5 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
                Chargement des épisodes suivants...
              </div>
            )}
            {feedError && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-red-400">{feedError}</p>
                <button
                  onClick={loadMoreFeed}
                  className="px-4 py-2 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white rounded-full text-xs font-bold transition-colors border border-[#333]"
                >
                  Réessayer
                </button>
              </div>
            )}
            {!feedHasMore && feedItems.length > 0 && !isLoadingFeed && (
              <p className="text-xs text-[#666] font-semibold py-4">
                Fin du catalogue pour cette sélection
              </p>
            )}
          </div>
        </section>

        {/* 7. Footer CTA */}
        <div className="mt-20 mb-10">
          <div className="bg-[#141414] border border-[#242424] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="flex items-start md:items-center gap-6">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shadow-lg">
                <Mic className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                  Vous animez un podcast au Mali ou en Diaspora ?
                </h2>
                <p className="text-[#B8B8B8] text-sm md:text-base max-w-2xl">
                  Intégrez le catalogue officiel Bamako Podcast et touchez des
                  centaines de milliers d'auditeurs en Bamanankan et Français.
                </p>
              </div>
            </div>
            <Link
              href="/become-creator"
              className="shrink-0 bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold px-8 py-4 rounded-full transition-colors shadow-lg active:scale-95 w-full md:w-auto text-center"
            >
              Créer / Proposer mon émission
            </Link>
          </div>
        </div>
      </div>

      <DiscoveryPromotionModal
        config={{
          campaignId: "promo_discover_podcasts_2026",
          title: "Plongez dans les nouvelles voix du Mali",
          description:
            "Explorez notre sélection spéciale de créatrices et créateurs indépendants enregistrés à Bamako et dans la diaspora.",
          targetUrl: "/discovery/sections/discover-podcasts",
          buttonLabel: "Découvrir la sélection",
          coverUrl:
            "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop",
          maxFrequencyHours: 48,
        }}
      />

      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-[90] px-4 py-2.5 rounded-xl bg-[#1E1E1E] border border-[#333333] text-white text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-[#FFBF00]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <HomeSkeleton />;

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
