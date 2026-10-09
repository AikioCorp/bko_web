"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mic, Search, SlidersHorizontal, ChevronDown } from "lucide-react";

export default function PodcastsCatalogPage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [selectedTopic, setSelectedTopic] = useState("ALL");

  const catalogPodcasts = [
    {
      id: "p1",
      name: "Les voix de Bamako",
      slug: "les-voix-de-bamako",
      author: "Aminata TourÃ©",
      cover: "/images/cover-musique.jpg",
      badge: "SociÃ©tÃ©",
      episodesCount: 34,
      language: "FR / BM",
      description: "Interviews intimes et exploration sonore au cÅ“ur de la capitale malienne.",
    },
    {
      id: "p2",
      name: "Entreprendre au Mali",
      slug: "entreprendre-au-mali",
      author: "Oumar Diarra",
      cover: "/images/cover-entreprendre.jpg",
      badge: "Ã‰conomie",
      episodesCount: 22,
      language: "FranÃ§ais",
      description: "StratÃ©gies, financements locaux et rÃ©ussites entrepreneuriales Ã  Bamako et dans les rÃ©gions.",
    },
    {
      id: "p3",
      name: "Culture vivante",
      slug: "culture-vivante",
      author: "Kadiatou SangarÃ©",
      cover: "/images/cover-kora.jpg",
      badge: "Arts",
      episodesCount: 18,
      language: "FranÃ§ais",
      description: "Un voyage sonore Ã  travers la musique, la littÃ©rature orale et le patrimoine vivant du Mali.",
    },
    {
      id: "p4",
      name: "Bamanankan kuma",
      slug: "bamanankan-kuma",
      author: "Bakary Coulibaly",
      cover: "/images/cover-griot.jpg",
      badge: "Bamanankan",
      episodesCount: 40,
      language: "Bamanankan",
      description: "SÉ›bÉ›nnikÉ›la, maana ani tarikuw bamanankan kÉ”nÉ”.",
    },
    {
      id: "p5",
      name: "Afrique Demain",
      slug: "afrique-demain",
      author: "Dr. Moussa KonÃ©",
      cover: "/images/cover-culture.jpg",
      badge: "Prospective",
      episodesCount: 15,
      language: "FranÃ§ais",
      description: "Transitions Ã©nergÃ©tiques, innovations technologiques et dÃ©fis du continent.",
    },
    {
      id: "p6",
      name: "Kora & Balafon Moderne",
      slug: "kora-balafon-moderne",
      author: "Studio Badalabougou",
      cover: "/images/cover-studio.jpg",
      badge: "Musique",
      episodesCount: 28,
      language: "Bamanankan",
      description: "L'exploration des ponts entre les mÃ©lodies traditionnelles mandingues et la production moderne.",
    },
  ];

  const filtered = catalogPodcasts.filter((p) => {
    const matchesSearch =
      !searchFilter.trim() ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.author.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesLang =
      selectedLanguage === "ALL" ||
      (selectedLanguage === "bm" && (p.language.includes("Bamanankan") || p.language.includes("BM"))) ||
      (selectedLanguage === "fr" && (p.language.includes("FranÃ§ais") || p.language.includes("FR")));
    return matchesSearch && matchesLang;
  });

  return (
    <div className="p-4 md:p-8 w-full space-y-8 animate-fade-in text-white select-none">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C180E] border border-[#FFBF00]/30 text-[#FFBF00] text-xs font-bold uppercase tracking-wider">
          <Mic className="w-3.5 h-3.5" />
          <span>CATALOGUE OFFICIEL</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-black text-white">
          Tous les Podcasts & Ã‰missions
        </h1>
        <p className="text-xs md:text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
          DÃ©couvrez la collection complÃ¨te des sÃ©ries audio et dÃ©bats enregistrÃ©s Ã  Bamako et dans toute la sous-rÃ©gion.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#757575] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrer les Ã©missions..."
              className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#757575] text-xs rounded-xl py-2 pl-9 pr-4 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setSelectedLanguage("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === "ALL" ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-[#888888] hover:text-white"
              }`}
            >
              Toutes les langues
            </button>
            <button
              onClick={() => setSelectedLanguage("bm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === "bm" ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-[#888888] hover:text-white"
              }`}
            >
              ðŸ‡²ðŸ‡± Bamanankan
            </button>
            <button
              onClick={() => setSelectedLanguage("fr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === "fr" ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-[#888888] hover:text-white"
              }`}
            >
              ðŸ‡«ðŸ‡· FranÃ§ais
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Podcasts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filtered.map((podcast) => (
          <Link
            key={podcast.id}
            href={`/podcasts/${podcast.slug}`}
            className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 flex flex-col gap-3 transition-all group shadow"
          >
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#282828] bg-[#0E0E0E]">
              <Image src={podcast.cover} alt={podcast.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
              <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 text-[10px] text-white font-semibold px-2 py-0.5 rounded border border-[#333333]">
                {podcast.badge}
              </span>
              <span className="absolute bottom-2 right-2 bg-[#0B0B0B]/90 text-[10px] text-[#FFBF00] font-bold px-2 py-0.5 rounded border border-[#333333]">
                {podcast.language}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                {podcast.name}
              </h2>
              <p className="text-xs text-[#757575]">{podcast.author}</p>
              <p className="text-xs text-[#B8B8B8] line-clamp-2 mt-1 leading-relaxed">
                {podcast.description}
              </p>
              <p className="text-[11px] text-[#FFBF00] pt-2 font-medium">
                {podcast.episodesCount} Ã©pisodes disponibles
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

