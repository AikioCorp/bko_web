"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Radio, Mic, Heart, Play, ShieldAlert, CheckCircle, AlertCircle, X, ExternalLink } from "lucide-react";

export default function PublicPodcastDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [podcast, setPodcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal de revendication (Claim)
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [proofDescription, setProofDescription] = useState("");
  const [proofDocumentUrl, setProofDocumentUrl] = useState("");
  const [claimStatus, setClaimStatus] = useState<{ success?: boolean; message?: string }>({});
  const [submittingClaim, setSubmittingClaim] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/podcasts/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPodcast(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimStatus({});
    setSubmittingClaim(true);

    const token = localStorage.getItem("bko_access_token");
    if (!token) {
      setClaimStatus({ success: false, message: "Veuillez vous connecter pour revendiquer ce podcast." });
      setSubmittingClaim(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/podcasts/${podcast.id}/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofDescription,
          proofDocumentUrl: proofDocumentUrl || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setClaimStatus({ success: true, message: "Votre demande de revendication a été envoyée. L'équipe éditoriale va l'examiner sous 24h." });
        setTimeout(() => setIsClaimModalOpen(false), 3000);
      } else {
        setClaimStatus({ success: false, message: json.message || "Impossible de soumettre la demande." });
      }
    } catch (err) {
      setClaimStatus({ success: false, message: "Erreur réseau." });
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement du podcast...</div>;

  if (!podcast) {
    return <div className="p-12 text-center text-gray-400">Podcast introuvable.</div>;
  }

  const isUnclaimed = podcast.ownershipStatus === "UNCLAIMED";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Banner & Hero Podcast */}
      <div className="relative bg-[#121722] border border-[#1E2638] rounded-3xl overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <img src={podcast.cover} alt={podcast.name} className="w-44 h-44 rounded-2xl object-cover border border-[#1E2638] shadow-2xl shrink-0" />

        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
              {podcast.country?.flagEmoji} {podcast.countryId}
            </span>
            <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase">
              {podcast.primaryLanguage?.nativeName || podcast.primaryLanguageCode}
            </span>
            {isUnclaimed && (
              <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase flex items-center space-x-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Non revendiqué</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white">{podcast.name}</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">{podcast.description}</p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <button className="bg-[#E5A93C] text-black hover:bg-[#F5B82E] px-6 py-3 rounded-xl text-xs font-black flex items-center space-x-2 transition shadow-lg">
              <Play className="w-4 h-4 fill-current" />
              <span>Écouter le dernier épisode</span>
            </button>

            <button className="bg-[#1A2130] text-gray-200 border border-[#1E2638] hover:border-[#E5A93C]/50 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Suivre</span>
            </button>

            {/* CTA Discret de revendication si le podcast est UNCLAIMED */}
            {isUnclaimed && (
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="text-xs text-amber-400/80 hover:text-amber-400 border border-amber-500/30 hover:border-amber-500/60 px-4 py-3 rounded-xl transition flex items-center space-x-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Vous êtes l'auteur de ce podcast ? Revendiquez-le</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Liste des Épisodes */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white">Épisodes</h2>
        <div className="space-y-3">
          {podcast.episodes?.map((ep: any) => (
            <div key={ep.id} className="bg-[#121722] border border-[#1E2638] hover:border-[#E5A93C]/40 rounded-2xl p-4 flex items-center justify-between transition group">
              <div className="flex items-center space-x-4">
                <button className="w-10 h-10 rounded-full bg-[#E5A93C]/10 text-[#E5A93C] group-hover:bg-[#E5A93C] group-hover:text-black flex items-center justify-center transition">
                  <Play className="w-4 h-4 fill-current" />
                </button>
                <div>
                  <h3 className="font-extrabold text-white text-sm group-hover:text-[#E5A93C] transition">{ep.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-1">{ep.description}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-gray-500">{ep.durationSeconds}s</span>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE REVENDICATION (CLAIM) */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-[#1E2638] rounded-3xl max-w-lg w-full p-6 space-y-6 relative shadow-2xl">
            <button
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
                REVENDICATION DE PROPRIÉTÉ
              </span>
              <h3 className="text-xl font-black text-white">Revendiquer "{podcast.name}"</h3>
              <p className="text-xs text-gray-400">
                Prouvez que vous êtes le créateur ou le producteur légitime de cette émission pour en obtenir le contrôle exclusif dans votre Espace Créateur.
              </p>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-gray-300">Expliquez votre lien avec le podcast & preuve</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: Je suis l'animateur principal. Mon adresse email est présente dans le flux RSS / sur notre site officiel..."
                  value={proofDescription}
                  onChange={(e) => setProofDescription(e.target.value)}
                  className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-300">Lien vers une preuve ou document (facultatif)</label>
                <input
                  type="url"
                  placeholder="https://votre-site.com/verification"
                  value={proofDocumentUrl}
                  onChange={(e) => setProofDocumentUrl(e.target.value)}
                  className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
                />
              </div>

              {claimStatus.message && (
                <div
                  className={`p-3 rounded-xl border flex items-center space-x-2 text-xs ${
                    claimStatus.success
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {claimStatus.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{claimStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E2638] text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="bg-[#E5A93C] text-black hover:bg-[#F5B82E] px-6 py-2 rounded-xl font-bold transition disabled:opacity-50"
                >
                  {submittingClaim ? "Envoi..." : "Envoyer ma revendication"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
