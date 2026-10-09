"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { API_BASE_URL, fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-12">
      <div className="h-[60vh] md:h-[80vh] bg-[#141414] w-full" />
      <div className="px-4 md:px-12 space-y-8">
        {[1, 2, 3].map(row => (
          <div key={row} className="space-y-4">
            <div className="h-6 bg-[#2A2A2A] rounded w-48 mb-4"></div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="min-w-[160px] md:min-w-[200px] h-[240px] md:h-[300px] bg-[#1A1A1A] rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselSection({ title, podcasts }: { title: string, podcasts: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!podcasts || podcasts.length === 0) return null;

  return (
    <section className="space-y-3 relative group">
      <h2 className="text-xl md:text-2xl font-bold text-[#E5E5E5] px-4 md:px-12 transition-colors hover:text-white">
        {title}
      </h2>

      <div 
        ref={scrollRef}
        className="flex gap-2 md:gap-4 overflow-x-auto px-4 md:px-12 pb-8 pt-2 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {podcasts.map((podcast: any) => (
          <Link
            key={podcast.id}
            href={`/podcast/${podcast.slug}`}
            className="min-w-[160px] md:min-w-[220px] snap-start block group/card transition-transform duration-300 origin-bottom hover:scale-110 hover:z-50"
          >
            <div className="relative aspect-[4/5] rounded-md overflow-hidden bg-[#141414] shadow-md">
              <Image 
                src={podcast.cover || "/images/placeholder.jpg"} 
                alt={podcast.name} 
                fill 
                sizes="(max-width: 768px) 160px, 220px"
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <h3 className="text-sm font-bold text-white drop-shadow-md leading-tight">
                  {podcast.name}
                </h3>
                <p className="text-xs text-white/80 drop-shadow-md mt-1">
                  {podcast._count?.episodes || 0} Ã©pisodes
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomeContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { playEpisode, currentEpisode, isPlaying, togglePlay } = usePlayerStore();

  const fetcher = (url: string) => fetch(url).then((res) => res.json()).then((json) => json.data);
  const { data, isLoading } = useSWR(`${API_BASE_URL}/home?country=all`, fetcher);

  if (isLoading || !data) return <HomeSkeleton />;

  const { heroEpisode, trending, latestEpisodes } = data;
  
  // Group trending by category
  const groupedByCategory: Record<string, any[]> = {};
  if (trending) {
    trending.forEach((podcast: any) => {
      const catName = podcast.categories?.[0]?.category?.name || "Tendances globales";
      if (!groupedByCategory[catName]) groupedByCategory[catName] = [];
      groupedByCategory[catName].push(podcast);
    });
  }

  const categoryEntries = Object.entries(groupedByCategory).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="pb-32 bg-[#141414] min-h-screen -mt-20">
      
      {/* 1. Hero Section (Netflix style) */}
      {heroEpisode && (
        <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden mb-8">
          <Image 
            src={heroEpisode.cover || heroEpisode.podcast?.cover || "/images/placeholder.jpg"} 
            alt="Hero" 
            fill 
            className="object-cover" 
            priority
          />
          {/* Gradient Overlay for Text Visibility and blending into background */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-[#141414]/50" />
          
          <div className="absolute inset-0 px-6 md:px-16 flex flex-col justify-end pb-[10vh]">
            <div className="max-w-2xl">
              <h4 className="text-white/80 font-bold tracking-widest text-xs md:text-sm uppercase mb-2">
                {heroEpisode.podcast?.name}
              </h4>
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-2xl font-headline">
                {heroEpisode.title}
              </h1>
              <p className="text-base md:text-lg text-white/90 line-clamp-3 mb-6 drop-shadow-md max-w-xl">
                {heroEpisode.description}
              </p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => playEpisode(heroEpisode)}
                  className="px-6 md:px-8 py-2 md:py-3 rounded bg-white hover:bg-white/80 text-black font-bold text-sm md:text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl md:text-2xl leading-none">{isPlaying && currentEpisode?.id === heroEpisode.id ? "â¸" : "â–¶"}</span>
                  Lecture
                </button>
                <Link
                  href={`/podcast/${heroEpisode.podcast?.slug}`}
                  className="px-6 md:px-8 py-2 md:py-3 rounded bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-sm md:text-lg transition-colors"
                >
                  Plus d'infos
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Dynamic Categories Sections */}
      <div className="space-y-4 md:space-y-8 relative z-10 -mt-10 md:-mt-20">
        {categoryEntries.map(([catName, podcasts]) => (
          <CarouselSection key={catName} title={catName} podcasts={podcasts} />
        ))}
        
        {/* Latest Episodes fallback row if any */}
        {latestEpisodes && latestEpisodes.length > 0 && (
          <section className="space-y-3 relative group">
            <h2 className="text-xl md:text-2xl font-bold text-[#E5E5E5] px-4 md:px-12 transition-colors hover:text-white">
              NouveautÃ©s
            </h2>
            <div className="flex gap-2 md:gap-4 overflow-x-auto px-4 md:px-12 pb-8 pt-2 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {latestEpisodes.map((ep: any) => (
                <div key={ep.id} onClick={() => playEpisode(ep)} className="min-w-[200px] md:min-w-[280px] snap-start block group/card transition-transform duration-300 origin-bottom hover:scale-105 hover:z-50 cursor-pointer">
                  <div className="relative aspect-video rounded-md overflow-hidden bg-[#1A1A1A] shadow-md">
                    <Image 
                      src={ep.cover || ep.podcast?.cover || "/images/placeholder.jpg"} 
                      alt={ep.title} 
                      fill 
                      sizes="(max-width: 768px) 200px, 280px"
                      className="object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                       <span className="text-4xl text-white drop-shadow-lg">â–¶</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover/card:text-white transition-colors">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-[#808080] truncate mt-0.5">
                      {ep.podcast?.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

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


