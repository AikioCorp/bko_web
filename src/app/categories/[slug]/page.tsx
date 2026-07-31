"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Grid, Play } from "lucide-react";

export default function CategoryDetailPage() {
  const params = useParams();
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

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement de la catégorie...</div>;
  if (!category) return <div className="p-8 text-center text-gray-400">Catégorie non trouvée.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#E5A93C]/10 text-[#E5A93C] px-3 py-1 rounded-full text-xs font-semibold">
          <Grid className="w-3.5 h-3.5" />
          <span>Catégorie</span>
        </div>
        <h1 className="text-3xl font-black text-white">{category.name}</h1>
        <p className="text-gray-400 text-sm">{category.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {category.podcasts?.map((pc: any) => {
          const p = pc.podcast;
          return (
            <div key={p.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 hover:border-[#E5A93C] transition">
              <div className="flex items-center space-x-4">
                <img src={p.cover} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-[#E5A93C]/30" />
                <div>
                  <a href={`/podcasts/${p.slug}`} className="font-bold text-white hover:text-[#E5A93C] transition block">
                    {p.name}
                  </a>
                  <p className="text-xs text-gray-400">{p.country?.name} • {p.primaryLanguage?.name}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-3 line-clamp-2">{p.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
