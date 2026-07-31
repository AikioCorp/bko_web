"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Tag } from "lucide-react";

export default function TopicDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [topic, setTopic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/topics/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTopic(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement du sujet...</div>;
  if (!topic) return <div className="p-8 text-center text-gray-400">Sujet non trouvé.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#E5A93C]/10 text-[#E5A93C] px-3 py-1 rounded-full text-xs font-semibold">
          <Tag className="w-3.5 h-3.5" />
          <span>Sujet / Topic</span>
        </div>
        <h1 className="text-3xl font-black text-white">#{topic.name}</h1>
        <p className="text-gray-400 text-sm">{topic.description}</p>
        {topic.aliases?.length > 0 && (
          <div className="flex items-center space-x-2 pt-2 text-xs">
            <span className="text-gray-400">Alias & Variantes Bamanankan :</span>
            {topic.aliases.map((a: any) => (
              <span key={a.id} className="bg-[#E5A93C]/10 text-[#E5A93C] px-2 py-0.5 rounded-full border border-[#E5A93C]/30 font-semibold">
                {a.alias}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topic.podcasts?.map((pt: any) => {
          const p = pt.podcast;
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
