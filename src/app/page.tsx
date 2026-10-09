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
} from "lucide-react";

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

function HomeContent() {
  const searchParams = useSearchParams();
  const langFilter = searchParams.get("lang") || "ALL";
  const { user } = useAuthStore();
  const { playEpisode, currentEpisode, isPlaying, addToQueue, togglePlay } =
    usePlayerStore();

  const handlePlay = (ep: any) => {
    if (currentEpisode?.id === ep.id) {
      togglePlay();
    } else {
      playEpisode(ep);
    }
  };
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("ALL");

  const fetcher = (url: string) => fetchApi(url).then((json) => json.data);
  const { data: historyData } = useSWR(
    user ? `${API_BASE_URL}/me/history` : null,
    fetcher,
  );
  const { data, isLoading } = useSWR(
    `${API_BASE_URL}/home?country=all&u=${user ? (user as any).id : "guest"}`,
    fetcher,
  );
  const { data: catData } = useSWR(`${API_BASE_URL}/categories`, fetcher);

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
            shelf.slug
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
            <button className="shrink-0 bg-[#FFBF00] text-black font-extrabold px-5 py-2 rounded-full text-xs flex items-center gap-2">
              Tout explorer{" "}
              <span className="bg-black/20 px-1.5 rounded">
                {trending?.length || 20}
              </span>
            </button>
            {categoryEntries.map(([catName, pods, slug]: [string, any[], string?]) => (
              <Link
                href={`/categories/${slug || catName.toLowerCase().replace(/\s+/g, '-')}`}
                key={catName}
                className="shrink-0 bg-[#141414] hover:bg-[#1A1A1A] text-[#B8B8B8] hover:text-white border border-[#242424] font-bold px-5 py-2 rounded-full text-xs flex items-center gap-2 transition-colors"
              >
                {getCategoryIcon(catName)}
                {catName}
                <span className="bg-[#2A2A2A] px-1.5 rounded text-white">
                  {pods.length}
                </span>
              </Link>
              ))}
          </div>
        </section>

        {/* 3. Reprendre la lecture */}
        {resumeItems && resumeItems.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Play className="w-5 h-5 text-[#FFBF00] fill-current" />
                Historique de lecture
              </h2>
              <Link
                href="/history"
                className="text-xs font-bold text-[#808080] hover:text-white transition-colors"
              >
                Voir l'historique
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x">
              {resumeItems?.slice(0, 4).map((ep: any) => {
                const duration = ep.durationSeconds || 1800;
                // Use real progress if available, otherwise fake it deterministically for UI preview
                const pos =
                  ep.positionSeconds !== undefined
                    ? ep.positionSeconds
                    : ((String(ep.id).charCodeAt(0) % 60) + 10) *
                      (duration / 100);
                const restMins = Math.max(0, Math.floor((duration - pos) / 60));
                const percent = Math.min(
                  100,
                  Math.max(0, (pos / duration) * 100),
                );

                return (
                  <div
                    key={ep.id}
                    onClick={() => handlePlay(ep)}
                    className="snap-start shrink-0 w-[320px] bg-[#141414] hover:bg-[#1A1A1A] rounded-xl p-3 border border-[#242424] hover:border-[#333] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4 mb-3">
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
                          {pos > 0 ? (
                            <span className="text-[10px] font-bold text-[#808080] whitespace-nowrap">
                              Reste {restMins}m
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#808080] whitespace-nowrap">
                              {Math.floor(duration / 60)} min
                            </span>
                          )}
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

        {/* 4. Fraîchement publiés (Le retour des cartes épisodes) */}
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
              <div className="flex bg-[#141414] border border-[#242424] rounded-full p-1 shrink-0">
                <button
                  onClick={() => setFilterMode("ALL")}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-colors ${filterMode === "ALL" ? "bg-[#2A2A2A] text-white" : "text-[#808080] hover:text-white"}`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterMode("AUDIO")}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-colors ${filterMode === "AUDIO" ? "bg-[#2A2A2A] text-white" : "text-[#808080] hover:text-white"}`}
                >
                  Audio
                </button>
                <button
                  onClick={() => setFilterMode("VIDEO")}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-colors ${filterMode === "VIDEO" ? "bg-[#2A2A2A] text-white" : "text-[#808080] hover:text-white"}`}
                >
                  Vidéo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEpisodes.slice(0, 8).map((ep: any) => (
                <div
                  key={ep.id}
                  className="group hover:bg-[#141414] p-2 -mx-2 rounded-xl flex flex-row items-center gap-4 transition-colors cursor-pointer border border-transparent hover:border-[#242424]"
                  onClick={() => handlePlay(ep)}
                >
                  {/* Image carrée ou avec bouton play superposé */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden shrink-0 relative bg-[#0B0B0B] border border-[#2A2A2A]">
                    <img
                      src={
                        ep.cover ||
                        ep.podcast?.cover ||
                        "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=200&auto=format&fit=crop"
                      }
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

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[10px] md:text-xs font-bold text-[#FFBF00] uppercase tracking-wider truncate mb-1">
                      {ep.podcast?.name}
                    </p>
                    <h4 className="text-sm md:text-base font-bold text-white leading-tight line-clamp-2 mb-2 group-hover:text-[#FFBF00] transition-colors">
                      {ep.title}
                    </h4>
                    <p className="text-xs text-[#808080] flex items-center gap-2 font-medium">
                      <span className="flex items-center gap-1">
                        <Headphones className="w-3 h-3" />
                        {Math.floor((ep.durationSeconds || 1800) / 60)} min
                      </span>
                      <span>•</span>
                      <span>
                        {ep.publishedAt
                          ? new Date(ep.publishedAt).toLocaleDateString(
                              "fr-FR",
                              { day: "numeric", month: "short" },
                            )
                          : "Récemment"}
                      </span>
                    </p>
                  </div>

                  {/* Action Bookmark */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToQueue(ep);
                    }}
                    className="p-3 text-[#808080] hover:text-white bg-[#2A2A2A]/50 hover:bg-[#2A2A2A] rounded-full transition-colors shrink-0"
                    title="Ajouter à la file d'attente"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Étagères Horizontales (Shelves par Catégorie) avec images 16:9 */}
        <div className="space-y-12 pt-8">
          {categoryEntries.map(
            ([catName, podcasts]: [string, any[]], idx: number) => (
              <section key={catName} className="space-y-4">
                <div className="flex items-end justify-between px-1">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                      {catName}
                    </h2>
                    <p className="text-xs text-[#808080] mt-1">
                      {podcasts.length} séries actives
                    </p>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    <button className="w-9 h-9 rounded-full border border-[#242424] bg-[#141414] flex items-center justify-center hover:bg-[#2A2A2A] text-white transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-9 h-9 rounded-full border border-[#242424] bg-[#141414] flex items-center justify-center hover:bg-[#2A2A2A] text-white transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x">
                  {podcasts.map((podcast: any) => (
                    <Link
                      key={podcast.id}
                      href={`/podcasts/${podcast.slug}`}
                      className="snap-start shrink-0 w-[260px] md:w-[300px] group block"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden relative mb-3 bg-[#141414] border border-[#242424] group-hover:border-[#FFBF00]/50 transition-colors">
                        <img
                          src={
                            podcast.cover ||
                            "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400&auto=format&fit=crop"
                          }
                          alt={podcast.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        {/* Badge Langue optionnel en haut à gauche */}
                        <div className="absolute top-2 left-2 bg-[#E5E5E5] text-[#0B0B0B] text-[9px] font-black px-2 py-1 rounded-sm uppercase tracking-wider shadow-sm">
                          {podcast.primaryLanguage?.name || "FRANÇAIS"}
                        </div>

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-[#FFBF00] flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-6 h-6 text-black fill-current ml-1" />
                          </div>
                        </div>
                      </div>
                      <div className="px-1">
                        <h3 className="text-sm font-bold text-white mb-1 leading-tight truncate group-hover:text-[#FFBF00] transition-colors">
                          {podcast.name}
                        </h3>
                        <p className="text-xs text-[#808080] truncate font-medium">
                          {(podcast.author?.name ||
                            podcast.organization?.name) &&
                            `Par ${podcast.author?.name || podcast.organization?.name}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ),
          )}
        </div>

        {/* 6. Toutes les Catégories Officielles */}
        <section className="space-y-6 pt-12 border-t border-[#242424]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#FFBF00]" />
              <span className="text-[10px] font-black text-[#FFBF00] uppercase tracking-widest">
                INDEX EXHAUSTIF
              </span>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Toutes les Catégories Officielles
            </h2>
            <p className="text-sm text-[#B8B8B8] mt-1 max-w-2xl">
              Explorez l'intégralité du répertoire des thématiques audio avec
              leurs quotas de podcasts associés.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {(categoriesList.length > 0
              ? categoriesList
              : [
                  {
                    name: "Actualité & Médias",
                    description: "Analyses géopolitiques et presse.",
                  },
                  {
                    name: "Agriculture & Environnement",
                    description: "Agribusiness et enjeux climatiques.",
                  },
                  {
                    name: "Arts, Cinéma & Littérature",
                    description: "Critiques de films et livres.",
                  },
                  {
                    name: "Business & Entrepreneuriat",
                    description: "Économie, PME, startups.",
                  },
                  {
                    name: "Culture & Société",
                    description: "Traditions et récits de vie.",
                  },
                  {
                    name: "Diaspora & Immersion",
                    description: "Expériences de la diaspora.",
                  },
                  {
                    name: "Histoire & Patrimoine",
                    description: "Récits historiques du Mali.",
                  },
                  {
                    name: "Innovation & Tech",
                    description: "Digital et intelligence artificielle.",
                  },
                  {
                    name: "Santé & Bien-être",
                    description: "Médecine et nutrition.",
                  },
                  {
                    name: "Sport & Jeunesse",
                    description: "Football et culture sportive.",
                  },
                ]
            ).map((cat: any, i: number) => (
              <Link
                key={i}
                href={`/categories/${cat.slug || cat.id}`}
                className="block bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#FFBF00]/50 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] group-hover:bg-[#FFBF00] text-[#808080] group-hover:text-[#0B0B0B] flex items-center justify-center transition-colors">
                    {getCategoryIcon(cat.name)}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                  {cat.name}
                </h4>
                <p className="text-xs text-[#808080] line-clamp-2 leading-relaxed">
                  {cat.description ||
                    "Explorez les contenus liés à cette catégorie passionnante."}
                </p>
              </Link>
            ))}
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
              href="/studio/podcasts/new"
              className="shrink-0 bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold px-8 py-4 rounded-full transition-colors shadow-lg active:scale-95 w-full md:w-auto text-center"
            >
              Créer / Proposer mon émission
            </Link>
          </div>
        </div>
      </div>

      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
      />
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
