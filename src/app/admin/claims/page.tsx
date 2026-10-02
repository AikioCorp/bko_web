"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, X, FileText, User, Radio, ExternalLink } from "lucide-react";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const fetchClaims = () => {
    const token = getAccessToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/admin/claims`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setClaims(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleReview = async (claimId: string, status: "APPROVED" | "REJECTED") => {
    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/admin/claims/${claimId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          reviewNotes: reviewNotes[claimId] || "",
        }),
      });
      fetchClaims();
    } catch (e) {}
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement des revendications...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <div className="flex items-center space-x-2 text-[#E5A93C]">
          <ShieldCheck className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Modération des Propriétés</span>
        </div>
        <h1 className="text-3xl font-black text-white">Revendications de Podcasts (Claims)</h1>
        <p className="text-xs text-gray-400">
          Examinez les preuves soumises par les podcasteurs pour revendiquer la gestion d'un podcast non revendiqué (UNCLAIMED). L'approbation transfère automatiquement les droits au créateur.
        </p>
      </div>

      <div className="space-y-4">
        {claims.length === 0 ? (
          <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-12 text-center text-gray-400 text-xs">
            Aucune revendication en attente d'examen.
          </div>
        ) : (
          claims.map((claim) => (
            <div key={claim.id} className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-[#1E2638] pb-4">
                <div className="flex items-center space-x-4">
                  {claim.podcast.cover && (
                    <img src={claim.podcast.cover} alt={claim.podcast.name} className="w-14 h-14 rounded-xl object-cover border border-[#1E2638]" />
                  )}
                  <div>
                    <span className="text-[10px] text-[#E5A93C] font-bold uppercase">{claim.podcast.countryId} • {claim.podcast.ownershipStatus}</span>
                    <h3 className="font-extrabold text-white text-base">{claim.podcast.name}</h3>
                    <p className="text-xs text-gray-400">Demandé le {new Date(claim.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    claim.status === "APPROVED"
                      ? "bg-green-500/10 text-green-400 border border-green-500/30"
                      : claim.status === "REJECTED"
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : "bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30"
                  }`}
                >
                  {claim.status}
                </span>
              </div>

              {/* Détails du Demandeur et de la Preuve */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-2">
                  <div className="flex items-center space-x-2 text-gray-400 font-bold">
                    <User className="w-4 h-4 text-[#E5A93C]" />
                    <span>Demandeur</span>
                  </div>
                  <p className="text-white font-extrabold">{claim.user?.fullName}</p>
                  <p className="text-gray-400 font-mono">{claim.user?.email}</p>
                </div>

                <div className="bg-[#0A0D14] p-4 rounded-xl border border-[#1E2638] space-y-2">
                  <div className="flex items-center space-x-2 text-gray-400 font-bold">
                    <FileText className="w-4 h-4 text-[#E5A93C]" />
                    <span>Preuve چهار de Propriété ({claim.verificationMethod})</span>
                  </div>
                  <p className="text-gray-300 italic">{claim.proofDescription}</p>
                  {claim.proofDocumentUrl && (
                    <a
                      href={claim.proofDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#E5A93C] hover:underline flex items-center space-x-1 font-bold pt-1"
                    >
                      <span>Voir la pièce justificative</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Zone d'action Admin */}
              {claim.status === "PENDING" || claim.status === "UNDER_REVIEW" ? (
                <div className="space-y-3 pt-2 border-t border-[#1E2638]">
                  <textarea
                    placeholder="Notes internes de modération (facultatif)..."
                    value={reviewNotes[claim.id] || ""}
                    onChange={(e) => setReviewNotes({ ...reviewNotes, [claim.id]: e.target.value })}
                    className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
                  />

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleReview(claim.id, "REJECTED")}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <X className="w-4 h-4" />
                      <span>Rejeter la demande</span>
                    </button>

                    <button
                      onClick={() => handleReview(claim.id, "APPROVED")}
                      className="bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approuver & Transférer la Propriété</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
