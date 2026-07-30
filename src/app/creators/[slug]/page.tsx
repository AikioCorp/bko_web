"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User, Globe, CheckCircle } from "lucide-react";

export default function PublicCreatorProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/creators/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setCreator(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement du profil créateur...</div>;
  if (!creator) return <div className="p-12 text-center text-gray-400">Créateur non trouvé.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-4">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 bg-[#E5A93C] rounded-full flex items-center justify-center font-black text-black text-4xl shadow-xl">
            {creator.displayName[0]}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-black text-white">{creator.displayName}</h1>
              {creator.isVerified && <CheckCircle className="w-6 h-6 text-[#E5A93C] fill-current" />}
            </div>
            <p className="text-xs text-gray-400 mt-1">{creator.country?.name} • Créateur Officiel</p>
            <p className="text-xs text-gray-300 mt-3 max-w-xl">{creator.bio}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
