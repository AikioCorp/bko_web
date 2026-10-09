"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, ArrowRight, Image as ImageIcon } from "lucide-react";

export default function NewPodcastPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [countryId, setCountryId] = useState("ML");
  const [primaryLanguageCode, setPrimaryLanguageCode] = useState("fr");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token = getAccessToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/creator/podcasts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          cover: cover || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=600&auto=format&fit=crop",
          countryId,
          primaryLanguageCode,
        }),
      });
      const json = await res.json();

      if (json.success) {
        router.push(`/studio/podcasts/${json.data.id}`);
      } else {
        setError(json.error?.message || "Erreur lors de la crÃ©ation");
      }
    } catch (err) {
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="space-y-1 border-b border-[#1E2638] pb-4">
          <span className="text-[#E5A93C] text-[10px] font-bold uppercase tracking-wider">CrÃ©er une Ã‰mission</span>
          <h1 className="text-2xl font-black text-white">Nouveau Podcast</h1>
          <p className="text-xs text-gray-400">Renseignez les dÃ©tails principaux de votre Ã©mission.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Nom du Podcast *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Voix de Bamako"
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Description *</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="PrÃ©sentez les thÃ¨mes abordÃ©s dans votre Ã©mission..."
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">URL Cover / Pochettte Image</label>
            <div className="relative">
              <input
                type="text"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              />
              <ImageIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Pays d'origine</label>
              <select
                value={countryId}
                onChange={(e) => setCountryId(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              >
                <option value="ML">ðŸ‡²ðŸ‡± Mali</option>
                <option value="SN">ðŸ‡¸ðŸ‡³ SÃ©nÃ©gal</option>
                <option value="CI">ðŸ‡¨ðŸ‡® CÃ´te d'Ivoire</option>
                <option value="BF">ðŸ‡§ðŸ‡« Burkina Faso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Langue Principale</label>
              <select
                value={primaryLanguageCode}
                onChange={(e) => setPrimaryLanguageCode(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              >
                <option value="fr">FranÃ§ais</option>
                <option value="bm">Bamanankan (Bambara)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E5A93C] text-black font-extrabold py-3.5 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg flex items-center justify-center space-x-2"
          >
            <span>{loading ? "CrÃ©ation..." : "ENREGISTRER LE PODCAST"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

