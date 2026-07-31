"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { User, Mic } from "lucide-react";

export default function PublicPersonPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/search?q=${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.people?.length > 0) {
          setPerson(json.data.people[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement de la fiche personne...</div>;
  if (!person) return <div className="p-12 text-center text-gray-400">Personne non trouvée.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-4">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-[#E5A93C]/20 text-[#E5A93C] rounded-full flex items-center justify-center font-black text-2xl border border-[#E5A93C]/40">
            {person.name[0]}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">{person.name}</h1>
            <p className="text-xs text-gray-400 mt-1">Intervenant / Animateur / Invité</p>
            <p className="text-xs text-gray-300 mt-2">{person.bio || "Personnalité publique et intervenant média."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
