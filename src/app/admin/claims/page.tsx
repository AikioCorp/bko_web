"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { ShieldAlert, CheckCircle, XCircle, Clock, Link as LinkIcon, FileText, AtSign, Globe, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminClaimsPage() {
  const [filter, setFilter] = useState("");
  
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: claims, mutate, isLoading } = useSWR(`/admin/claims${filter ? `?status=${filter}` : ""}`, fetcher);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleReview = async (id: string, status: string, notes?: string) => {
    if (!confirm(`Confirmez-vous le passage au statut : ${status} ?`)) return;
    try {
      setProcessingId(id);
      await adminApi(`/admin/claims/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ status, reviewNotes: notes || "" })
      });
      await mutate();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "EMAIL_DOMAIN": return <AtSign className="w-4 h-4 text-blue-500" />;
      case "WEBSITE": return <Globe className="w-4 h-4 text-purple-500" />;
      case "RSS_CHALLENGE": return <Hash className="w-4 h-4 text-orange-500" />;
      case "DOCUMENT": return <FileText className="w-4 h-4 text-gray-500" />;
      default: return <LinkIcon className="w-4 h-4 text-[#888]" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Revendications</h1>
          <p className="text-[#888888]">Traitez les demandes de droits d'auteur sur les podcasts importés.</p>
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-[#111] border border-[#222] rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#FFBF00]"
        >
          <option value="">Toutes les demandes</option>
          <option value="PENDING">En attente</option>
          <option value="UNDER_REVIEW">En cours d'examen</option>
          <option value="APPROVED">Approuvées</option>
          <option value="REJECTED">Rejetées</option>
        </select>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {isLoading && !claims ? (
          <div className="p-12 text-center text-[#888]">Chargement...</div>
        ) : claims?.length === 0 ? (
          <div className="p-12 text-center text-[#888]">
            <ShieldAlert className="w-8 h-8 mx-auto mb-4 text-[#333]" />
            Aucune revendication trouvée.
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {claims?.map((claim: any) => (
              <div key={claim.id} className="p-6 hover:bg-[#161616] transition-colors">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Cible & User */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-4">
                      {claim.podcast?.cover ? (
                        <img src={claim.podcast.cover} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#333]" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-[#222] border border-[#333]" />
                      )}
                      <div>
                        <div className="text-xs text-[#FFBF00] font-bold mb-1 uppercase tracking-wider">Podcast ciblé</div>
                        <h3 className="text-lg font-bold text-white">{claim.podcast?.name || "Podcast inconnu"}</h3>
                        <p className="text-xs text-[#888] font-mono mt-1">ID: {claim.podcast?.id}</p>
                      </div>
                    </div>
                    
                    <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222]">
                      <div className="text-xs text-[#888] font-bold mb-2 uppercase tracking-wider">Demandeur</div>
                      <div className="flex items-center gap-3">
                        {claim.user?.avatar ? (
                          <img src={claim.user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center font-bold text-[#888] text-xs">
                            {claim.user?.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{claim.user?.fullName}</div>
                          <div className="text-xs text-[#888]">{claim.user?.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preuves */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="text-xs text-[#888] font-bold mb-1 uppercase tracking-wider">Méthode</div>
                      <div className="flex items-center gap-2 text-sm text-white font-medium">
                        {getMethodIcon(claim.verificationMethod)}
                        {claim.verificationMethod}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#888] font-bold mb-1 uppercase tracking-wider">Preuve fournie</div>
                      <p className="text-sm text-[#ccc] bg-[#0A0A0A] border border-[#222] p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {claim.proofDescription || "Aucune description fournie."}
                      </p>
                    </div>
                    {claim.proofDocumentUrl && (
                      <div>
                        <a href={claim.proofDocumentUrl} target="_blank" rel="noreferrer" className="text-sm text-[#FFBF00] hover:underline flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" /> Voir le document joint
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-[#222] pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-[#888] font-bold mb-3 uppercase tracking-wider">Statut & Décision</div>
                      {claim.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-yellow-500/10 text-yellow-500 mb-4">
                          <Clock className="w-4 h-4" /> En attente
                        </span>
                      )}
                      {claim.status === "UNDER_REVIEW" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-blue-500/10 text-blue-500 mb-4">
                          <ShieldAlert className="w-4 h-4" /> En examen
                        </span>
                      )}
                      {claim.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-green-500/10 text-green-500 mb-4">
                          <CheckCircle className="w-4 h-4" /> Approuvée
                        </span>
                      )}
                      {claim.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-red-500/10 text-red-500 mb-4">
                          <XCircle className="w-4 h-4" /> Rejetée
                        </span>
                      )}
                      
                      {claim.reviewNotes && (
                        <div className="mb-4">
                          <div className="text-xs text-[#888] font-bold mb-1 uppercase tracking-wider">Note d'examen</div>
                          <p className="text-xs text-[#AAA] italic bg-[#0A0A0A] p-2 rounded border border-[#222]">{claim.reviewNotes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      {claim.status === "PENDING" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled={processingId === claim.id}
                          className="bg-[#222] border-[#333] text-white hover:bg-[#333]"
                          onClick={() => handleReview(claim.id, "UNDER_REVIEW")}
                        >
                          Prendre en charge
                        </Button>
                      )}
                      {(claim.status === "PENDING" || claim.status === "UNDER_REVIEW") && (
                        <>
                          <Button 
                            size="sm" 
                            disabled={processingId === claim.id}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={() => handleReview(claim.id, "APPROVED")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approuver
                          </Button>
                          <Button 
                            size="sm" 
                            disabled={processingId === claim.id}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => {
                              const note = prompt("Raison du rejet (optionnelle) :");
                              if (note !== null) handleReview(claim.id, "REJECTED", note);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
