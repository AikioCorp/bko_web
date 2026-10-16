"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { uploadImage } from "@/components/studio/bits";
import { useRouter } from "next/navigation";
import { ArrowRight, Image as ImageIcon, UploadCloud } from "lucide-react";

export default function NewPodcastPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [format, setFormat] = useState<"AUDIO" | "VIDEO" | "AUDIO_AND_VIDEO">("AUDIO_AND_VIDEO");
  const [countryId, setCountryId] = useState("");
  const [countries, setCountries] = useState<Array<{ id: string; name: string }>>([]);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    fetchApi("/countries")
      .then((res) => setCountries(res.data || []))
      .catch(() => setError("Impossible de charger les pays. Rechargez la page."));
  }, []);

  const [primaryLanguageCode, setPrimaryLanguageCode] = useState("fr");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploadingCover(true);
    try {
      const publicUrl = await uploadImage(file, "covers");
      setCover(publicUrl);
    } catch (err: any) {
      setError(err.message || "Impossible de téléverser l'image de couverture.");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploadingCover) return;
    if (!countryId) {
      setError("Choisissez le pays de votre émission.");
      return;
    }
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
          name: name.trim(),
          description: description.trim(),
          cover: cover.trim(),
          format,
          status: "DRAFT",
          countryId,
          primaryLanguageCode,
        }),
      });
      const json = await res.json();

      if (json.success) {
        router.push(`/studio/podcasts/${json.data.id}`);
      } else {
        setError(json.error?.message || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-4">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="space-y-1 border-b border-[#1E2638] pb-4">
          <span className="text-[#E5A93C] text-[10px] font-bold uppercase tracking-wider">Créer une Émission</span>
          <h1 className="text-2xl font-black text-white">Nouveau Podcast</h1>
          <p className="text-xs text-gray-400">Renseignez les détails principaux de votre émission.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="podcast-country" className="block text-xs font-bold text-gray-300 mb-1">
              Pays de l’émission *
            </label>
            <select
              id="podcast-country"
              value={countryId}
              required
              onChange={(e) => setCountryId(e.target.value)}
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            >
              <option value="">Choisir un pays</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

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
              placeholder="Présentez les thèmes abordés dans votre émission..."
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Pochette de l&apos;émission (Image ou URL)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cover}
                  onChange={(e) => setCover(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 pl-10 pr-4 text-xs text-white outline-none focus:border-[#E5A93C]"
                />
                <ImageIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              </div>
              <label className="bg-[#1A2234] hover:bg-[#222C42] border border-[#2D3952] text-white px-4 py-3 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2 shrink-0">
                <UploadCloud className="w-4 h-4 text-[#E5A93C]" />
                <span>{uploadingCover ? "Téléversement..." : "Téléverser une image"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverFile}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Format de l&apos;émission</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              >
                <option value="AUDIO_AND_VIDEO">Audio & Vidéo</option>
                <option value="AUDIO">Audio uniquement</option>
                <option value="VIDEO">Vidéo uniquement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Langue Principale</label>
              <select
                value={primaryLanguageCode}
                onChange={(e) => setPrimaryLanguageCode(e.target.value)}
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-[#E5A93C]"
              >
                <option value="fr">Français</option>
                <option value="bm">Bamanankan (Bambara)</option>
                <option value="ff">Foulfouldé (Peul)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingCover}
            className="w-full bg-[#E5A93C] text-black font-extrabold py-3.5 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? "Création..." : "ENREGISTRER LE PODCAST"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
