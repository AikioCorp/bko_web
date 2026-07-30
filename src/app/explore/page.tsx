"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Globe, Languages, Grid, Tag, Sparkles, ArrowRight } from "lucide-react";
import { CategoryCard, PodcastCardStandard } from "../../components/ui/Cards";

export default function ExplorePage() {
  const [exploreData, setExploreData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/explore")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setExploreData(json.data);
      })
      .catch((err) => console.error("Erreur Explore API:", err))
      .finally(() => setLoading(false));
  }, []);

  const fallbackCountries = [
    { code: "ML", name: "Mali", flagEmoji: "🇲🇱", count: 24, isPrimary: true },
    { code: "SN", name: "Sénégal", flagEmoji: "🇸🇳", count: 8, isPrimary: false },
    { code: "CI", name: "Côte d'Ivoire", flagEmoji: "🇨🇮", count: 12, isPrimary: false },
    { code: "FR", name: "France & Diaspora", flagEmoji: "🇫🇷", count: 15, isPrimary: false },
  ];

  const fallbackCategories = [
    { name: "Business & Économie", slug: "business", icon: "💼", count: 18 },
    { name: "Culture & Société", slug: "culture", icon: "🌍", count: 24 },
    { name: "Innovation & Tech", slug: "tech", icon: "⚡", count: 14 },
    { name: "Musique & Arts", slug: "musique", icon: "🎵", count: 30 },
    { name: "Actualité & Débats", slug: "actualite", icon: "🗣️", count: 21 },
    { name: "Agriculture & Terroir", slug: "agriculture", icon: "🌱", count: 12 },
  ];

  const fallbackLanguages = [
    { code: "bm", name: "Bamanankan", nativeName: "Bamanankan", count: 22 },
    { code: "fr", name: "Français", nativeName: "Français", count: 35 },
    { code: "ff", name: "Fulfulde / Peul", nativeName: "Fulfulde", count: 8 },
    { code: "wo", name: "Wolof", nativeName: "Wolof", count: 6 },
  ];

  const fallbackTopics = [
    { name: "Entrepreneuriat", slug: "entrepreneuriat", alias: "Sɔrɔtan" },
    { name: "AgriTech", slug: "agritech", alias: "Sɛnɛ-Trɔfɛ" },
    { name: "Digital Mali", slug: "digital-mali", alias: "Numɛriki" },
    { name: "Patrimoine & Histoire", slug: "histoire", alias: "Tariku" },
    { name: "Éducation & Jeunesse", slug: "jeunesse", alias: "Kalansa" },
  ];

  return (
    <div className="bko-container py-8 space-y-12 animate-fade-in">
      {/* Header Explore Center */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6B009]/10 border border-[#E6B009]/30 text-[#E6B009] text-xs font-bold uppercase tracking-wider">
          <Compass className="w-3.5 h-3.5" />
          <span>CENTRE D'EXPLORATION</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-[#F0F6FC]">Découvrir par Thématique & Territoire</h1>
        <p className="text-xs md:text-sm text-[#8B949E] leading-relaxed">
          Naviguez dans le catalogue des podcasts du Mali et d'Afrique par pays, langue parlée, thématique et mots-clés.
        </p>
      </div>

      {/* 1. Navigation par Pays (Mali First) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#E6B009]" />
          <h2 className="text-xl font-black text-[#F0F6FC]">Par Pays (Mali First)</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(exploreData?.countries || fallbackCountries).map((c: any) => (
            <Link
              key={c.code || c.id}
              href={`/countries/${c.code}`}
              className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                c.code === "ML" || c.isPrimary
                  ? "bg-[#161B22] border-[#E6B009] shadow-lg"
                  : "bg-[#161B22] border-[#21262D] hover:border-[#30363D]"
              }`}
            >
              <span className="text-4xl">{c.flagEmoji || "🌍"}</span>
              <span className="font-bold text-sm text-[#F0F6FC]">{c.name}</span>
              <span className="text-[10px] text-[#8B949E] font-semibold">
                {c._count?.podcasts || c.count || 0} Émissions
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. Navigation par Catégories */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-[#E6B009]" />
          <h2 className="text-xl font-black text-[#F0F6FC]">Par Catégorie & Domaine</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {fallbackCategories.map((cat) => (
            <CategoryCard key={cat.slug} name={cat.name} slug={cat.slug} icon={cat.icon} count={cat.count} />
          ))}
        </div>
      </section>

      {/* 3. Navigation par Langue */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-[#E6B009]" />
          <h2 className="text-xl font-black text-[#F0F6FC]">Par Langue d'Expression</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fallbackLanguages.map((lang) => (
            <Link
              key={lang.code}
              href={`/languages/${lang.code}`}
              className="p-4 rounded-2xl bg-[#161B22] border border-[#21262D] hover:border-[#E6B009] transition-all flex items-center justify-between group"
            >
              <div>
                <h4 className="font-bold text-sm text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors">
                  {lang.name}
                </h4>
                <p className="text-xs text-[#8B949E]">{lang.nativeName}</p>
              </div>
              <span className="text-xs font-mono text-[#E6B009] bg-[#E6B009]/10 border border-[#E6B009]/30 px-2 py-1 rounded-full font-bold">
                {lang.count} podcasts
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Sujets & Mots-clés Phares */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-[#E6B009]" />
          <h2 className="text-xl font-black text-[#F0F6FC]">Sujets & Mots-clés Phares</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {fallbackTopics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              className="bg-[#161B22] border border-[#21262D] hover:border-[#E6B009] px-4 py-2 rounded-xl text-xs text-[#F0F6FC] transition-colors flex items-center gap-2"
            >
              <span className="font-bold text-[#E6B009]">#{topic.name}</span>
              {topic.alias && (
                <span className="text-[10px] text-[#E6B009] bg-[#E6B009]/10 px-2 py-0.5 rounded-full font-semibold">
                  {topic.alias}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
