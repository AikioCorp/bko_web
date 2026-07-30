"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePlayerStore, PlayerEpisode } from "../store/playerStore";
import { PodcastCardStandard, PodcastItem, EpisodeItem } from "../components/ui/Cards";

export default function HomePage() {
  const { playEpisode } = usePlayerStore();
  const [homeSections, setHomeSections] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/home")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setHomeSections(json.data);
        }
      })
      .catch((err) => console.error("Erreur Home API:", err));
  }, []);

  // Featured Episode for Cinematographic Hero
  const featuredEpisode: PlayerEpisode = {
    id: "ep-hero-1",
    slug: "entreprendre-au-mali-defis-et-opportunites",
    title: "Les voix qui font bouger Bamako.",
    cover: "/brand/logo.webp",
    durationSeconds: 2740,
    podcast: {
      slug: "voix-de-bamako",
      name: "Voix de Bamako",
      cover: "/brand/logo.webp",
    },
    mediaSources: [
      {
        id: "ms-1",
        type: "AUDIO",
        sourceType: "EXTERNAL",
        playbackMode: "NATIVE",
        isPrimaryAudio: true,
        externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        durationSeconds: 2740,
      },
      {
        id: "ms-2",
        type: "VIDEO",
        sourceType: "EXTERNAL",
        provider: "YOUTUBE",
        playbackMode: "EMBED",
        isPrimaryVideo: true,
        externalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        durationSeconds: 2740,
      },
    ],
  };

  const trendingPodcasts: (PodcastItem & { rank: string })[] = [
    {
      id: "p1",
      rank: "01",
      name: "Voix de Bamako",
      slug: "voix-de-bamako",
      organization: { name: "Studio Bamako Podcast" },
      cover: "/brand/logo.webp",
      countryId: "ML",
    },
    {
      id: "p2",
      rank: "02",
      name: "Bamako Tech Talk",
      slug: "bamako-tech-talk",
      organization: { name: "Mali Digital Hub" },
      cover: "/brand/logo.webp",
      countryId: "ML",
    },
    {
      id: "p3",
      rank: "03",
      name: "Histoires & Terroirs",
      slug: "histoires-et-terroirs",
      organization: { name: "Culture Mali" },
      cover: "/brand/logo.webp",
      countryId: "ML",
    },
    {
      id: "p4",
      rank: "04",
      name: "Femmes d'Impact Mali",
      slug: "femmes-dimpact",
      organization: { name: "Réseau Lead-Her" },
      cover: "/brand/logo.webp",
      countryId: "ML",
    },
  ];

  const latestEpisodes = [
    {
      id: "ep-1",
      rank: "01",
      title: "L'avenir de la FinTech et des paiements mobiles à Bamako",
      podcastName: "Bamako Tech Talk",
      duration: "28 min",
    },
    {
      id: "ep-2",
      rank: "02",
      title: "S'implanter dans la sous-région : Retour d'expérience",
      podcastName: "Voix de Bamako",
      duration: "42 min",
    },
    {
      id: "ep-3",
      rank: "03",
      title: "Récits transmis : L'art du conte malien réinventé",
      podcastName: "Histoires & Terroirs",
      duration: "35 min",
    },
  ];

  const bamanankanStories = [
    {
      id: "bm-1",
      title: "Bamanankan kɔnɔ sɔrɔtan ni jɛmuw",
      podcastName: "Savoirs en Bamanankan",
      duration: "34 min",
    },
    {
      id: "bm-2",
      title: "Bamako dugukolo kan taamaw ni fɔliw",
      podcastName: "Voix de Bamako",
      duration: "45 min",
    },
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
    { name: "Mohamed Traoré", role: "Entrepreneur · Animateur", podcast: "Voix de Bamako" },
    { name: "Aminata Diallo", role: "Journaliste Tech", podcast: "Bamako Tech Talk" },
    { name: "Oumar Coulibaly", role: "Historien · Conteur", podcast: "Histoires & Terroirs" },
    { name: "Fatoumata Sissoko", role: "Entrepreneure", podcast: "Femmes d'Impact" },
  ];

  return (
    <div className="bko-container py-12 space-y-24 animate-fade-in text-[#F0F6FC]">
      {/* 1. HERO CINÉMATOGRAPHIQUE & MINIMAL */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
        {/* Contenu Éditorial (7/12 Desktop) */}
        <div className="md:col-span-7 space-y-6">
          <span className="text-[10px] font-bold text-[#E6B009] uppercase tracking-widest">À LA UNE</span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#F0F6FC] leading-[1.1] max-w-xl">
            {featuredEpisode.title}
          </h1>

          <p className="text-sm md:text-base text-[#8B949E] max-w-lg leading-relaxed font-normal">
            Une immersion exclusive au cœur des conversations et des récits qui façonnent le Mali d'aujourd'hui.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <button
              onClick={() => playEpisode(featuredEpisode, "AUDIO")}
              className="px-7 py-3.5 bg-[#E6B009] hover:bg-[#F5B82E] text-[#0B0F17] font-extrabold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <span>▶</span>
              <span>Écouter</span>
            </button>

            <button
              onClick={() => playEpisode(featuredEpisode, "VIDEO")}
              className="px-6 py-3.5 text-xs font-semibold text-[#8B949E] hover:text-[#F0F6FC] transition-colors"
            >
              Regarder (Vidéo)
            </button>
          </div>
        </div>

        {/* Large Visual Cover Dominante (5/12 Desktop) */}
        <div className="md:col-span-5 flex justify-center">
          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl bg-[#161B22]">
            <Image
              src={featuredEpisode.cover}
              alt={featuredEpisode.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* 2. LES INCONTOURNABLES DU MALI (Covers Dominantes) */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-[#161B22] pb-4">
          <div>
            <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest">SÉLECTION</span>
            <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC]">Les incontournables du Mali</h2>
          </div>
          <Link href="/explore" className="text-xs font-semibold text-[#8B949E] hover:text-[#E6B009] transition-colors">
            Voir tout →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingPodcasts.map((podcast) => (
            <PodcastCardStandard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      </section>

      {/* 3. À ÉCOUTER CETTE SEMAINE (Nouveaux Épisodes - Liste Éditoriale) */}
      <section className="space-y-8">
        <div className="border-b border-[#161B22] pb-4">
          <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest">DERNIERES PUBLICATIONS</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC]">À écouter cette semaine</h2>
        </div>

        <div className="divide-y divide-[#161B22]">
          {latestEpisodes.map((ep) => (
            <div
              key={ep.id}
              className="py-4 flex items-center justify-between group cursor-pointer transition-colors"
              onClick={() => playEpisode(featuredEpisode, "AUDIO")}
            >
              <div className="flex items-center gap-6 min-w-0 pr-4">
                <span className="text-lg font-mono font-bold text-[#8B949E] group-hover:text-[#E6B009] transition-colors w-6">
                  {ep.rank}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm md:text-base font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors truncate">
                    {ep.title}
                  </h4>
                  <p className="text-xs text-[#8B949E] mt-0.5">{ep.podcastName} • {ep.duration}</p>
                </div>
              </div>

              <button className="w-9 h-9 rounded-full bg-[#161B22] group-hover:bg-[#E6B009] text-[#8B949E] group-hover:text-[#0B0F17] flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                ▶
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. MOMENT ÉDITORIAL : EN BAMANANKAN */}
      <section className="bg-[#161B22]/50 border border-[#21262D] rounded-3xl p-8 md:p-12 space-y-8">
        <div className="max-w-xl space-y-2">
          <span className="text-[10px] font-bold text-[#E6B009] uppercase tracking-widest">PATRIMOINE AUDIO</span>
          <h2 className="text-3xl md:text-4xl font-black text-[#F0F6FC]">En Bamanankan</h2>
          <p className="text-xs md:text-sm text-[#8B949E] leading-relaxed">
            Les histoires, les idées et les voix exprimées dans notre langue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bamanankanStories.map((story) => (
            <div
              key={story.id}
              onClick={() => playEpisode(featuredEpisode, "AUDIO")}
              className="p-5 rounded-2xl bg-[#0B0F17] border border-[#21262D] hover:border-[#E6B009] transition-all flex items-center justify-between cursor-pointer group"
            >
              <div className="space-y-1 min-w-0 pr-4">
                <span className="text-[10px] font-semibold text-[#8B949E] uppercase">{story.podcastName}</span>
                <h4 className="text-sm font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors truncate">
                  {story.title}
                </h4>
                <p className="text-xs text-[#8B949E]">{story.duration}</p>
              </div>
              <span className="w-8 h-8 rounded-full bg-[#161B22] group-hover:bg-[#E6B009] text-[#8B949E] group-hover:text-[#0B0F17] flex items-center justify-center font-bold text-xs transition-colors shrink-0">
                ▶
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CATÉGORIES (Entrées Typographiques Équilibrées) */}
      <section className="space-y-6">
        <div className="border-b border-[#161B22] pb-4">
          <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest">THÉMATIQUES</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC]">Explorer les sujets</h2>
        </div>

        <div className="flex flex-wrap gap-4">
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

      {/* 6. VOIX À DÉCOUVRIR (Human Portraits) */}
      <section className="space-y-8">
        <div className="border-b border-[#161B22] pb-4">
          <span className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest">PORTRAITS</span>
          <h2 className="text-2xl md:text-3xl font-black text-[#F0F6FC]">Voix à découvrir</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {creators.map((c, idx) => (
            <div key={idx} className="flex flex-col items-center text-center space-y-3 group cursor-pointer">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#161B22] border border-[#21262D] group-hover:border-[#E6B009] transition-all shadow-lg">
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

      {/* 7. CTA ESPACE CRÉATEUR (Sober Text Section) */}
      <section className="py-12 border-t border-b border-[#161B22] text-center space-y-4 max-w-2xl mx-auto">
        <h3 className="text-2xl font-black text-[#F0F6FC]">Vous avez un podcast ?</h3>
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
