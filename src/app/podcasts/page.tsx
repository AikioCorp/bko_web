"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Mic, Search, Filter, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { PodcastCardStandard, PodcastItem, CategoryChip } from "../../components/ui/Cards";

export default function PodcastsCatalogPage() {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [sortBy, setSortBy] = useState<"POPULAR" | "NEWEST" | "ALPHA">("POPULAR");

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/podcasts")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setPodcasts(json.data);
        }
      })
      .catch((err) => console.error("Erreur Podcasts API:", err))
      .finally(() => setLoading(false));
  }, []);

  const fallbackPodcasts: PodcastItem[] = [
    {
      id: "p1",
      name: "Voix de Bamako",
      slug: "voix-de-bamako",
      organization: { name: "Studio Bamako Podcast" },
      cover: "/brand/logo.webp",
      countryId: "ML",
      primaryLanguageCode: "bm",
      description: "Le podcast référence sur l'entrepreneuriat, la société et la culture malienne.",
    },
    {
      id: "p2",
      name: "Bamako Tech Talk",
      slug: "bamako-tech-talk",
      organization: { name: "Mali Digital Hub" },
      cover: "/brand/logo.webp",
      countryId: "ML",
      primaryLanguageCode: "fr",
      description: "L'actualité du numérique, de l'innovation et des startups au Mali.",
    },
    {
      id: "p3",
      name: "Histoires & Terroirs",
      slug: "histoires-et-terroirs",
      organization: { name: "Culture Mali" },
      cover: "/brand/logo.webp",
      countryId: "ML",
      primaryLanguageCode: "bm",
      description: "Récits historiques, traditions et contes du terroir malien.",
    },
    {
      id: "p4",
      name: "Femmes d'Impact Mali",
      slug: "femmes-dimpact",
      organization: { name: "Réseau Lead-Her" },
      cover: "/brand/logo.webp",
      countryId: "ML",
      primaryLanguageCode: "fr",
      description: "Portraits de femmes leaders, entrepreneures et actrices du changement.",
    },
    {
      id: "p5",
      name: "Savoirs en Bamanankan",
      slug: "savoirs-bamanankan",
      organization: { name: "Institut des Langues" },
      cover: "/brand/logo.webp",
      countryId: "ML",
      primaryLanguageCode: "bm",
      description: "Vulgarisation scientifique et culturelle directement en langue Bamanankan.",
    },
    {
      id: "p6",
      name: "Teranga Business",
      slug: "teranga-business",
      organization: { name: "Dakar Media" },
      cover: "/brand/logo.webp",
      countryId: "SN",
      primaryLanguageCode: "fr",
      description: "Économie et opportunités d'affaires au Sénégal et en Afrique de l'Ouest.",
    },
  ];

  const displayPodcasts = podcasts.length > 0 ? podcasts : fallbackPodcasts;

  // Filtering
  const filteredPodcasts = displayPodcasts.filter((p) => {
    const matchesQuery =
      !searchFilter.trim() ||
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.organization?.name?.toLowerCase().includes(searchFilter.toLowerCase());

    const matchesLanguage = selectedLanguage === "ALL" || p.primaryLanguageCode === selectedLanguage;
    const matchesCountry = selectedCountry === "ALL" || p.countryId === selectedCountry;

    return matchesQuery && matchesLanguage && matchesCountry;
  });

  // Sorting
  const sortedPodcasts = [...filteredPodcasts].sort((a, b) => {
    if (sortBy === "ALPHA") return a.name.localeCompare(b.name);
    return 0; // Default order
  });

  return (
    <div className="bko-container py-8 space-y-10 animate-fade-in">
      {/* Catalog Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6B009]/10 border border-[#E6B009]/30 text-[#E6B009] text-xs font-bold uppercase tracking-wider">
          <Mic className="w-3.5 h-3.5" />
          <span>CATALOGUE MÉDIA</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#F0F6FC]">Tous les Podcasts</h1>
        <p className="text-xs md:text-sm text-[#8B949E] max-w-2xl leading-relaxed">
          Parcourez l'ensemble des émissions disponibles sur Bko Podcast. Filtrez par langue, origine ou recherchez une émission spécifique.
        </p>
      </div>

      {/* Filter Bar & Controls */}
      <div className="bg-[#161B22] border border-[#21262D] rounded-2xl p-4 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          {/* Search Input in Catalog */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8B949E] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrer les émissions..."
              className="w-full bg-[#0B0F17] border border-[#21262D] focus:border-[#30363D] text-[#F0F6FC] placeholder-[#6E7681] text-xs rounded-xl py-2 pl-9 pr-4 outline-none transition-colors"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SlidersHorizontal className="w-4 h-4 text-[#8B949E]" />
            <span className="text-xs text-[#8B949E] shrink-0">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#0B0F17] border border-[#21262D] text-[#F0F6FC] text-xs rounded-xl py-2 px-3 outline-none"
            >
              <option value="POPULAR">Plus Populaires</option>
              <option value="NEWEST">Plus Récents</option>
              <option value="ALPHA">Ordre Alphabétique</option>
            </select>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#21262D]">
          <span className="text-[11px] font-bold text-[#8B949E] self-center mr-1">Langues :</span>
          <CategoryChip label="Toutes" active={selectedLanguage === "ALL"} onClick={() => setSelectedLanguage("ALL")} />
          <CategoryChip label="🇲🇱 Bamanankan" active={selectedLanguage === "bm"} onClick={() => setSelectedLanguage("bm")} />
          <CategoryChip label="🇫🇷 Français" active={selectedLanguage === "fr"} onClick={() => setSelectedLanguage("fr")} />

          <span className="text-[11px] font-bold text-[#8B949E] self-center ml-3 mr-1">Pays :</span>
          <CategoryChip label="Tous" active={selectedCountry === "ALL"} onClick={() => setSelectedCountry("ALL")} />
          <CategoryChip label="🇲🇱 Mali" active={selectedCountry === "ML"} onClick={() => setSelectedCountry("ML")} />
          <CategoryChip label="🇸🇳 Sénégal" active={selectedCountry === "SN"} onClick={() => setSelectedCountry("SN")} />
        </div>
      </div>

      {/* Catalog Grid */}
      {sortedPodcasts.length === 0 ? (
        <div className="text-center py-16 bg-[#161B22] border border-[#21262D] rounded-2xl p-8 space-y-3">
          <p className="text-sm font-bold text-[#F0F6FC]">Aucun podcast ne correspond à vos filtres</p>
          <p className="text-xs text-[#8B949E]">Essayez de réinitialiser la recherche ou les filtres de langue.</p>
          <button
            onClick={() => {
              setSearchFilter("");
              setSelectedLanguage("ALL");
              setSelectedCountry("ALL");
            }}
            className="px-4 py-2 bg-[#E6B009] text-[#0B0F17] font-bold text-xs rounded-xl hover:bg-[#F5B82E] transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedPodcasts.map((podcast) => (
            <PodcastCardStandard key={podcast.id} podcast={podcast} />
          ))}
        </div>
      )}
    </div>
  );
}
