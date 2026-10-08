"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { 
  Play, Pause, Plus, TrendingUp, Sparkles, Mic, ChevronRight, 
  Search, SlidersHorizontal, ArrowRight, Bookmark, BookmarkCheck, ListPlus, ListMinus, Check, Share2
} from "lucide-react";
import useSWR from "swr";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import { DownloadAppSection, AppDownloadModal } from "@/components/public/MarketingComponents";

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="h-[400px] bg-[#141414] rounded-2xl border border-[#242424]" />
      <div className="space-y-4">
        <div className="h-8 bg-[#2A2A2A] rounded w-48 mb-4"></div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="min-w-[160px] space-y-3">
              <div className="w-40 h-40 bg-[#1A1A1A] rounded-xl" />
              <div className="h-4 bg-[#2A2A2A] rounded w-3/4" />
              <div className="h-3 bg-[#1A1A1A] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CarouselSection({ title, podcasts }: { title: string, podcasts: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!podcasts || podcasts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-headline font-bold text-white flex items-center gap-2">
          {title} <ChevronRight className="w-5 h-5 text-[#757575]" />
        </h2>
      </div>

      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {podcasts.map((podcast: any) => (
            <Link
              key={podcast.id}
              href={`/podcast/${podcast.slug}`}
              className="min-w-[140px] md:min-w-[160px] snap-start group/card block"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-[#242424] group-hover/card:border-[#FFBF00] transition-colors shadow-lg">
                <Image 
                  src={podcast.cover || "/images/placeholder.jpg"} 
                  alt={podcast.name} 
                  fill 
                  sizes="160px" 
                  className="object-cover group-hover/card:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/0 transition-colors" />
                {podcast.categories?.[0]?.category?.name && (
                  <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 backdrop-blur-sm text-[10px] font-semibold text-white px-2 py-0.5 rounded shadow">
                    {podcast.categories[0].category.name}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-white truncate group-hover/card:text-[#FFBF00] transition-colors">
                {podcast.name}
              </h3>
              <p className="text-xs text-[#B8B8B8] truncate mt-0.5">
                {podcast._count?.episodes || 0} épisodes
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HomeContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const personalDataReady = isAuthenticated && !authLoading;
  const { playEpisode, currentEpisode, isPlaying, togglePlay } = usePlayerStore();
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data);
  const { data, isLoading } = useSWR(`${API_BASE_URL}/home?country=all`, fetcher);
  
  const { data: savedEpisodesData, mutate: mutateSaved } = useSWR(personalDataReady ? ["/me/saved", user?.id] : null, async ([url]) => {
    try { const res = (await fetchApi(url)).data; return Array.isArray(res) ? res : []; } catch { return []; }
  });

  const toggleSaveList = async (ep: any) => {
    if (!isAuthenticated) return flash("Connectez-vous pour sauvegarder !");
    const isSaved = savedEpisodesData?.some((e: any) => e.episodeId === ep.id);
    const newSaved = isSaved ? savedEpisodesData.filter((e: any) => e.episodeId !== ep.id) : [...(savedEpisodesData || []), { episodeId: ep.id, episode: ep }];
    mutateSaved(newSaved, false);
    try {
      if (isSaved) await fetchApi(`/me/saved/${ep.id}`, { method: "DELETE" });
      else await fetchApi("/me/saved", { method: "POST", body: JSON.stringify({ episodeId: ep.id }) });
      mutateSaved();
      flash(isSaved ? "Retiré des favoris" : "Ajouté aux favoris");
    } catch {
      mutateSaved();
    }
  };

  if (isLoading || !data) return <HomeSkeleton />;

  const { heroEpisode, trending, latestEpisodes, sections } = data;
  
  // Group trending by category to create dynamic lively rows
  const groupedByCategory: Record<string, any[]> = {};
  if (trending) {
    trending.forEach((podcast: any) => {
      const catName = podcast.categories?.[0]?.category?.name || "Autres";
      if (!groupedByCategory[catName]) groupedByCategory[catName] = [];
      groupedByCategory[catName].push(podcast);
    });
  }

  const categoryEntries = Object.entries(groupedByCategory).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-12 pb-24 max-w-[1400px] mx-auto px-4 md:px-6 mt-4">
      
      {/* 1. Hero Section (Dynamic from API) */}
      {heroEpisode && (
        <section className="relative w-full h-[450px] md:h-[550px] rounded-3xl overflow-hidden border border-[#242424] group shadow-2xl">
          <Image 
            src={heroEpisode.cover || heroEpisode.podcast?.cover || "/images/placeholder.jpg"} 
            alt="Hero" 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-105" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/80 to-transparent" />
          
          <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-xs font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> À la Une
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A]/80 backdrop-blur border border-[#333333] text-white text-xs font-semibold">
                {heroEpisode.podcast?.name}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-headline font-black text-white leading-tight mb-4 drop-shadow-md">
              {heroEpisode.title}
            </h1>
            <p className="text-sm md:text-base text-[#E0E0E0] line-clamp-2 md:line-clamp-3 mb-8 max-w-2xl text-shadow-sm">
              {heroEpisode.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={() => playEpisode(heroEpisode)}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                {currentEpisode?.id === heroEpisode.id && isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-1" />
                )}
                <span>Écouter maintenant</span>
              </button>
              <Link
                href={`/podcast/${heroEpisode.podcast?.slug}`}
                className="flex items-center gap-2 px-8 py-4 rounded-full bg-[#1A1A1A]/50 hover:bg-[#242424] backdrop-blur-md border border-[#333333] hover:border-[#444444] text-white font-semibold transition-all"
              >
                Explorer le podcast
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Tendances globales */}
      <CarouselSection title="Tendances du moment" podcasts={trending?.slice(0, 10) || []} />

      {/* 3. Dynamic Categories Sections */}
      {categoryEntries.map(([catName, podcasts]) => (
        <CarouselSection key={catName} title={`Sélection ${catName}`} podcasts={podcasts} />
      ))}

      {/* 4. Derniers épisodes parus */}
      {latestEpisodes && latestEpisodes.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-headline font-bold text-white">
                Fraîchement publiés
              </h2>
              <p className="text-xs text-[#B8B8B8] mt-1">
                Les toutes dernières sorties de nos créateurs
              </p>
            </div>
            <Link href="/explore" className="text-xs font-semibold text-[#FFBF00] hover:underline">
              Voir tout
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestEpisodes.map((ep: any) => {
              const isSaved = savedEpisodesData?.some((e: any) => e.episodeId === ep.id);
              const queueIndex = usePlayerStore.getState().queue.findIndex((q: any) => q.id === ep.id);
              const isInQueue = queueIndex !== -1;

              return (
                <div
                  key={ep.id}
                  className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl p-4 flex items-center justify-between gap-4 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <button
                      onClick={() => playEpisode(ep)}
                      className="w-10 h-10 rounded-full bg-[#1E1E1E] group-hover:bg-[#FFBF00] text-[#B8B8B8] group-hover:text-[#0B0B0B] flex items-center justify-center shrink-0 transition-all shadow hover:scale-105 active:scale-95"
                    >
                      <Play className="w-4 h-4 fill-current ml-1" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider mb-1">
                        <span className="text-[#FFBF00]">{ep.podcast?.name}</span>
                        <span className="text-[#444444]">•</span>
                        <span className="text-[#757575]">{new Date(ep.publishedAt).toLocaleDateString()}</span>
                      </div>
                      <h3
                        onClick={() => playEpisode(ep)}
                        className="text-sm font-bold text-white truncate cursor-pointer hover:text-[#FFBF00] transition-colors"
                      >
                        {ep.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleSaveList(ep)}
                      className={`p-2 rounded-full transition-colors ${isSaved ? "bg-[#FFBF00]/10 text-[#FFBF00]" : "bg-transparent text-[#757575] hover:bg-[#242424] hover:text-white"}`}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (isInQueue) {
                          usePlayerStore.getState().removeFromQueue(queueIndex);
                          flash("Retiré de la file !");
                        } else {
                          usePlayerStore.getState().addToQueue(ep);
                          flash("Ajouté à la file !");
                        }
                      }}
                      className={`p-2 rounded-full transition-colors ${isInQueue ? "bg-[#FFBF00]/10 text-[#FFBF00]" : "bg-transparent text-[#757575] hover:bg-[#242424] hover:text-white"}`}
                    >
                      {isInQueue ? <ListMinus className="w-4 h-4" /> : <ListPlus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. CTA Créateurs Studio */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 mt-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBF00]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 shadow-lg">
            <Mic className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-headline font-black text-white mb-2">
              Lancez votre podcast aujourd'hui
            </h3>
            <p className="text-sm text-[#B8B8B8] max-w-xl leading-relaxed">
              Rejoignez le collectif des créateurs sonores de Bamako Podcast. Accédez à nos studios, distribuez en 1 clic et monétisez votre audience.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 w-full md:w-auto relative z-10">
          <Link
            href="/studio"
            className="flex-1 md:flex-none text-center px-6 py-3 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-sm font-black transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Ouvrir mon studio
          </Link>
        </div>
      </div>

      <DownloadAppSection />
      <AppDownloadModal isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />

      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 bg-[#FFBF00] text-[#0B0B0B] px-5 py-2.5 rounded-full font-bold text-sm shadow-2xl animate-fade-in pointer-events-none flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
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
