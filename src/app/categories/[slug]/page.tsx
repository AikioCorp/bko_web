"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Grid, ChevronLeft, Search, Radio } from "lucide-react";
import Link from "next/link";

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCategory(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pb-32 bg-[#0B0B0B] min-h-screen">
        <div className="animate-pulse space-y-12 px-4 md:px-10 pt-8">
          <div className="h-40 bg-[#141414] rounded-2xl w-full border border-[#242424]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-[#1A1A1A] rounded-xl border border-[#242424]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="pb-32 bg-[#0B0B0B] min-h-screen flex flex-col items-center justify-center pt-32">
        <Radio className="w-16 h-16 text-[#FFBF00] opacity-50 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Catégorie introuvable</h2>
        <p className="text-[#808080] mb-6">La catégorie que vous cherchez n'existe pas ou a été supprimée.</p>
        <button 
          onClick={() => router.back()} 
          className="bg-[#141414] hover:bg-[#1A1A1A] border border-[#242424] text-white font-bold py-2 px-6 rounded-full transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="pb-32 bg-[#0B0B0B] min-h-screen text-[#B8B8B8] font-sans">
      <div className="px-4 md:px-10 pt-8 space-y-8">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center text-sm font-bold text-[#808080] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </button>

        {/* Header */}
        <div className="bg-[#141414] border border-[#242424] rounded-2xl p-6 md:p-8 space-y-4">
          <div className="inline-flex items-center space-x-2 bg-[#FFBF00]/10 text-[#FFBF00] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            <Grid className="w-3.5 h-3.5" />
            <span>Catégorie</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">{category.name}</h1>
          <p className="text-[#808080] text-sm md:text-base max-w-2xl">{category.description || `Découvrez tous les podcasts de la catégorie ${category.name}.`}</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              Podcasts disponibles <span className="text-[#808080] text-sm ml-2">({category.podcasts?.length || 0})</span>
            </h2>
          </div>

          {category.podcasts?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {category.podcasts.map((pc: any) => {
                const p = pc.podcast;
                return (
                  <Link 
                    key={p.id} 
                    href={`/podcasts/${p.slug}`}
                    className="group bg-[#141414] border border-[#242424] rounded-xl p-4 hover:bg-[#1A1A1A] hover:border-[#FFBF00]/50 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <img 
                        src={p.cover} 
                        alt={p.name} 
                        className="w-16 h-16 rounded-lg object-cover bg-[#2A2A2A] group-hover:scale-105 transition-transform" 
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white group-hover:text-[#FFBF00] transition-colors truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs text-[#808080] mt-1 truncate">
                          {p.author?.fullName || p.country?.name || 'Indépendant'}
                        </p>
                        {p.primaryLanguage && (
                          <span className="inline-block mt-2 text-[10px] bg-[#2A2A2A] text-[#B8B8B8] px-2 py-0.5 rounded font-bold uppercase">
                            {p.primaryLanguage.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#808080] line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#242424] rounded-2xl p-12 text-center">
              <Search className="w-12 h-12 text-[#333333] mx-auto mb-4" />
              <p className="text-white font-bold mb-2">Aucun podcast</p>
              <p className="text-sm text-[#808080]">Il n'y a pas encore de podcasts dans cette catégorie.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
