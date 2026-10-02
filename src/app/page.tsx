"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Play,
  Bookmark,
  Share2,
  Clock,
  Download,
  MoreVertical,
  SlidersHorizontal,
  Mic,
  ArrowRight,
  Info,
  Check,
} from "lucide-react";
import { usePlayerStore, PlayerEpisode } from "../store/playerStore";

function HomeContent() {
  const { playEpisode } = usePlayerStore();
  const searchParams = useSearchParams();
  const [selectedFilter, setSelectedFilter] = useState("Toutes les langues");
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const langParam = searchParams.get("lang");
    if (langParam === "bm") setSelectedFilter("• Bamanankan");
    else if (langParam === "fr") setSelectedFilter("Français");
    else if (langParam === "ALL") setSelectedFilter("Toutes les langues");
  }, [searchParams]);

  const filters = [
    "Toutes les langues",
    "Français",
    "• Bamanankan",
    "Soninké",
    "Peul (Fulfulde)",
    "Société & Récits",
    "Économie & Tech",
    "Culture & Arts",
  ];

  // Featured Hero Episode
  const heroEpisode: PlayerEpisode = {
    id: "ep-hero-34",
    slug: "une-nouvelle-generation-de-musiciens-maliens",
    title: "Une nouvelle génération de musiciens maliens",
    cover: "/images/cover-musique.jpg",
    durationSeconds: 2520, // 42 min
    podcast: {
      slug: "les-voix-de-bamako",
      name: "Les voix de Bamako",
      cover: "/images/cover-musique.jpg",
    },
    mediaSources: [
      {
        id: "hero-src-1",
        type: "AUDIO",
        sourceType: "UPLOAD",
        playbackMode: "NATIVE",
        externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        durationSeconds: 2520,
        isPrimaryAudio: true,
      },
    ],
  };

  // Continuer l'écoute items
  const resumeEpisodes: (PlayerEpisode & {
    progressPercent: number;
    resumeTime: string;
    langBadge: string;
  })[] = [
    {
      id: "ep-resume-1",
      slug: "creer-son-activite-a-bamako-en-2025",
      title: "Créer son activité à Bamako en 2025",
      cover: "/images/cover-entreprendre.jpg",
      durationSeconds: 2700, // 45 min
      progressPercent: 41,
      resumeTime: "18:40",
      langBadge: "Français",
      podcast: {
        slug: "entreprendre-au-mali",
        name: "ENTREPRENDRE AU MALI",
        cover: "/images/cover-entreprendre.jpg",
      },
      mediaSources: [
        {
          id: "res-1",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
          durationSeconds: 2700,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "ep-resume-2",
      slug: "an-ka-taa-bamako-episode-18",
      title: "An ka taa Bamako • Épisode 18",
      cover: "/images/cover-griot.jpg",
      durationSeconds: 1680, // 28 min
      progressPercent: 29,
      resumeTime: "08:15",
      langBadge: "Bamanankan",
      podcast: {
        slug: "bamanankan-kuma",
        name: "BAMANANKAN KUMA",
        cover: "/images/cover-griot.jpg",
      },
      mediaSources: [
        {
          id: "res-2",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
          durationSeconds: 1680,
          isPrimaryAudio: true,
        },
      ],
    },
  ];

  // Podcasts recommandés
  const recommendedPodcasts = [
    {
      slug: "les-voix-de-bamako",
      title: "Les voix de Bamako",
      author: "Aminata Touré",
      episodesCount: 34,
      lang: "FR / BM",
      badge: "Société",
      cover: "/images/cover-musique.jpg",
    },
    {
      slug: "entreprendre-au-mali",
      title: "Entreprendre au Mali",
      author: "Oumar Diarra",
      episodesCount: 22,
      lang: "Français",
      badge: "Économie",
      cover: "/images/cover-entreprendre.jpg",
    },
    {
      slug: "culture-vivante",
      title: "Culture vivante",
      author: "Kadiatou Sangaré",
      episodesCount: 18,
      lang: "Français",
      badge: "Arts",
      cover: "/images/cover-kora.jpg",
    },
    {
      slug: "bamanankan-kuma",
      title: "Bamanankan kuma",
      author: "Bakary Coulibaly",
      episodesCount: 40,
      lang: "Bamanankan",
      badge: "Bamanankan",
      cover: "/images/cover-griot.jpg",
    },
    {
      slug: "afrique-demain",
      title: "Afrique Demain",
      author: "Dr. Moussa Koné",
      episodesCount: 15,
      lang: "Français",
      badge: "Prospective",
      cover: "/images/cover-culture.jpg",
    },
  ];

  // Derniers épisodes parus
  const latestEpisodes: (PlayerEpisode & {
    timeAgo: string;
    langBadge?: string;
    durationStr: string;
  })[] = [
    {
      id: "latest-1",
      slug: "la-kora-a-lere-numerique",
      title: "La kora à l'ère numérique : transmission avec Madou Sidiki",
      cover: "/images/cover-kora.jpg",
      timeAgo: "Hier",
      durationStr: "36 min",
      durationSeconds: 2160,
      podcast: {
        slug: "culture-vivante",
        name: "Culture vivante",
        cover: "/images/cover-kora.jpg",
      },
      mediaSources: [
        {
          id: "lat-1",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
          durationSeconds: 2160,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "latest-2",
      slug: "kalan-ni-donko",
      title: "Kalan ni dɔnko : Sɛbɛnnikɛla fitininw ka kɔrɔbɔri",
      cover: "/images/cover-griot.jpg",
      timeAgo: "Il y a 2 jours",
      langBadge: "Bamanankan",
      durationStr: "24 min",
      durationSeconds: 1440,
      podcast: {
        slug: "bamanankan-kuma",
        name: "Bamanankan kuma",
        cover: "/images/cover-griot.jpg",
      },
      mediaSources: [
        {
          id: "lat-2",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
          durationSeconds: 1440,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "latest-3",
      slug: "solaire-off-grid-fleuve-niger",
      title: "Solaire, off-grid et agriculture résiliente le long du fleuve Niger",
      cover: "/images/cover-culture.jpg",
      timeAgo: "Il y a 4 jours",
      durationStr: "51 min",
      durationSeconds: 3060,
      podcast: {
        slug: "afrique-demain",
        name: "Afrique Demain",
        cover: "/images/cover-culture.jpg",
      },
      mediaSources: [
        {
          id: "lat-3",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
          durationSeconds: 3060,
          isPrimaryAudio: true,
        },
      ],
    },
    {
      id: "latest-4",
      slug: "financer-sa-premiere-micro-entreprise",
      title: "Financer sa première micro-entreprise à Ségou et Sikasso",
      cover: "/images/cover-entreprendre.jpg",
      timeAgo: "Il y a 6 jours",
      durationStr: "21 min",
      durationSeconds: 1260,
      podcast: {
        slug: "entreprendre-au-mali",
        name: "Entreprendre au Mali",
        cover: "/images/cover-entreprendre.jpg",
      },
      mediaSources: [
        {
          id: "lat-4",
          type: "AUDIO",
          sourceType: "UPLOAD",
          playbackMode: "NATIVE",
          externalUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
          durationSeconds: 1260,
          isPrimaryAudio: true,
        },
      ],
    },
  ];

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const filteredPodcasts = recommendedPodcasts.filter((p) => {
    if (selectedFilter === "Français" && !p.lang.includes("Français") && !p.lang.includes("FR")) return false;
    if (selectedFilter === "• Bamanankan" && !p.lang.includes("Bamanankan") && !p.lang.includes("BM")) return false;
    return true;
  });

  const filteredEpisodes = latestEpisodes.filter((ep) => {
    if (selectedFilter === "Français" && ep.langBadge && !ep.langBadge.includes("Français")) return false;
    if (selectedFilter === "• Bamanankan" && ep.langBadge && !ep.langBadge.includes("Bamanankan")) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in text-white select-none">
      {/* 1. Alert Banner (Image 1) */}
      <div className="bg-[#141414] border border-[#242424] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 text-xs text-[#B8B8B8]">
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full bg-[#1C180E] border border-[#FFBF00]/30 flex items-center justify-center text-[#FFBF00] shrink-0">
            <Info className="w-3 h-3" />
          </span>
          <p className="leading-snug">
            <span className="text-white font-semibold">Écoute libre et fluide</span> — Accessible sans inscription obligatoire • Les voix phares et récits du Mandé en accès illimité.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-[#FFBF00]">
          <span>BKO SIGNAL 4G</span>
          <span className="w-2 h-2 rounded-full bg-[#FFBF00] animate-pulse" />
        </div>
      </div>

      {/* 2. Hero Featured Card (Image 1) */}
      <div className="relative rounded-2xl bg-[#141414] border border-[#242424] overflow-hidden p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Solid sleek dark layout with image on the right */}
        <div className="space-y-4 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              ÉDITION SPÉCIALE
            </span>
            <span className="bg-[#1C1C1C] border border-[#2E2E2E] text-[#B8B8B8] text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              Français & Bamanankan
            </span>
            <span className="text-[#757575] text-xs">• Parution hebdo</span>
          </div>

          <p className="text-[#FFBF00] text-xs font-bold uppercase tracking-wider">
            LES VOIX DE BAMAKO • ÉP. 34
          </p>

          <h1 className="text-2xl md:text-4xl font-headline font-extrabold text-white leading-tight">
            Une nouvelle génération de musiciens maliens
          </h1>

          <p className="text-xs md:text-sm text-[#B8B8B8] leading-relaxed">
            Fatoumata Diawara et des artistes émergents de Badalabougou explorent la réinvention du son mandingue, entre rythmes afro-électro et instruments traditionnels...
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => playEpisode(heroEpisode)}
              className="px-5 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Écouter maintenant (42 min)</span>
            </button>

            <button
              onClick={() => playEpisode(heroEpisode)}
              className="px-4 py-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-white text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#B8B8B8]" />
              <span>Ajouter à la bibliothèque</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white transition-colors"
              title="Partager l'épisode"
            >
              {copiedLink ? <Check className="w-4 h-4 text-[#FFBF00]" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Hero Visual on the right */}
        <div className="relative w-full md:w-80 h-52 md:h-64 rounded-xl overflow-hidden shrink-0 border border-[#262626] bg-[#0E0E0E]">
          <Image
            src="/images/cover-musique.jpg"
            alt="Une nouvelle génération de musiciens maliens"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* 3. Filter Bar (Image 1) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tracking-wider uppercase text-[#B8B8B8]">
            FILTRER L'ÉCOUTE
          </span>
          <span className="text-[#FFBF00] font-medium">64 séries disponibles</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {filters.map((f) => {
            const isActive = selectedFilter === f;
            return (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#FFBF00] text-[#0B0B0B]"
                    : "bg-[#141414] hover:bg-[#1E1E1E] text-[#B8B8B8] hover:text-white border border-[#242424]"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Continuer l'écoute (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-headline font-bold text-lg">
            <Clock className="w-4 h-4 text-[#FFBF00]" />
            <h2>Continuer l'écoute</h2>
          </div>
          <Link
            href="/library"
            className="text-xs text-[#B8B8B8] hover:text-[#FFBF00] transition-colors"
          >
            Voir l'historique
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumeEpisodes.map((item) => (
            <div
              key={item.id}
              onClick={() => playEpisode(item)}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl p-3.5 flex items-center gap-4 transition-all cursor-pointer group"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#282828]">
                <Image src={item.cover || "/images/cover-entreprendre.jpg"} alt={item.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 fill-white text-white drop-shadow" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#FFBF00] uppercase tracking-wide truncate">
                    {item.podcast.name}
                  </span>
                  <span className="bg-[#1E1E1E] px-2 py-0.5 rounded text-[#B8B8B8] border border-[#2A2A2A]">
                    {item.langBadge}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                  {item.title}
                </h3>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-[#757575] font-mono">
                    <span>Reprendre à {item.resumeTime}</span>
                    <span>{Math.round(item.durationSeconds / 60)} min</span>
                  </div>
                  <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFBF00]"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Podcasts recommandés (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Podcasts recommandés
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              Sélection éditoriale des productions phares du Mali et de la diaspora
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-semibold text-[#FFBF00] hover:underline"
          >
            Tout explorer
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredPodcasts.map((podcast) => (
            <Link
              key={podcast.slug}
              href={`/podcasts/${podcast.slug}`}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-xl p-3 flex flex-col gap-2.5 transition-all group"
            >
              <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-[#282828] bg-[#0E0E0E]">
                <Image src={podcast.cover} alt={podcast.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 backdrop-blur-sm text-[10px] font-semibold text-white px-2 py-0.5 rounded border border-[#333333]">
                  {podcast.badge}
                </span>
              </div>

              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                  {podcast.title}
                </h3>
                <p className="text-[11px] text-[#757575] truncate">{podcast.author}</p>
                <p className="text-[10px] text-[#B8B8B8] pt-1">
                  {podcast.episodesCount} épisodes • {podcast.lang}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 6. Derniers épisodes parus (Image 1 & 2) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg md:text-xl font-headline font-bold text-white">
              Derniers épisodes parus
            </h2>
            <p className="text-xs text-[#B8B8B8]">
              Fraîchement enregistrés dans nos studios partenaires
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#242424] hover:border-[#333333] text-xs font-medium text-[#B8B8B8] hover:text-white transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Trier par récence</span>
          </button>
        </div>

        <div className="space-y-2">
          {filteredEpisodes.map((ep) => (
            <div
              key={ep.id}
              className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#333333] rounded-xl px-4 py-3 flex items-center justify-between gap-4 transition-colors group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => playEpisode(ep)}
                  className="w-8 h-8 rounded-full bg-[#1E1E1E] group-hover:bg-[#FFBF00] text-[#B8B8B8] group-hover:text-[#0B0B0B] flex items-center justify-center shrink-0 transition-colors shadow-sm"
                  aria-label="Écouter"
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-[#FFBF00] font-semibold">{ep.podcast.name}</span>
                    {ep.langBadge && (
                      <span className="bg-[#1E1E1E] text-[#B8B8B8] px-1.5 py-0.2 rounded text-[10px] border border-[#2A2A2A]">
                        {ep.langBadge}
                      </span>
                    )}
                    <span className="text-[#757575]">• {ep.timeAgo}</span>
                  </div>
                  <h3
                    onClick={() => playEpisode(ep)}
                    className="text-xs font-bold text-white truncate cursor-pointer hover:underline"
                  >
                    {ep.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-[#757575]">
                <span className="font-mono text-[#B8B8B8]">{ep.durationStr}</span>
                <button
                  className="p-1.5 hover:text-white transition-colors"
                  title="Télécharger l'épisode"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:text-white transition-colors"
                  title="Plus d'actions"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. CTA Créateurs Studio (Image 2) */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 shadow-lg">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-headline font-bold text-white">
              Vous racontez des histoires à Bamako ?
            </h3>
            <p className="text-xs text-[#B8B8B8] max-w-xl">
              Rejoignez le collectif des créateurs sonores de Bamako Podcast. Accédez à nos studios, formations au montage et monétisation directe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <Link
            href="/studio"
            className="flex-1 md:flex-none text-center px-5 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-extrabold transition-all shadow-md"
          >
            Ouvrir mon studio
          </Link>
          <Link
            href="/studio"
            className="text-xs font-semibold text-[#B8B8B8] hover:text-white px-3 py-2 transition-colors"
          >
            En savoir plus
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement de la page d'accueil...</div>}>
      <HomeContent />
    </Suspense>
  );
}
