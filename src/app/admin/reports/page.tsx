"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { ShieldAlert, AlertTriangle, MessageSquare, Ban, CheckCircle, Search, User, PlayCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [page, setPage] = useState(1);
  const limit = 20;
  
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: reportsData, mutate, isLoading } = useSWR(`/admin/reports?page=${page}&limit=${limit}${statusFilter ? `&status=${statusFilter}` : ""}`, fetcher);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, status: string, action?: "SUSPEND_TARGET", note?: string) => {
    if (!confirm(`Confirmez-vous cette action ?`)) return;
    try {
      setProcessingId(id);
      await adminApi(`/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, note, action })
      });
      await mutate();
    } catch (e: any) {
      alert("Erreur: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case "PODCAST": return <PlayCircle className="w-5 h-5 text-purple-500" />;
      case "EPISODE": return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case "PERSON": return <User className="w-5 h-5 text-orange-500" />;
      case "COMMENT": return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "CREATOR_PROFILE": return <ShieldAlert className="w-5 h-5 text-[#FFBF00]" />;
      default: return <AlertTriangle className="w-5 h-5 text-[#888]" />;
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      COPYRIGHT: "bg-orange-500/10 text-orange-500",
      INAPPROPRIATE: "bg-red-500/10 text-red-500",
      SPAM: "bg-gray-500/10 text-gray-400",
      IMPERSONATION: "bg-purple-500/10 text-purple-500",
      MISINFORMATION: "bg-yellow-500/10 text-yellow-500",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colors[reason] || "bg-[#222] text-[#888]"}`}>
        {reason}
      </span>
    );
  };

  return (
    <div className="w-full pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Signalements
          </h1>
          <p className="text-[#888888]">Gérez les signalements de contenus abusifs ou inappropriés.</p>
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[#111] border border-[#222] rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#FFBF00]"
        >
          <option value="">Tous les statuts</option>
          <option value="OPEN">Ouverts</option>
          <option value="IN_REVIEW">En cours d'examen</option>
          <option value="RESOLVED">Résolus (Sanctionnés)</option>
          <option value="DISMISSED">Classés sans suite</option>
        </select>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {isLoading && !reportsData ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : reportsData?.items?.length === 0 ? (
          <div className="p-12 text-center text-[#888]">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#333]" />
            <h3 className="text-lg font-medium text-white mb-1">Tout est calme</h3>
            <p>Aucun signalement ne correspond à vos filtres.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {reportsData?.items?.map((report: any) => (
              <div key={report.id} className="p-6 hover:bg-[#161616] transition-colors">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Cible & Signalement */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getTargetIcon(report.targetType)}</div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{report.targetType}</span>
                          {getReasonBadge(report.reason)}
                        </div>
                        {report.target ? (
                          <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-lg mb-2">
                            <div className="font-bold text-white">{report.target.name || report.target.title || report.target.fullName || "Contenu ciblé"}</div>
                            <div className="text-xs text-[#888] font-mono mt-1">ID: {report.target.id}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-[#888] italic mb-2">Cible introuvable ou déjà supprimée (ID: {report.targetId})</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description & Auteur */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="text-xs text-[#888] font-bold mb-2 uppercase tracking-wider">Message du plaignant</div>
                      <p className="text-sm text-[#ccc] bg-[#0A0A0A] border border-[#222] p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                        {report.description || "Aucun détail fourni."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#888]">
                      Signalé par : <span className="font-semibold text-white">{report.reporter?.fullName || "Anonyme"}</span> 
                      {report.reporter && <span className="font-mono">({report.reporter.id})</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full lg:w-64 border-t lg:border-t-0 lg:border-l border-[#222] pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-[#888] font-bold mb-3 uppercase tracking-wider">Statut</div>
                      {report.status === "OPEN" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-red-500/10 text-red-500 mb-4">
                          <AlertTriangle className="w-4 h-4" /> Ouvert
                        </span>
                      )}
                      {report.status === "RESOLVED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-green-500/10 text-green-500 mb-4">
                          <CheckCircle className="w-4 h-4" /> Résolu
                        </span>
                      )}
                      {report.status === "DISMISSED" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold bg-[#222] text-[#888] mb-4">
                          <Ban className="w-4 h-4" /> Ignoré
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 mt-4">
                      {report.status === "OPEN" && (
                        <>
                          <Button 
                            size="sm" 
                            disabled={processingId === report.id}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold"
                            onClick={() => handleAction(report.id, "RESOLVED", "SUSPEND_TARGET")}
                          >
                            <Ban className="w-4 h-4 mr-2" /> Suspendre la cible
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={processingId === report.id}
                            className="bg-[#222] border-[#333] text-white hover:bg-[#333]"
                            onClick={() => handleAction(report.id, "DISMISSED")}
                          >
                            Classer sans suite
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
        
        {/* Pagination Simple */}
        {reportsData && reportsData.total > limit && (
          <div className="p-4 border-t border-[#222] flex items-center justify-between">
            <span className="text-xs text-[#888]">
              Affichage {((page - 1) * limit) + 1} - {Math.min(page * limit, reportsData.total)} sur {reportsData.total}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Précédent
              </Button>
              <Button size="sm" variant="ghost" disabled={page * limit >= reportsData.total} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
