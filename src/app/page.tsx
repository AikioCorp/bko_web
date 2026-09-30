"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayerStore, PlayerEpisode } from "../store/playerStore";

// Composant local pour masquer la scrollbar via utilitaire
const ScrollArea = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
    {children}
  </div>
);

export default function HomePage() {
  const { playEpisode } = usePlayerStore();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/home`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const { sections, trending } = json.data;
          if (trending && trending.length > 0) {
            setPodcasts(trending);
          }
          if (sections && Array.isArray(sections)) {
            const epSection = sections.find((s: any) => s.slug === "dernieres-publications");
            if (epSection && epSection.items) {
              const eps = epSection.items
                .map((item: any) => item.episode)
                .filter(Boolean);
              setEpisodes(eps);
            }
          }
        }
      })
      .catch((err) => console.error("Erreur connexion Home API:", err))
      .finally(() => setLoading(false));
  }, []);

  const displayPodcasts = podcasts.length > 0 ? podcasts : [
    { id: "p1", slug: "nkunsigui", name: "N'kunsigui", description: "Podcast interview, culture, société au Mali.", cover: "https://img.youtube.com/vi/KWhVBP8YQaM/maxresdefault.jpg", country: { name: "Mali" } },
    { id: "p2", slug: "baba-cmn", name: "Baba Cmn", description: "Entretiens exclusifs et entrepreneuriat.", cover: "https://img.youtube.com/vi/Rr6vUM3pKqc/maxresdefault.jpg", country: { name: "Mali" } },
    { id: "p3", slug: "impact-hub-bamako", name: "Impact Hub Bamako", description: "Innovation, tech et écosystème d'affaires.", cover: "https://img.youtube.com/vi/xS_Z1P6pUwo/maxresdefault.jpg", country: { name: "Mali" } },
    { id: "p4", slug: "dizuiti-kono", name: "Dizuiti Kono", description: "Émissions sport, société et jeunesse.", cover: "https://img.youtube.com/vi/4r7oPnCQa2w/maxresdefault.jpg", country: { name: "Mali" } },
    { id: "p5", slug: "bko-tech", name: "Bko Tech", description: "La tech au Mali.", cover: "https://img.youtube.com/vi/KWhVBP8YQaM/maxresdefault.jpg", country: { name: "Mali" } },
  ];

  const displayEpisodes = episodes.length > 0 ? episodes : [
    { id: "ep-1", title: "N'kunsigui - Podcast Interview Exclusive", podcast: { name: "N'kunsigui" }, durationSeconds: 2740, cover: "https://img.youtube.com/vi/KWhVBP8YQaM/maxresdefault.jpg", mediaSources: [{ provider: "YOUTUBE", externalId: "KWhVBP8YQaM", embedUrl: "https://www.youtube.com/embed/KWhVBP8YQaM" }] },
    { id: "ep-2", title: "Baba Cmn - Interview Exclusive & Parcours", podcast: { name: "Baba Cmn" }, durationSeconds: 3200, cover: "https://img.youtube.com/vi/Rr6vUM3pKqc/maxresdefault.jpg", mediaSources: [{ provider: "YOUTUBE", externalId: "Rr6vUM3pKqc", embedUrl: "https://www.youtube.com/embed/Rr6vUM3pKqc" }] },
    { id: "ep-3", title: "Impact Hub Bamako - Innovation au Mali", podcast: { name: "Impact Hub Bamako" }, durationSeconds: 2900, cover: "https://img.youtube.com/vi/xS_Z1P6pUwo/maxresdefault.jpg", mediaSources: [{ provider: "YOUTUBE", externalId: "xS_Z1P6pUwo", embedUrl: "https://www.youtube.com/embed/xS_Z1P6pUwo" }] },
    { id: "ep-4", title: "Dizuiti Kono - Épisode 4", podcast: { name: "Dizuiti Kono" }, durationSeconds: 1500, cover: "https://img.youtube.com/vi/4r7oPnCQa2w/maxresdefault.jpg", mediaSources: [{ provider: "YOUTUBE", externalId: "4r7oPnCQa2w", embedUrl: "https://www.youtube.com/embed/4r7oPnCQa2w" }] },
  ];

  const categoriesList = [
    { name: "Business & Économie", slug: "business" },
    { name: "Culture & Société", slug: "culture" },
    { name: "Innovation & Tech", slug: "tech" },
    { name: "Musique & Arts", slug: "musique" },
    { name: "Actualité & Débats", slug: "actualite" },
    { name: "Agriculture & Terroir", slug: "agriculture" },
  ];

  const creators = [
    { name: "Mohamed Traoré", role: "Entrepreneur", initials: "MT" },
    { name: "Aminata Diallo", role: "Journaliste", initials: "AD" },
    { name: "Oumar Coulibaly", role: "Historien", initials: "OC" },
    { name: "Fatoumata Sissoko", role: "Entrepreneure", initials: "FS" },
    { name: "Sidiki Diabaté", role: "Artiste", initials: "SD" },
  ];

  const handlePlayMedia = (ep: any, mode: "AUDIO" | "VIDEO" = "VIDEO") => {
    const videoSource = ep.mediaSources?.find((ms: any) => ms.provider === "YOUTUBE") || ep.mediaSources?.[0];
    const playerEp: PlayerEpisode = {
      id: ep.id,
      slug: ep.slug || ep.id,
      title: ep.title,
      cover: ep.cover || "/brand/logo.webp",
      durationSeconds: ep.durationSeconds || 1800,
      podcast: {
        slug: ep.podcast?.slug || "podcast",
        name: ep.podcast?.name || "Bko Podcast",
        cover: ep.podcast?.cover || ep.cover || "/brand/logo.webp",
      },
      mediaSources: [
        {
          id: videoSource?.id || "ms-1",
          type: "VIDEO",
          sourceType: "EXTERNAL",
          provider: "YOUTUBE",
          playbackMode: "EMBED",
          isPrimaryVideo: true,
          externalUrl: videoSource?.externalUrl || `https://www.youtube.com/watch?v=${videoSource?.externalId || "KWhVBP8YQaM"}`,
          embedUrl: videoSource?.embedUrl || `https://www.youtube.com/embed/${videoSource?.externalId || "KWhVBP8YQaM"}`,
          durationSeconds: ep.durationSeconds || 1800,
        },
      ],
    };
    playEpisode(playerEp, mode);
  };

  return (
    <div className="py-8 md:py-12 space-y-12 md:space-y-16 animate-fade-in text-[#F0F6FC]">
      
      {/* 1. NOUVEAUTÉS (Apple Podcasts Hero Style) */}
      <section className="px-6 md:px-10">
        <h2 className="text-2xl md:text-[28px] font-bold text-[#F0F6FC] tracking-tight mb-6">Nouveautés</h2>
        <ScrollArea>
          {displayEpisodes.map((ep, idx) => (
            <div 
              key={idx}
              className="snap-start shrink-0 w-[85vw] sm:w-[600px] md:w-[700px] aspect-[16/9] md:aspect-[21/9] relative rounded-2xl overflow-hidden group cursor-pointer shadow-lg"
              onClick={() => handlePlayMedia(ep, "VIDEO")}
            >
              {/* Image Blur Background (Apple Style) */}
              <Image src={ep.cover || "/brand/logo.webp"} alt="" fill className="object-cover absolute inset-0 blur-xl scale-110 opacity-40 group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/90 via-[#0B0F17]/40 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                <span className="text-[11px] font-bold text-[#E6B009] uppercase tracking-wider mb-2">Nouvel Épisode</span>
                <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-md">
                  {ep.title}
                </h3>
                <p className="text-sm text-[#C9D1D9] drop-shadow-md font-medium">
                  {ep.podcast?.name} • {Math.round((ep.durationSeconds || 1800) / 60)} min
                </p>
                <div className="mt-4 flex items-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <button className="px-5 py-2 bg-white text-black font-bold text-sm rounded-full flex items-center gap-2">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Lecture
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </section>

      {/* 2. TOP SHOWS (Horizontal Scrollable Grid - Apple/Spotify Style) */}
      <section className="px-6 md:px-10">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#F0F6FC] tracking-tight">Top Shows</h2>
          <Link href="/podcasts" className="text-xs font-semibold text-[#8B949E] hover:text-white transition-colors">Tout voir</Link>
        </div>
        <ScrollArea>
          {displayPodcasts.map((podcast, idx) => (
            <Link href={`/podcasts/${podcast.slug}`} key={podcast.id || idx} className="snap-start shrink-0 w-[140px] sm:w-[160px] md:w-[180px] flex flex-col group">
              <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 shadow-md bg-[#161B22]">
                <Image src={podcast.cover || "/brand/logo.webp"} alt={podcast.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h4 className="text-sm font-semibold text-[#F0F6FC] truncate group-hover:underline">{podcast.name}</h4>
              <p className="text-[13px] text-[#8B949E] truncate">{podcast.country?.name || "Mali"}</p>
            </Link>
          ))}
        </ScrollArea>
      </section>

      {/* 3. À ÉCOUTER CETTE SEMAINE (Spotify List Style) */}
      <section className="px-6 md:px-10 max-w-5xl">
        <h2 className="text-xl md:text-2xl font-bold text-[#F0F6FC] tracking-tight mb-6">Derniers épisodes</h2>
        <div className="flex flex-col">
          {displayEpisodes.map((ep, idx) => (
            <div
              key={ep.id || idx}
              className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-[#161B22]/60 group cursor-pointer transition-colors"
              onDoubleClick={() => handlePlayMedia(ep, "VIDEO")}
            >
              <div className="w-6 text-center shrink-0">
                <span className="text-sm font-medium text-[#8B949E] group-hover:hidden">{idx + 1}</span>
                <button onClick={() => handlePlayMedia(ep, "VIDEO")} className="hidden group-hover:flex items-center justify-center w-full text-white">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
              
              <div className="relative w-10 h-10 shrink-0 rounded bg-[#161B22] overflow-hidden">
                <Image src={ep.cover || "/brand/logo.webp"} alt={ep.title} fill className="object-cover" />
              </div>
              
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-[15px] font-semibold text-white truncate group-hover:text-[#E6B009] transition-colors">{ep.title}</h4>
                <Link href={`/podcasts/${ep.podcast?.slug || ""}`} onClick={(e) => e.stopPropagation()} className="text-[13px] text-[#8B949E] hover:underline truncate inline-block max-w-full">
                  {ep.podcast?.name}
                </Link>
              </div>
              
              <div className="hidden sm:block shrink-0 text-[13px] text-[#8B949E] w-24 text-right">
                {Math.round((ep.durationSeconds || 1800) / 60)} min
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. VOIX À DÉCOUVRIR (Creators Row - Spotify Artist Style) */}
      <section className="px-6 md:px-10">
        <h2 className="text-xl md:text-2xl font-bold text-[#F0F6FC] tracking-tight mb-6">Populaires</h2>
        <ScrollArea>
          {creators.map((c, idx) => (
            <div key={idx} className="snap-start shrink-0 w-[120px] sm:w-[140px] flex flex-col items-center text-center group cursor-pointer">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-3 bg-[#161B22] shadow-lg group-hover:shadow-2xl transition-all">
                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#8B949E] group-hover:text-white transition-colors bg-[#1A202C]">
                  {c.initials}
                </div>
              </div>
              <h4 className="text-sm font-semibold text-[#F0F6FC] truncate w-full">{c.name}</h4>
              <p className="text-[13px] text-[#8B949E] truncate w-full">Artiste</p>
            </div>
          ))}
        </ScrollArea>
      </section>

      {/* 5. EXPLORER (Categories Pills) */}
      <section className="px-6 md:px-10 pb-8">
        <h2 className="text-xl md:text-2xl font-bold text-[#F0F6FC] tracking-tight mb-6">Parcourir tout</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categoriesList.map((cat, idx) => {
            // Generating some mock colors for the Spotify-style category cards
            const colors = ["bg-purple-600", "bg-blue-600", "bg-green-600", "bg-red-600", "bg-orange-600", "bg-teal-600"];
            const bgColor = colors[idx % colors.length];
            
            return (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className={`relative overflow-hidden rounded-xl aspect-[4/3] ${bgColor} p-4 hover:scale-[1.02] transition-transform`}
              >
                <h3 className="text-base font-bold text-white leading-tight z-10 relative">{cat.name}</h3>
                {/* Decorative shape simulating Spotify category images */}
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-black/20 rounded-full blur-md rotate-12" />
              </Link>
            )
          })}
        </div>
      </section>

    </div>
  );
}
