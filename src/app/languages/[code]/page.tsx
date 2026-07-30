"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Languages } from "lucide-react";

export default function LanguageDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [language, setLanguage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/languages/${code}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setLanguage(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement des podcasts...</div>;
  if (!language) return <div className="p-8 text-center text-gray-400">Langue non trouvée.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#E5A93C]/10 text-[#E5A93C] px-3 py-1 rounded-full text-xs font-semibold">
          <Languages className="w-3.5 h-3.5" />
          <span>Filtre Langue</span>
        </div>
        <h1 className="text-3xl font-black text-white">Podcasts en {language.name} ({language.nativeName})</h1>
        <p className="text-gray-400 text-sm">
          Toutes les émissions diffusées principalement en {language.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {language.primaryPodcasts?.map((p: any) => (
          <div key={p.id} className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 hover:border-[#E5A93C] transition">
            <div className="flex items-center space-x-4">
              <img src={p.cover} alt={p.name} className="w-16 h-16 rounded-lg object-cover border border-[#E5A93C]/30" />
              <div>
                <a href={`/podcasts/${p.slug}`} className="font-bold text-white hover:text-[#E5A93C] transition block">
                  {p.name}
                </a>
                <p className="text-xs text-gray-400">{p.country?.name} • {language.name}</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 mt-3 line-clamp-2">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
