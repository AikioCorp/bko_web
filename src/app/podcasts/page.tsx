"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useSWR from "swr";
import { Mic, Search, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";
import SuggestBanner from "@/components/ui/SuggestBanner";

const fetcher = (url: string) => fetchApi(url).then((r) => r.data);

export default function PodcastsCatalogPage() {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");

  const { data, isLoading, error } = useSWR("/podcasts?limit=60", fetcher);

  const catalogPodcasts = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const filtered = catalogPodcasts.filter((p: any) => {
    const q = searchFilter.trim().toLowerCase();
    const authorName = p.organization?.name || p.country?.name || "";
    const matchesSearch =
      !q ||
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      authorName.toLowerCase().includes(q);
    const langCode = (p.primaryLanguageCode || p.primaryLanguage?.code || "").toLowerCase();
    const hasSecondaryLang = Array.isArray(p.secondaryLanguages) && p.secondaryLanguages.some((sl: any) => (sl.languageCode || "").toLowerCase() === selectedLanguage);
    const matchesLang =
      selectedLanguage === "ALL" ||
      langCode === selectedLanguage ||
      hasSecondaryLang;
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
          Tous les Podcasts & Émissions
        </h1>
        <p className="text-xs md:text-sm text-[#B8B8B8] max-w-2xl leading-relaxed">
          Découvrez la collection complète des séries audio et débats enregistrés à Bamako et dans toute la sous-région.
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
              placeholder="Filtrer les émissions..."
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
              🇲🇱 Bamanankan
            </button>
            <button
              onClick={() => setSelectedLanguage("fr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === "fr" ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-[#888888] hover:text-white"
              }`}
            >
              🇫🇷 Français
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Podcasts */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#888888] gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[#FFBF00]" />
          <span className="text-sm">Chargement du catalogue...</span>
        </div>
      ) : error ? (
        <div className="bg-[#141414] border border-red-900/40 rounded-2xl p-8 text-center text-sm text-red-400">
          Impossible de charger les podcasts pour le moment.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#242424] rounded-2xl p-10 text-center text-sm text-[#888888]">
          Aucun podcast ne correspond à vos critères.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filtered.map((podcast: any) => {
            const badgeLabel = podcast.categories?.[0]?.category?.name || "Podcast";
            const languageLabel = podcast.primaryLanguage?.nativeName || podcast.primaryLanguage?.name || podcast.primaryLanguageCode || "FR";
            const authorLabel = podcast.organization?.name || podcast.country?.name || "Bamako Podcast";
            const episodesCount = podcast._count?.episodes ?? 0;
            const coverSrc = podcast.cover || "/images/default-cover.jpg";

            return (
              <Link
                key={podcast.id}
                href={`/podcasts/${podcast.slug}`}
                className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] hover:border-[#383838] rounded-2xl p-4 flex flex-col gap-3 transition-all group shadow"
              >
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#282828] bg-[#0E0E0E]">
                  <Image unoptimized src={coverSrc} alt={podcast.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 bg-[#0B0B0B]/90 text-[10px] text-white font-semibold px-2 py-0.5 rounded border border-[#333333]">
                    {badgeLabel}
                  </span>
                  <span className="absolute bottom-2 right-2 bg-[#0B0B0B]/90 text-[10px] text-[#FFBF00] font-bold px-2 py-0.5 rounded border border-[#333333]">
                    {languageLabel}
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-white truncate group-hover:text-[#FFBF00] transition-colors">
                    {podcast.name}
                  </h2>
                  <p className="text-xs text-[#757575]">{authorLabel}</p>
                  <p className="text-xs text-[#B8B8B8] line-clamp-2 mt-1 leading-relaxed">
                    {podcast.shortDescription || podcast.description}
                  </p>
                  <p className="text-[11px] text-[#FFBF00] pt-2 font-medium">
                    {episodesCount} épisode{episodesCount > 1 ? "s" : ""} disponible{episodesCount > 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-12">
        <SuggestBanner />
      </div>
    </div>
  );
}
