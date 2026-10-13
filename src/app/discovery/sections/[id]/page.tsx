"useClient";
"use client";

import { useEffect, useState, useRef, useTransition } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
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
  ChevronLeft,
  Play,
  Pause,
  Headphones,
  Video,
  ListPlus,
  Share2,
  MoreVertical,
  Radio,
  Sparkles,
  Clock,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Check,
} from "lucide-react";

interface SectionMeta {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  type: string;
  sourceMode?: string;
  discoveryContext?: any;
}

export default function SectionDiscoveryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const sectionId = (params?.id as string) || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialBatchId = searchParams.get("batchId") || "";

  const { currentEpisode, isPlaying, playEpisode, togglePlay, addToQueue } =
    usePlayerStore();
  const { user } = useAuthStore();

  const [section, setSection] = useState<SectionMeta | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filtre local de format pour les listes d'épisodes : 'ALL' | 'AUDIO' | 'VIDEO'
  const [formatFilter, setFormatFilter] = useState<"ALL" | "AUDIO" | "VIDEO">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const limit = 20;

  // Chargement initial de la section
  useEffect(() => {
    if (!sectionId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const query = new URLSearchParams({
      offset: "0",
      limit: String(limit),
      category: initialCategory,
    });
    if (initialBatchId) query.set("batchId", initialBatchId);

    fetchApi(`/home/sections/${encodeURIComponent(sectionId)}?${query.toString()}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          const data = res.data;
          setSection(data.section);
          setItems(data.items || []);
          setOffset((data.items || []).length);
          setTotal(data.pagination?.total ?? (data.items || []).length);
          setHasMore(Boolean(data.pagination?.hasMore));
        } else {
          setError(res.error?.message || "Impossible de charger cette sélection.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Erreur de connexion au serveur.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [sectionId, initialCategory, initialBatchId]);

  // Chargement paginé
  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const query = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
        category: initialCategory,
      });
      if (initialBatchId) query.set("batchId", initialBatchId);

      const res = await fetchApi(
        `/home/sections/${encodeURIComponent(sectionId)}?${query.toString()}`
      );

      if (res.success && res.data) {
        const nextItems = res.data.items || [];
        setItems((prev) => {
          const existingIds = new Set(
            prev.map((i) => i.id || i.episode?.id || i.podcast?.id)
          );
          const filteredNext = nextItems.filter(
            (i: any) =>
              !existingIds.has(i.id || i.episode?.id || i.podcast?.id)
          );
          return [...prev, ...filteredNext];
        });
        setOffset((prev) => prev + nextItems.length);
        setTotal(res.data.pagination?.total ?? total);
        setHasMore(Boolean(res.data.pagination?.hasMore));
      }
    } catch (err: any) {
      console.error("Erreur de pagination:", err);
    } finally {
      setIsLoadingMore(false);
    }
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
          section?.id || sectionId,
          section?.slug || "discovery",
          "EPISODE",
          ep.id,
          "PLAY_START"
        );
      }
    }
  };

  const handleShare = (e: React.MouseEvent, path: string, id: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(`${window.location.origin}${path}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const isPodcastSection =
    section?.type === "PODCAST_ROW" ||
    (items.length > 0 && items[0]?.targetType === "PODCAST");

  // Filtrage local Audio / Vidéo pour les épisodes
  const filteredEpisodeItems = items.filter((item) => {
    if (isPodcastSection) return true;
    const ep = item.episode || item;
    if (!ep) return false;

    if (formatFilter === "AUDIO") {
      const hasAudio =
        ep.mediaSources?.some((s: any) => s.type === "AUDIO" || s.format === "AUDIO") ||
        ep.audioUrl;
      return Boolean(hasAudio);
    }
    if (formatFilter === "VIDEO") {
      const hasVideo =
        ep.mediaSources?.some(
          (s: any) =>
            s.type === "VIDEO" ||
            s.format === "VIDEO" ||
            s.provider === "YOUTUBE"
        ) || ep.videoUrl;
      return Boolean(hasVideo);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white pb-36">
      {/* 1. HEADER ÉTENDU AVEC NAVIGATION & CONTEXTE */}
      <div className="sticky top-0 z-30 bg-[#0B0B0B]/95 backdrop-blur-md border-b border-[#1E1E1E]">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#FFBF00]/50 text-xs font-semibold text-[#D4D4D4] hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Retour à la page précédente"
            >
              <ChevronLeft className="w-4 h-4 text-[#FFBF00]" />
              <span className="hidden sm:inline">Retour</span>
            </button>

            {/* Pastille de comptage réel */}
            <div className="flex items-center gap-2 text-xs text-[#888888] font-medium">
              {!isLoading && (
                <span className="px-3 py-1 rounded-full bg-[#141414] border border-[#242424]">
                  {total > 0
                    ? `${total} ${isPodcastSection ? "émissions" : "épisodes"} au catalogue`
                    : `${items.length} contenus`}
                </span>
              )}
            </div>
          </div>

          {/* Titre et description de la section */}
          <div className="mt-4 pt-1">
            <div className="flex items-center gap-2.5">
              {isPodcastSection ? (
                <Radio className="w-5 h-5 text-[#FFBF00] shrink-0" />
              ) : section?.slug === "for-you" ? (
                <Sparkles className="w-5 h-5 text-[#FFBF00] shrink-0" />
              ) : section?.slug === "continue-listening" ? (
                <Clock className="w-5 h-5 text-[#FFBF00] shrink-0" />
              ) : (
                <Layers className="w-5 h-5 text-[#FFBF00] shrink-0" />
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                {section?.title || (isLoading ? "Chargement de la sélection..." : "Découverte")}
              </h1>
            </div>

            {section?.subtitle && (
              <p className="mt-1.5 text-sm md:text-base text-[#A8A8A8] max-w-3xl leading-relaxed">
                {section.subtitle}
              </p>
            )}

            {/* Filtres Audio / Vidéo pour les épisodes */}
            {!isPodcastSection && !isLoading && items.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold uppercase tracking-wider text-[#757575] mr-1 hidden sm:inline">
                  Format :
                </span>
                {(["ALL", "AUDIO", "VIDEO"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFormatFilter(mode)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer shrink-0 border ${
                      formatFilter === mode
                        ? "bg-[#FFBF00] text-[#0B0B0B] border-[#FFBF00]"
                        : "bg-[#141414] text-[#888888] border-[#242424] hover:text-white hover:border-[#383838]"
                    }`}
                  >
                    {mode === "ALL" && "Tout le catalogue"}
                    {mode === "AUDIO" && "Audio uniquement"}
                    {mode === "VIDEO" && "Vidéo"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. CORPS PRINCIPAL DE LA PAGE */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-8">
        {/* État de chargement initial */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-[#141414] border border-[#242424] rounded-2xl p-4 space-y-3 animate-pulse"
                >
                  <div className="aspect-square bg-[#1E1E1E] rounded-xl w-full" />
                  <div className="h-4 bg-[#262626] rounded w-3/4" />
                  <div className="h-3 bg-[#1F1F1F] rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* État d'erreur */}
        {error && !isLoading && (
          <div className="bg-[#141414] border border-red-900/40 rounded-2xl p-8 text-center max-w-lg mx-auto my-12">
            <p className="text-red-400 font-semibold mb-2">{error}</p>
            <p className="text-xs text-[#888888] mb-6">
              Vérifiez votre connexion internet ou réessayez dans quelques instants.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFBF00] text-[#0B0B0B] font-extrabold text-xs hover:bg-[#E5AC00] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réessayer
            </button>
          </div>
        )}

        {/* État vide */}
        {!isLoading && !error && items.length === 0 && (
          <div className="bg-[#141414] border border-[#242424] rounded-2xl p-12 text-center max-w-lg mx-auto my-12">
            <Layers className="w-10 h-10 text-[#FFBF00] mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold text-white mb-1">
              Aucun contenu dans cette sélection
            </h3>
            <p className="text-xs text-[#888888] mb-6">
              Les critères actuels ne retournent aucun épisode ou émission publié.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1E1E1E] hover:bg-[#2A2A2A] text-white border border-[#333333] text-xs font-bold transition-colors"
            >
              Parcourir Tout Explorer
            </Link>
          </div>
        )}

        {/* VUE 1 : GRILLE D'ÉMISSIONS (PODCAST_ROW) */}
        {!isLoading && !error && isPodcastSection && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {items.map((item, idx) => {
              const pod = item.podcast || item;
              const epCount =
                pod._count?.episodes ?? pod.episodesCount ?? pod.episodes?.length ?? 0;
              const followCount = pod._count?.followers;

              return (
                <TrackedCard
                  key={pod.id || idx}
                  batchId={item.attribution?.batchId || initialBatchId}
                  sectionId={section?.id || sectionId}
                  sectionSlug={section?.slug || "discovery"}
                  targetType="PODCAST"
                  targetId={pod.id}
                  position={item.position ?? idx}
                  reason={item.reason}
                  className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-3 transition-colors group cursor-pointer flex flex-col justify-between"
                >
                  <Link href={`/podcasts/${pod.slug || pod.id}`} className="block">
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#0B0B0B] relative mb-3">
                      <img
                        src={
                          pod.cover ||
                          pod.imageUrl ||
                          "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=300&auto=format&fit=crop"
                        }
                        alt={pod.title || pod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#FFBF00] transition-colors line-clamp-1">
                      {pod.title || pod.name}
                    </h3>
                    {formatPodcastSubtitle(pod) && (
                      <p className="text-xs text-[#808080] truncate mt-0.5">
                        {formatPodcastSubtitle(pod)}
                      </p>
                    )}
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-[#707070] mt-3 pt-2 border-t border-[#1F1F1F]">
                    <span>{epCount} épisodes</span>
                    {pod.primaryLanguage?.name || pod.language ? (
                      <span className="uppercase text-[10px] font-semibold text-[#888888]">
                        {pod.primaryLanguage?.code || pod.language}
                      </span>
                    ) : null}
                  </div>
                </TrackedCard>
              );
            })}
          </div>
        )}

        {/* VUE 2 : LISTE D'ÉPISODES (EPISODE_ROW) */}
        {!isLoading && !error && !isPodcastSection && (
          <div className="space-y-3">
            {filteredEpisodeItems.map((item, idx) => {
              const ep = item.episode || item;
              if (!ep) return null;

              const isCurrent = currentEpisode?.id === ep.id;
              const hasVideo =
                ep.mediaSources?.some(
                  (s: any) =>
                    s.type === "VIDEO" ||
                    s.format === "VIDEO" ||
                    s.provider === "YOUTUBE"
                ) || Boolean(ep.videoUrl);

              const durationMins = ep.durationSeconds
                ? Math.round(ep.durationSeconds / 60)
                : 30;

              return (
                <TrackedCard
                  key={ep.id || idx}
                  batchId={item.attribution?.batchId || initialBatchId}
                  sectionId={section?.id || sectionId}
                  sectionSlug={section?.slug || "discovery"}
                  targetType="EPISODE"
                  targetId={ep.id}
                  position={item.position ?? idx}
                  reason={item.reason}
                  onClick={() => handlePlay(ep, item.attribution)}
                  className="group bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] p-3 sm:p-4 rounded-2xl flex flex-row items-center gap-3 sm:gap-4 transition-colors cursor-pointer"
                >
                  {/* Pochette avec bouton de lecture au survol */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#0B0B0B] border border-[#2A2A2A]">
                    <img
                      src={
                        ep.cover ||
                        ep.podcast?.cover ||
                        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"
                      }
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div
                      className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations de l'épisode */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      {ep.podcast?.name || ep.podcast?.title ? (
                        <Link
                          href={`/podcasts/${ep.podcast?.slug || ep.podcast?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] font-bold text-[#FFBF00] hover:underline uppercase tracking-wider truncate max-w-[200px]"
                        >
                          {ep.podcast?.name || ep.podcast?.title}
                        </Link>
                      ) : (
                        <span className="text-[11px] font-bold text-[#FFBF00] uppercase tracking-wider">
                          Épisode
                        </span>
                      )}

                      {hasVideo && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1F1F1F] text-[#D4D4D4] text-[10px] font-semibold border border-[#333333]">
                          <Video className="w-3 h-3 text-[#FFBF00]" />
                          Vidéo
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors line-clamp-1">
                      {decodeHtmlEntities(ep.title)}
                    </h3>

                    {ep.description && (
                      <p className="text-xs text-[#808080] line-clamp-1 mt-0.5 hidden sm:block">
                        {decodeHtmlEntities(ep.description)}
                      </p>
                    )}

                    <div className="flex items-center gap-2.5 text-xs text-[#666666] mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {durationMins} min
                      </span>
                      <span>•</span>
                      <span>
                        {ep.publishedAt
                          ? new Date(ep.publishedAt).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })
                          : "Récemment"}
                      </span>
                    </div>
                  </div>

                  {/* Actions contextuelles */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => addToQueue(ep)}
                      className="p-2 sm:p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors cursor-pointer"
                      title="Ajouter à la file d'attente"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 sm:p-2.5 text-[#808080] hover:text-white bg-[#1F1F1F] hover:bg-[#2A2A2A] rounded-full transition-colors cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-[#141414] border-[#2A2A2A] text-white"
                      >
                        <DropdownMenuItem
                          onClick={(e) =>
                            handleShare(
                              e,
                              `/podcasts/${ep.podcast?.slug || ep.podcast?.id}`,
                              ep.id
                            )
                          }
                          className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                        >
                          {copiedId === ep.id ? (
                            <Check className="w-4 h-4 text-[#FFBF00]" />
                          ) : (
                            <Share2 className="w-4 h-4 text-[#808080]" />
                          )}
                          Partager l'épisode
                        </DropdownMenuItem>
                        {ep.podcast?.slug && (
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/podcasts/${ep.podcast.slug}`)
                            }
                            className="cursor-pointer gap-2 hover:bg-[#1F1F1F]"
                          >
                            <Radio className="w-4 h-4 text-[#808080]" />
                            Voir l'émission
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TrackedCard>
              );
            })}
          </div>
        )}

        {/* 3. PAGINATION & FIN DE LISTE */}
        {!isLoading && !error && items.length > 0 && (
          <div className="py-12 flex flex-col items-center justify-center">
            {hasMore ? (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 rounded-full bg-[#141414] hover:bg-[#1E1E1E] border border-[#242424] hover:border-[#FFBF00]/50 text-xs font-extrabold text-white transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#FFBF00] border-t-transparent rounded-full animate-spin" />
                    <span>Chargement de la suite...</span>
                  </>
                ) : (
                  <span>Charger davantage de contenus</span>
                )}
              </button>
            ) : (
              <p className="text-xs text-[#666666] font-semibold py-4">
                Fin de la sélection ({total} contenus au total)
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
