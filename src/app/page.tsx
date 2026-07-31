"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayerStore, PlayerEpisode } from "../store/playerStore";
import { PodcastCardStandard, PodcastItem } from "../components/ui/Cards";

export default function HomePage() {
  const { playEpisode } = usePlayerStore();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [heroEp, setHeroEp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/home`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const { sections, trending } = json.data;

          // Extract podcasts
          if (trending && trending.length > 0) {
            setPodcasts(trending);
          }

          // Extract sections items
          if (sections && Array.isArray(sections)) {
            const heroSection = sections.find((s: any) => s.slug === "hero-selection");
            if (heroSection && heroSection.items && heroSection.items.length > 0) {
              setHeroEp(heroSection.items[0].episode);
            }

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

  // Fallbacks if server returns empty
  const displayPodcasts = podcasts.length > 0 ? podcasts : [
    {
      id: "p1",
      slug: "nkunsigui",
      name: "N'kunsigui",
      description: "Podcast interview, culture, société au Mali.",
      cover: "https://img.youtube.com/vi/KWhVBP8YQaM/maxresdefault.jpg",
      country: { name: "Mali" },
    },
    {
      id: "p2",
      slug: "baba-cmn",
      name: "Baba Cmn",
      description: "Entretiens exclusifs et entrepreneuriat.",
      cover: "https://img.youtube.com/vi/Rr6vUM3pKqc/maxresdefault.jpg",
      country: { name: "Mali" },
    },
    {
      id: "p3",
      slug: "impact-hub-bamako",
      name: "Impact Hub Bamako",
      description: "Innovation, tech et écosystème d'affaires.",
      cover: "https://img.youtube.com/vi/xS_Z1P6pUwo/maxresdefault.jpg",
      country: { name: "Mali" },
    },
    {
      id: "p4",
      slug: "dizuiti-kono",
      name: "Dizuiti Kono",
      description: "Émissions sport, société et jeunesse.",
      cover: "https://img.youtube.com/vi/4r7oPnCQa2w/maxresdefault.jpg",
      country: { name: "Mali" },
    },
  ];

  const displayEpisodes = episodes.length > 0 ? episodes : [
    {
      id: "ep-1",
      title: "N'kunsigui - Podcast Interview Exclusive",
      podcast: { name: "N'kunsigui" },
      durationSeconds: 2740,
      cover: "https://img.youtube.com/vi/KWhVBP8YQaM/maxresdefault.jpg",
      mediaSources: [{ provider: "YOUTUBE", externalId: "KWhVBP8YQaM", embedUrl: "https://www.youtube.com/embed/KWhVBP8YQaM" }],
    },
    {
      id: "ep-2",
      title: "Baba Cmn - Interview Exclusive & Parcours",
      podcast: { name: "Baba Cmn" },
      durationSeconds: 3200,
      cover: "https://img.youtube.com/vi/Rr6vUM3pKqc/maxresdefault.jpg",
      mediaSources: [{ provider: "YOUTUBE", externalId: "Rr6vUM3pKqc", embedUrl: "https://www.youtube.com/embed/Rr6vUM3pKqc" }],
    },
    {
      id: "ep-3",
      title: "Impact Hub Bamako - Innovation au Mali",
      podcast: { name: "Impact Hub Bamako" },
      durationSeconds: 2900,
      cover: "https://img.youtube.com/vi/xS_Z1P6pUwo/maxresdefault.jpg",
      mediaSources: [{ provider: "YOUTUBE", externalId: "xS_Z1P6pUwo", embedUrl: "https://www.youtube.com/embed/xS_Z1P6pUwo" }],
    },
  ];

  const currentHero = heroEp || displayEpisodes[0];

  const categoriesList = [
    { name: "Business & Économie", slug: "business" },
    { name: "Culture & Société", slug: "culture" },
    { name: "Innovation & Tech", slug: "tech" },
    { name: "Musique & Arts", slug: "musique" },
    { name: "Actualité & Débats", slug: "actualite" },
    { name: "Agriculture & Terroir", slug: "agriculture" },
  ];

  const creators = [
    { name: "Mohamed Traoré", role: "Entrepreneur · Animateur", podcast: "Voix de Bamako" },
    { name: "Aminata Diallo", role: "Journaliste Tech", podcast: "Bamako Tech Talk" },
    { name: "Oumar Coulibaly", role: "Historien · Conteur", podcast: "Histoires & Terroirs" },
    { name: "Fatoumata Sissoko", role: "Entrepreneure", podcast: "Femmes d'Impact" },
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
    <div className="bko-container py-12 md:py-16 space-y-28 animate-fade-in text-[#F0F6FC]">
      {/* 1. HERO ÉDITORIAL CINÉMATOGRAPHIQUE */}
      <section className="bg-[#161B22]/80 border border-[#21262D] rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Contenu Éditorial */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6B009]/10 border border-[#E6B009]/30">
              <span className="w-2 h-2 rounded-full bg-[#E6B009] animate-pulse"></span>
              <span className="text-[11px] font-extrabold text-[#E6B009] uppercase tracking-widest">
                SÉLECTION ÉDITORIALE
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#F0F6FC] leading-[1.08] tracking-tight max-w-xl">
              {currentHero?.title || "Les voix qui font bouger Bamako."}
            </h1>

            <p className="text-sm md:text-base text-[#8B949E] max-w-lg leading-relaxed font-normal">
              {currentHero?.description || "Une immersion exclusive au cœur des conversations et des récits les plus inspirants du Mali."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => handlePlayMedia(currentHero, "VIDEO")}
                className="px-8 py-3.5 bg-[#E6B009] hover:bg-[#F2C029] text-[#0B0F17] font-black text-xs rounded-2xl transition-all shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="text-sm">▶</span>
                <span>ÉCOUTER / REGARDER</span>
              </button>
            </div>
          </div>

          {/* Artwork Cover */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl bg-[#0B0F17] border border-[#30363D] group">
              <Image
                src={currentHero?.cover || "/brand/logo.webp"}
                alt={currentHero?.title || "Podcast Mali"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. LES INCONTOURNABLES DU MALI (Rail de Pochettes Réelles) */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-[#161B22] pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#8B949E] uppercase tracking-widest">SÉLECTION</span>
            <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC] tracking-tight">Les incontournables du Mali</h2>
          </div>
          <Link href="/explore" className="text-xs font-bold text-[#8B949E] hover:text-[#E6B009] transition-colors">
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayPodcasts.map((podcast, idx) => (
            <PodcastCardStandard
              key={podcast.id || idx}
              podcast={{
                id: podcast.id,
                slug: podcast.slug,
                name: podcast.name,
                cover: podcast.cover,
                organization: { name: podcast.country?.name || "Mali" },
              }}
            />
          ))}
        </div>
      </section>

      {/* 3. À ÉCOUTER CETTE SEMAINE (Épisodes Réels YouTube) */}
      <section className="space-y-8">
        <div className="border-b border-[#161B22] pb-4 space-y-1">
          <span className="text-[11px] font-extrabold text-[#8B949E] uppercase tracking-widest">DERNIÈRES PUBLICATIONS</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC] tracking-tight">À écouter cette semaine</h2>
        </div>

        <div className="divide-y divide-[#161B22]">
          {displayEpisodes.map((ep, idx) => (
            <div
              key={ep.id || idx}
              className="py-4 flex items-center justify-between group cursor-pointer transition-colors hover:bg-[#161B22]/30 px-3 rounded-2xl"
              onClick={() => handlePlayMedia(ep, "VIDEO")}
            >
              <div className="flex items-center gap-6 min-w-0 pr-4">
                <span className="text-base font-mono font-black text-[#6E7681] group-hover:text-[#E6B009] transition-colors w-6">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm md:text-base font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors truncate">
                    {ep.title}
                  </h4>
                  <p className="text-xs text-[#8B949E] mt-0.5">
                    {ep.podcast?.name || "Bko Podcast"} • {Math.round((ep.durationSeconds || 1800) / 60)} min
                  </p>
                </div>
              </div>

              <button className="w-10 h-10 rounded-full bg-[#161B22] group-hover:bg-[#E6B009] text-[#8B949E] group-hover:text-[#0B0F17] flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-md">
                ▶
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PATRIMOINE AUDIO : EN BAMANANKAN */}
      <section className="bg-[#161B22]/60 border border-[#21262D] rounded-3xl p-8 md:p-12 space-y-8 relative">
        <div className="max-w-xl space-y-2">
          <span className="text-[11px] font-extrabold text-[#E6B009] uppercase tracking-widest">PATRIMOINE AUDIO</span>
          <h2 className="text-3xl md:text-4xl font-black text-[#F0F6FC] tracking-tight">En Bamanankan</h2>
          <p className="text-xs md:text-sm text-[#8B949E] leading-relaxed">
            Les histoires, les idées et les voix exprimées dans notre langue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {displayEpisodes.slice(0, 2).map((ep, idx) => (
            <div
              key={idx}
              onClick={() => handlePlayMedia(ep, "VIDEO")}
              className="p-6 rounded-2xl bg-[#0B0F17] border border-[#21262D] hover:border-[#E6B009] transition-all flex items-center justify-between cursor-pointer group shadow-lg"
            >
              <div className="space-y-1 min-w-0 pr-4">
                <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-wider">{ep.podcast?.name || "Bamanankan"}</span>
                <h4 className="text-sm font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors truncate">
                  {ep.title}
                </h4>
                <p className="text-xs text-[#8B949E]">{Math.round((ep.durationSeconds || 1800) / 60)} min</p>
              </div>
              <span className="w-9 h-9 rounded-full bg-[#161B22] group-hover:bg-[#E6B009] text-[#8B949E] group-hover:text-[#0B0F17] flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                ▶
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CATÉGORIES */}
      <section className="space-y-6">
        <div className="border-b border-[#161B22] pb-4 space-y-1">
          <span className="text-[11px] font-extrabold text-[#8B949E] uppercase tracking-widest">THÉMATIQUES</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC] tracking-tight">Explorer les sujets</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {categoriesList.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="px-5 py-3 rounded-2xl bg-[#161B22] border border-[#21262D] hover:border-[#E6B009] text-xs font-bold text-[#F0F6FC] hover:text-[#E6B009] transition-all"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 6. VOIX À DÉCOUVRIR */}
      <section className="space-y-8">
        <div className="border-b border-[#161B22] pb-4 space-y-1">
          <span className="text-[11px] font-extrabold text-[#8B949E] uppercase tracking-widest">PORTRAITS</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC] tracking-tight">Voix à découvrir</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {creators.map((c, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-3 group cursor-pointer">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#161B22] border border-[#21262D] group-hover:border-[#E6B009] transition-all shadow-xl">
                <div className="w-full h-full bg-[#161B22] text-[#E6B009] font-black text-2xl flex items-center justify-center">
                  {c.name[0]}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors">{c.name}</h4>
                <p className="text-xs text-[#8B949E] mt-0.5">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA ESPACE CRÉATEUR */}
      <section className="py-12 border-t border-b border-[#161B22] text-center space-y-4 max-w-2xl mx-auto">
        <h3 className="text-2xl font-black text-[#F0F6FC] tracking-tight">Vous avez un podcast ?</h3>
        <p className="text-xs md:text-sm text-[#8B949E] leading-relaxed">
          Faites entendre votre voix sur Bko Podcast et développez votre audience auprès des auditeurs maliens et internationaux.
        </p>
        <div className="pt-2 flex items-center justify-center gap-6 text-xs font-bold">
          <Link href="/studio" className="text-[#E6B009] hover:underline">
            Devenir créateur →
          </Link>
          <Link href="/studio/claim" className="text-[#8B949E] hover:text-[#F0F6FC] transition-colors">
            Revendiquer mon podcast
          </Link>
        </div>
      </section>
    </div>
  );
}
